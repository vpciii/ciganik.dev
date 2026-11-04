# Working notes for AI agents in this repo

This file orients an AI coding agent for **ciganik.dev**. The global
practices live in `$METHODOLOGY_HOME/methodology.md` (default
`~/Developer/methodology`).

## Read first, every session

1. `docs/architecture.md` describes the current shape (Worker + static Astro build).
2. `docs/glossary.md` defines the terms to use.
3. `docs/adr/` holds binding decisions; read the newest first.
4. `specs/site-launch/spec.md` has the requirements (`R-n`) and success criteria (`SC-n`).

## Hard rules

All of the methodology's hard rules apply: spec-first, ADRs, small PRs,
tests citing `SC-n`, no secrets in the repo, and docs updated in the same
PR as the behavior they describe. Project-specific rules:

- **Never name the nonprofit** where I serve as volunteer CIO. Describe it
  generically, e.g. "a nonprofit that connects new mothers with mentors."
- **No home address or phone number** anywhere on the site
  (`tests/build/pages.test.ts` checks this).
- **No third-party scripts** beyond Turnstile and Cloudflare Web Analytics
  (R-5; SC-4 and the CSP in `worker/index.ts` enforce it). Adding one
  needs an ADR.
- **The contact form emails only my own verified inbox** (ADR-0001). Never
  send mail to the visitor.
- **Page copy** comes from `content/draft-copy.md`. Change both together.

## What this file is not

It's a pointer, not the methodology. If it conflicts with an ADR, the ADR wins.
