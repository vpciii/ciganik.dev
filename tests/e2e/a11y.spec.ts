// SC-6: axe reports no serious or critical WCAG 2.1 AA violations on any page,
// at phone (375px) and desktop widths (R-9). Also checks no horizontal scroll
// at phone width.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = ["/", "/services/", "/about/", "/contact/", "/thanks/"];
const VIEWPORTS = [
  { name: "phone", width: 375, height: 812 },
  { name: "desktop", width: 1280, height: 900 },
];

for (const vp of VIEWPORTS) {
  for (const path of PAGES) {
    for (const scheme of ["light", "dark"] as const) {
      test(`SC-6 ${path} @ ${vp.name} (${scheme})`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.emulateMedia({ colorScheme: scheme });
        // Keep the run hermetic: don't load the third-party Turnstile widget.
        await page.route("https://challenges.cloudflare.com/**", (r) => r.abort());
        await page.goto(path);

        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);

        if (vp.name === "phone") {
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          expect(overflow).toBeLessThanOrEqual(0);
        }
      });
    }
  }
}
