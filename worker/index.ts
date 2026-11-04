// Worker entry (ADR-0001). Runs first for every request so it can:
//   1. redirect www.ciganik.dev to the apex (spec R-1),
//   2. handle POST /api/contact (R-4),
//   3. serve the static Astro build with security headers.

import { handleContact, type ContactEnv } from "./contact";

export interface Env extends ContactEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export const APEX = "ciganik.dev";

// Only self, Turnstile, and Cloudflare Web Analytics may load scripts or
// frames (R-5, SC-4).
export const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
    "frame-src https://challenges.cloudflare.com",
    "connect-src 'self' https://cloudflareinsights.com",
    "img-src 'self' data:",
    "style-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join("; "),
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
};

export function withSecurityHeaders(res: Response): Response {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
  return out;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === `www.${APEX}`) {
      url.hostname = APEX;
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/api/contact") {
      return withSecurityHeaders(await handleContact(request, env));
    }
    if (url.pathname.startsWith("/api/")) {
      return withSecurityHeaders(new Response("Not found", { status: 404 }));
    }

    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
};
