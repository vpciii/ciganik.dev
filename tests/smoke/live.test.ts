// SC-1: post-deploy smoke test against the live site (R-1, R-2 from outside).
// Skipped unless SMOKE=1, since it needs the real deployment:
//   npm run test:smoke
import { describe, expect, it } from "vitest";

const APEX = "https://ciganik.dev/";

describe.runIf(process.env.SMOKE === "1")("SC-1 live site", () => {
  it("serves the apex over valid HTTPS with 200", async () => {
    // fetch() rejects on an invalid certificate, so a 200 here also proves the cert.
    const res = await fetch(APEX, { redirect: "manual" });
    expect(res.status).toBe(200);
    expect(res.headers.get("strict-transport-security")).toMatch(/max-age=\d+/);
  });

  it.each([
    ["http://ciganik.dev/", APEX],
    ["https://www.ciganik.dev/", APEX],
    ["http://www.ciganik.dev/", null],
  ])("redirects %s to the apex with 301", async (from, to) => {
    let res = await fetch(from, { redirect: "manual" });
    expect(res.status).toBe(301);
    // http://www may hop through https://www first; follow at most one more hop.
    if (to === null && res.headers.get("location") !== APEX) {
      res = await fetch(res.headers.get("location")!, { redirect: "manual" });
      expect(res.status).toBe(301);
    }
    expect(res.headers.get("location")).toBe(APEX);
  });
});
