import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://localhost:4321", ...devices["Desktop Chrome"] },
  webServer: {
    // --ignore-lock: Astro 7 refuses to start if it thinks another preview
    // is running; Playwright owns this process's lifecycle.
    command: "npx astro preview --port 4321 --ignore-lock",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
  },
});
