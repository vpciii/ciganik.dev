import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://ciganik.dev",
  trailingSlash: "always",
  build: {
    format: "directory",
    // Emit <link> stylesheets rather than inline <style>, so the CSP can
    // keep style-src to 'self'.
    inlineStylesheets: "never",
  },
});
