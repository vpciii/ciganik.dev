// SC-3: contact handler — valid + verified submissions are sent; missing or
// failed Turnstile tokens and missing fields get a 4xx and nothing is sent.
import { describe, expect, it, vi } from "vitest";
import { handleContact, type ContactEnv, type FetchLike } from "../../worker/contact";

function makeEnv() {
  const send = vi.fn().mockResolvedValue({ messageId: "m-1" });
  const env: ContactEnv = {
    EMAIL: { send },
    TURNSTILE_SECRET: "test-secret",
    CONTACT_TO: "hello@ciganik.dev",
    CONTACT_FROM: "contact@ciganik.dev",
  };
  return { env, send };
}

const turnstile = (success: boolean): FetchLike =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify({ success }), { status: 200 }));

function post(fields: Record<string, string>, accept = "application/json") {
  const body = new URLSearchParams(fields);
  return new Request("https://ciganik.dev/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: accept },
    body,
  });
}

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  organization: "Analytical Engines",
  message: "We'd like help adopting AI tools.",
  "cf-turnstile-response": "token-abc",
};

describe("SC-3 contact handler", () => {
  it("sends a valid submission with a passing Turnstile token", async () => {
    const { env, send } = makeEnv();
    const verify = turnstile(true);
    const res = await handleContact(post(valid), env, verify);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(send).toHaveBeenCalledTimes(1);
    const msg = send.mock.calls[0][0];
    expect(msg.to).toBe("hello@ciganik.dev");
    expect(msg.from.email).toBe("contact@ciganik.dev");
    expect(msg.replyTo).toEqual({ email: "ada@example.com", name: "Ada Lovelace" });
    expect(msg.text).toContain("We'd like help adopting AI tools.");

    // The secret and token go to Turnstile's siteverify endpoint.
    const [url, init] = (verify as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    const sent = init.body as FormData;
    expect(sent.get("secret")).toBe("test-secret");
    expect(sent.get("response")).toBe("token-abc");
  });

  it("redirects a plain (no-JS) form post to /thanks/ on success", async () => {
    const { env, send } = makeEnv();
    const res = await handleContact(post(valid, "text/html"), env, turnstile(true));
    expect(res.status).toBe(303);
    expect(res.headers.get("Location")).toBe("/thanks/");
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("rejects a missing Turnstile token with 400 and sends nothing", async () => {
    const { env, send } = makeEnv();
    const { "cf-turnstile-response": _omit, ...noToken } = valid;
    const verify = turnstile(true);
    const res = await handleContact(post(noToken), env, verify);
    expect(res.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
    expect(verify).not.toHaveBeenCalled();
  });

  it("rejects a failed Turnstile verification with 403 and sends nothing", async () => {
    const { env, send } = makeEnv();
    const res = await handleContact(post(valid), env, turnstile(false));
    expect(res.status).toBe(403);
    expect(send).not.toHaveBeenCalled();
  });

  it("treats a Turnstile network error as a failed verification", async () => {
    const { env, send } = makeEnv();
    const broken: FetchLike = vi.fn().mockRejectedValue(new Error("network"));
    const res = await handleContact(post(valid), env, broken);
    expect(res.status).toBe(403);
    expect(send).not.toHaveBeenCalled();
  });

  it.each(["name", "email", "message"])("rejects a missing %s with 400 and sends nothing", async (key) => {
    const { env, send } = makeEnv();
    const res = await handleContact(post({ ...valid, [key]: "  " }), env, turnstile(true));
    expect(res.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects an invalid email address with 400", async () => {
    const { env, send } = makeEnv();
    const res = await handleContact(post({ ...valid, email: "not-an-email" }), env, turnstile(true));
    expect(res.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects an over-long message with 400", async () => {
    const { env, send } = makeEnv();
    const res = await handleContact(post({ ...valid, message: "x".repeat(5001) }), env, turnstile(true));
    expect(res.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("silently drops honeypot submissions without sending", async () => {
    const { env, send } = makeEnv();
    const verify = turnstile(true);
    const res = await handleContact(post({ ...valid, website: "spam.example" }), env, verify);
    expect(res.status).toBe(200);
    expect(send).not.toHaveBeenCalled();
    expect(verify).not.toHaveBeenCalled();
  });

  it("rejects non-POST and non-form requests with 4xx", async () => {
    const { env, send } = makeEnv();
    const get = new Request("https://ciganik.dev/api/contact", { headers: { Accept: "application/json" } });
    expect((await handleContact(get, env, turnstile(true))).status).toBe(405);
    const json = new Request("https://ciganik.dev/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(valid),
    });
    expect((await handleContact(json, env, turnstile(true))).status).toBe(415);
    expect(send).not.toHaveBeenCalled();
  });

  it("strips newlines from the name so it can't inject into the subject", async () => {
    const { env, send } = makeEnv();
    await handleContact(post({ ...valid, name: "Eve\r\nBcc: x@evil.test" }), env, turnstile(true));
    expect(send.mock.calls[0][0].subject).not.toMatch(/[\r\n]/);
  });

  it("returns 502 and an email fallback when sending fails", async () => {
    const { env, send } = makeEnv();
    send.mockRejectedValueOnce(Object.assign(new Error("boom"), { code: "E_DELIVERY_FAILED" }));
    const res = await handleContact(post(valid), env, turnstile(true));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/email me/i);
  });
});
