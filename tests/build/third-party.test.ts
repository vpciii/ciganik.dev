// SC-4: no third-party scripts or frames beyond the allowlist (self,
// Cloudflare Turnstile, Cloudflare Web Analytics) — so no tracking, no
// consent banner (R-5).
import { beforeAll, describe, expect, it } from "vitest";
import { htmlFiles, read, rel, requireDist } from "./helpers";

const ALLOWED_ORIGINS = new Set([
  "https://challenges.cloudflare.com",
  "https://static.cloudflareinsights.com",
]);

function externalOrigins(html: string): string[] {
  const out: string[] = [];
  const re = /<(script|iframe|link)\b[^>]*\b(?:src|href)="([^"]+)"[^>]*>/gi;
  for (const m of html.matchAll(re)) {
    const [tag, kind, url] = m;
    // <link> only matters when it loads a resource (stylesheet, preload, etc.).
    if (kind.toLowerCase() === "link" && !/rel="(stylesheet|preload|modulepreload|prefetch)"/i.test(tag)) continue;
    if (/^https?:\/\//i.test(url) || url.startsWith("//")) out.push(new URL(url, "https://ciganik.dev").origin);
  }
  return out;
}

describe("SC-4 third-party allowlist", () => {
  beforeAll(requireDist);

  it("finds built pages to check", () => {
    expect(htmlFiles().length).toBeGreaterThanOrEqual(5);
  });

  it("loads scripts, frames, and stylesheets only from self or the allowlist", () => {
    const violations = htmlFiles().flatMap((f) =>
      externalOrigins(read(f))
        .filter((o) => !ALLOWED_ORIGINS.has(o))
        .map((o) => `${rel(f)}: ${o}`),
    );
    expect(violations).toEqual([]);
  });

  it("only the contact page loads Turnstile", () => {
    for (const f of htmlFiles()) {
      const loads = read(f).includes("challenges.cloudflare.com");
      expect(loads, rel(f)).toBe(rel(f) === "contact/index.html");
    }
  });

  it("detects a disallowed origin (self-check of the scanner)", () => {
    expect(externalOrigins('<script src="https://www.googletagmanager.com/gtag/js"></script>')).toEqual([
      "https://www.googletagmanager.com",
    ]);
  });
});
