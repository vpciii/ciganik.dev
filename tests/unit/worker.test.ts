// Worker routing: www -> apex redirect (R-1) and security headers (R-5).
import { describe, expect, it, vi } from "vitest";
import worker, { SECURITY_HEADERS, type Env } from "../../worker/index";

function makeEnv(): Env {
  return {
    ASSETS: { fetch: vi.fn().mockResolvedValue(new Response("<h1>hi</h1>", { status: 200 })) },
    EMAIL: { send: vi.fn() },
    TURNSTILE_SECRET: "s",
    CONTACT_TO: "hello@ciganik.dev",
    CONTACT_FROM: "contact@ciganik.dev",
  };
}

describe("worker routing", () => {
  it("301-redirects www to the apex, keeping path and query", async () => {
    const res = await worker.fetch(new Request("https://www.ciganik.dev/services/?a=1"), makeEnv());
    expect(res.status).toBe(301);
    expect(res.headers.get("Location")).toBe("https://ciganik.dev/services/?a=1");
  });

  it("serves static assets with security headers", async () => {
    const env = makeEnv();
    const res = await worker.fetch(new Request("https://ciganik.dev/"), env);
    expect(res.status).toBe(200);
    expect(env.ASSETS.fetch).toHaveBeenCalledTimes(1);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) expect(res.headers.get(k)).toBe(v);
  });

  it("404s unknown /api routes without touching assets", async () => {
    const env = makeEnv();
    const res = await worker.fetch(new Request("https://ciganik.dev/api/nope"), env);
    expect(res.status).toBe(404);
    expect(env.ASSETS.fetch).not.toHaveBeenCalled();
  });
});
