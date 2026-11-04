// SC-2: the build contains the home, services, about, and contact pages, and
// they offer both ways to start a conversation (contact form + booking link).
import { existsSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { site } from "../../src/config";
import { DIST, read, requireDist } from "./helpers";

const page = (p: string) => read(join(DIST, p, "index.html"));

describe("SC-2 required pages", () => {
  beforeAll(requireDist);

  it.each(["", "services", "about", "contact"])("builds /%s", (p) => {
    expect(existsSync(join(DIST, p, "index.html"))).toBe(true);
  });

  it("home says who I am and links to services, booking, and contact", () => {
    const html = page("");
    expect(html).toContain(site.name);
    expect(html).toContain('href="/services/"');
    expect(html).toContain(`href="${site.bookingUrl}"`);
    expect(html).toContain('href="/contact/"');
  });

  it("services page lists the five services", () => {
    const html = page("services");
    for (const id of ["ai-assisted-development", "ai-features", "architecture", "regulated-systems", "leadership"]) {
      expect(html).toContain(`id="${id}"`);
    }
  });

  it("contact page has the form posting to /api/contact with required fields and Turnstile", () => {
    const html = page("contact");
    expect(html).toMatch(/<form[^>]*method="post"[^>]*action="\/api\/contact"/);
    for (const name of ["name", "email", "message"]) {
      expect(html).toMatch(new RegExp(`name="${name}"[^>]*required|required[^>]*name="${name}"`));
    }
    expect(html).toContain('class="cf-turnstile"');
    expect(html).toContain(`href="${site.bookingUrl}"`);
  });

  it("never publishes a street address or phone number", () => {
    // Generic patterns on purpose: this repo is public, so the real address
    // and number must not appear here either.
    const phone = /\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/;
    const street = /\b\d{1,5}\s+[A-Z][a-z]+\s+(Lane|Ln|Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Court|Ct)\b/;
    for (const p of ["", "services", "about", "contact", "thanks"]) {
      const html = page(p);
      expect(html).not.toMatch(phone);
      expect(html).not.toMatch(street);
    }
  });
});
