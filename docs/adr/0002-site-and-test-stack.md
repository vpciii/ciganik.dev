# ADR 0002: Site and test stack (Astro, Vitest, Playwright + axe)

- **Status:** Accepted
- **Date:** 2026-11-04
- **Deciders:** vpc

## Context

The spec (`specs/site-launch/spec.md`) calls for:

- static pages with almost no client-side JavaScript;
- tests over the build output (SC-2, SC-4);
- unit tests on the contact handler (SC-3);
- an automated accessibility check at phone and desktop widths (SC-6);
- a secret scan in CI (SC-5).

Every dependency is a decision (methodology: "Dependencies are
decisions"), so the set is kept small and recorded here.

## Decision

We will use:

| Dependency | Role | Why this one |
|---|---|---|
| `astro` 7.x | Static site generator; builds to `dist/` | Outputs plain HTML by default with zero JS unless asked. Components and layouts keep the pages consistent. MIT, very active. |
| `wrangler` 4.x (dev) | Local dev, deploy, Worker bundling | Cloudflare's own CLI. Required for ADR-0001. |
| `vitest` 5.x (dev) | Unit tests (contact handler) and build-output tests | Fast, TS-native, no config needed. MIT. |
| `@playwright/test` 1.x + `@axe-core/playwright` 4.x (dev) | Accessibility check in a real browser at 375px and desktop widths | axe-core is the de facto WCAG rules engine. Playwright is the standard way to drive it. Apache-2.0 / MPL-2.0. |
| `gitleaks` (GitHub Action, not an npm dep) | Secret scan on every PR | Widely used, and needs no account for public repos. |

Exact versions are pinned by `package-lock.json`, which is committed.
Node is pinned via `.nvmrc`.

Not added, on purpose:
- **A CSS framework** (Tailwind etc.). One hand-written stylesheet with
  design tokens is enough for five pages.
- **A UI framework** (React etc.). There is nothing interactive beyond
  one form.
- **A separate TypeScript compiler or `@astrojs/check`.** Astro and
  wrangler transpile TS themselves. Type-checking can be added later if
  the code grows.
- **An HTML-parser library for the output tests.** Simple regexes over
  our own generated HTML are enough for SC-2 and SC-4.

## Alternatives considered

- **Hugo / Eleventy.** Both are excellent static generators. Astro won
  because it is TS/JS end to end, the same language as the Worker and
  the tests, so there is one toolchain.
- **Plain HTML, no generator.** Fewest dependencies. Rejected: the
  header, footer, and head metadata would be copied across every page by
  hand, which the methodology warns against ("don't hand-sync verbatim
  copies").
- **pa11y / Lighthouse CI for accessibility.** Both are viable. axe via
  Playwright gives per-rule failures with element selectors and runs at
  explicit viewport sizes, which SC-6 requires.

## Consequences

- **Easier:** one language and one `npm test`; adding a page means adding
  one `.astro` file.
- **Harder:** Playwright downloads a browser (Chromium) for local and CI
  runs, roughly 150 MB. CI caches it.
- **Supply chain:** five direct dev or build dependencies, all from
  established maintainers. Dependabot alerts are on for the repo.

## Adoption impact

None beyond this repo.

## References

- ADR-0001 (hosting)
- [Astro](https://astro.build) · [Vitest](https://vitest.dev) · [Playwright](https://playwright.dev) · [axe-core](https://github.com/dequelabs/axe-core) · [gitleaks](https://github.com/gitleaks/gitleaks)
