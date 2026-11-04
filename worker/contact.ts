// POST /api/contact: validate, verify Turnstile, email the submission to my
// own inbox (spec R-4, ADR-0001). Pure request -> response so it can be unit
// tested without the Workers runtime (SC-3).

export interface SendEmail {
  send(message: {
    to: string;
    from: { email: string; name?: string };
    replyTo?: { email: string; name?: string };
    subject: string;
    text: string;
  }): Promise<{ messageId: string }>;
}

export interface ContactEnv {
  EMAIL: SendEmail;
  /** Turnstile secret key; a Worker secret, never committed (R-7). */
  TURNSTILE_SECRET: string;
  /** My inbox; must be a verified destination address (free sending). */
  CONTACT_TO: string;
  /** A ciganik.dev sender address onboarded in Email Service. */
  CONTACT_FROM: string;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const LIMITS = { name: 200, email: 320, organization: 200, message: 5000 } as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Outcome = { status: number; error?: string };

export async function handleContact(
  request: Request,
  env: ContactEnv,
  fetchImpl: FetchLike = fetch,
): Promise<Response> {
  const wantsJson = (request.headers.get("Accept") ?? "").includes("application/json");
  const outcome = await process(request, env, fetchImpl);
  return respond(outcome, wantsJson);
}

async function process(request: Request, env: ContactEnv, fetchImpl: FetchLike): Promise<Outcome> {
  if (request.method !== "POST") return { status: 405, error: "Method not allowed." };

  const type = request.headers.get("Content-Type") ?? "";
  if (!type.includes("multipart/form-data") && !type.includes("application/x-www-form-urlencoded")) {
    return { status: 415, error: "Unsupported content type." };
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return { status: 400, error: "Couldn't read the form." };
  }

  const field = (key: string) => {
    const v = form.get(key);
    return typeof v === "string" ? v.trim() : "";
  };

  // Honeypot: real people never fill this. Pretend success, send nothing.
  if (field("website")) return { status: 200 };

  const name = field("name");
  const email = field("email");
  const organization = field("organization");
  const message = field("message");

  if (!name || !email || !message) {
    return { status: 400, error: "Please fill in your name, email, and message." };
  }
  if (!EMAIL_RE.test(email)) return { status: 400, error: "Please enter a valid email address." };
  if (
    name.length > LIMITS.name ||
    email.length > LIMITS.email ||
    organization.length > LIMITS.organization ||
    message.length > LIMITS.message
  ) {
    return { status: 400, error: "One of the fields is too long." };
  }

  const token = field("cf-turnstile-response");
  if (!token) return { status: 400, error: "Please complete the verification check." };

  const verified = await verifyTurnstile(token, request.headers.get("CF-Connecting-IP"), env, fetchImpl);
  if (!verified) return { status: 403, error: "Verification failed. Please try again." };

  const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ");
  try {
    await env.EMAIL.send({
      to: env.CONTACT_TO,
      from: { email: env.CONTACT_FROM, name: "ciganik.dev contact form" },
      replyTo: { email, name: oneLine(name) },
      subject: oneLine(`Website inquiry from ${name}${organization ? ` (${organization})` : ""}`),
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Organization: ${organization || "-"}`,
        "",
        message,
      ].join("\n"),
    });
  } catch (err) {
    const code = (err as { code?: string }).code ?? "unknown";
    console.error("contact: send failed", code);
    return { status: 502, error: "Your message couldn't be sent. Please email me instead." };
  }

  return { status: 200 };
}

async function verifyTurnstile(
  token: string,
  ip: string | null,
  env: ContactEnv,
  fetchImpl: FetchLike,
): Promise<boolean> {
  const body = new FormData();
  body.append("secret", env.TURNSTILE_SECRET);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);
  try {
    const res = await fetchImpl(SITEVERIFY, { method: "POST", body });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

function respond({ status, error }: Outcome, wantsJson: boolean): Response {
  if (wantsJson) {
    return new Response(JSON.stringify(error ? { ok: false, error } : { ok: true }), {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
  if (!error) return new Response(null, { status: 303, headers: { Location: "/thanks/" } });
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Message not sent</title><p>${escapeHtml(error)}</p><p><a href="/contact/">Back to the contact page</a></p></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
