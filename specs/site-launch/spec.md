# Spec: Consulting site launch (ciganik.dev)

- **Status:** Approved
- **Date:** 2026-11-04
- **Author:** vpc (drafted with Claude)
- **Related ADRs:** ADR-0001 (hosting on Cloudflare Workers), ADR-0002 (site and test stack)

> This spec is editable while `Draft` / `Under review` / `Approved`.
> When it reaches `Implemented` it **freezes** into a historical record;
> a contradiction found later goes to a test, a new spec, or an ADR —
> not back into this file.

## Problem

I want to take on consulting clients, and I have no public site to send
them to. A prospective client has nowhere to learn what I do, judge
whether I'm a fit, or start a conversation with me except by email.

My home network is not a place to host anything public. I don't want
inbound firewall openings at home, and `ciganik.com` already doubles as
my LAN's internal domain. I've registered `ciganik.dev` (Namecheap,
2026-11-04) to serve as the separate public, client-facing identity.

## Goals

1. A prospective client can land on `ciganik.dev`, understand what I
   offer and who I am, and contact me or book a call in under a minute.
2. The site looks credible and professional on phone and desktop.
3. It costs nothing to run beyond the domain, and nothing about it
   touches my home network.
4. Updating it is a git push.

## Non-goals

- A blog or CMS. A blog can come later as its own spec.
- Client portals, logins, payments, or invoicing.
- Hosting anything at home or in my AWS account.
- Changing anything about `ciganik.com` (its DNS, email, or apex record).

## Requirements

- **R-1 (MUST)** The site is served at `https://ciganik.dev` over valid
  HTTPS, and `www.ciganik.dev` redirects permanently to the apex.
- **R-2 (MUST NOT)** The site depends on any component on my home network
  or needs any inbound firewall rule there.
- **R-3 (MUST)** The site presents, at minimum: who I am, the services I
  offer, and two ways to start a conversation (a contact form and a link
  to book a call).
- **R-4 (MUST)** The contact form delivers each valid submission to my
  inbox and rejects submissions that fail bot verification or are missing
  required fields.
- **R-5 (MUST NOT)** The site sets non-essential cookies or loads
  third-party tracking scripts. No consent banner should be needed.
- **R-6 (MUST)** A push to `main` deploys to production automatically, and
  other branches get preview deployments.
- **R-7 (MUST NOT)** Any secret (API token, Turnstile secret key) is
  committed to the repo. Secrets live in Cloudflare's environment settings.
- **R-8 (SHOULD)** Hosting stays within free tiers, so the running cost is
  the domain alone.
- **R-9 (SHOULD)** Every page meets WCAG 2.1 AA and is usable at 375px width.
- **R-10 (SHOULD)** Pages are fast: Lighthouse performance of 90 or above on mobile.

## Success criteria

- **SC-1** — A post-deploy smoke test confirms `https://ciganik.dev` returns
  200 with a valid certificate, and that `http://` and `www.` both
  redirect to it with a 301 status. *(R-1)*
- **SC-2** — A build-output test confirms the home, services, and contact
  pages exist and include the contact form and booking link. *(R-3)*
- **SC-3** — Unit tests on the contact handler: a valid submission with a
  passing Turnstile token is sent. A missing or failed token, or missing
  required fields, gets a 4xx and nothing is sent. *(R-4)*
- **SC-4** — A build-output test scans the HTML for script and iframe
  origins and fails on anything outside an allowlist: self, plus
  Cloudflare Turnstile and Cloudflare Web Analytics. *(R-5)*
- **SC-5** — CI runs a secret scan (gitleaks) on every PR. *(R-7)*
- **SC-6** — An automated accessibility check (axe via Playwright) on every
  page at 375px and desktop widths reports no serious or critical
  violations. *(R-9)*
- **SC-7** — Manual check at launch: a push to `main` updates production,
  and a branch push produces a preview URL. *(R-6)* This is recorded here
  rather than automated, because it tests the platform, not our code.

R-2 is met by construction (the Approach below has no home component), and
SC-1 checks it from outside. R-8 and R-10 are checked by hand at launch.

## Approach

- **Site:** [Astro](https://astro.build), outputting static HTML with almost
  no client-side JavaScript. Plain CSS with design tokens, light and dark
  themes.
- **Hosting:** Cloudflare Pages connected to a GitHub repo for git-push
  deploys and branch previews. Free tier.
- **DNS:** point `ciganik.dev`'s nameservers from Namecheap to Cloudflare
  (free plan). Namecheap stays the registrar. This is required, not just
  convenient: Pages only serves an apex custom domain when that domain is
  a zone on the same Cloudflare account
  ([Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/#add-a-custom-apex-domain)).
  It also puts the `www` redirect and certificates in the same place.
- **Contact form:** a Pages Function at `/api/contact`. It validates the
  fields, verifies the Cloudflare Turnstile token on the server, and emails
  me with the `send_email` binding from Cloudflare Email Service. Sending
  adds its bounce MX records only on the `cf-bounce` subdomain
  ([Send emails](https://developers.cloudflare.com/email-service/get-started/send-emails/)),
  so Proton can still handle mail for the domain itself. No third-party
  form service. Cost: sending to a *verified destination address* in the
  account is free on every plan and doesn't count against any quota
  ([Email Service pricing](https://developers.cloudflare.com/email-service/platform/pricing/)).
  The form only ever emails my own Proton inbox, so verify that address
  as a destination and it stays on the Workers Free plan. To confirm
  during implementation: verifying a destination address doesn't need
  Email Routing (and its apex MX records) turned on for `ciganik.dev`,
  which would take inbound mail away from Proton.
- **Booking:** a plain link to a Cal.com booking page, not an embed, so
  no third-party scripts or cookies end up on the site.
- **Analytics:** Cloudflare Web Analytics (cookieless).
- **CI:** GitHub Actions runs the build, the tests for SC-2, SC-3, SC-4,
  and SC-6, and gitleaks for SC-5. Cloudflare's git integration handles
  deploys.

### Decisions

- *2026-11-04* — Use `ciganik.dev` rather than `ciganik.com`, keeping the
  public identity separate from the home LAN's internal domain.
- *2026-11-04* — `ciganik.dev` DNS moves to Cloudflare (free plan), and
  Namecheap stays the registrar. This keeps the site on the bare domain,
  with the site, certificates, and contact form in one account. GitHub
  Pages with Namecheap DNS was the alternative; it was rejected because it
  would route contact-form data through a third-party form service. Before
  the move, the domain had no DNSSEC DS record, so there was nothing to
  disable first.
- *2026-11-04, re-agreed by vpc the same day; supersedes the Hosting and
  Contact-form bullets above (ADR-0001)* — Host on **Cloudflare
  Workers with static assets** instead of Cloudflare Pages. Reason: the
  Pages compatibility matrix lists Email Workers (the `send_email`
  binding the contact form relies on) as **not supported on Pages**
  ([Migrate from Pages to Workers](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/#compatibility-matrix)).
  Cloudflare's Pages overview also now points new projects to Workers.
  What changes:
  - The contact handler becomes a Worker route (`/api/*`, run before
    assets) rather than a Pages Function.
  - Git-push deploys and branch previews come from Workers Builds.
  - The apex custom domain still works, since the zone is already on
    Cloudflare.

  The requirements and success criteria don't change.
- *2026-11-04* — Positioning: the site leads with AI development
  (AI-assisted development and AI-powered features/agents). Healthcare and
  regulated systems appear as depth, not as the focus. The nonprofit CIO
  role is described generically and never named. No photo.
- *2026-11-04* — Email for `ciganik.dev` runs on Proton (an address like
  `hello@ciganik.dev`). Proton's MX, SPF, DKIM, and DMARC records go on the
  apex. The contact form sends from a `ciganik.dev` address to that inbox.
  Before launch, check that SPF and DKIM pass for form mail, so Proton
  doesn't flag it as spam.

## Rollout and undo

The domain is new and has no traffic, so the risk is low. Undo options:
- Delete the Worker or roll back to an earlier deployment in Cloudflare.
- Point the nameservers back to Namecheap.

Nothing here is irreversible.

## Open questions

- [x] **Content.** Resolved 2026-11-04: copy v2 in `content/draft-copy.md`.
  Tagline "Build with AI. Ship software you can trust." Name Vincent P.
  Ciganik III; no rates; "a small number of interesting projects";
  all three public repos linked.
- [x] **Email on ciganik.dev.** Resolved 2026-11-04: add the domain to
  Proton (see Decisions).
- [x] **DNS host.** Resolved 2026-11-04: move nameservers to Cloudflare
  (see Decisions).
- [x] **Booking tool.** Resolved 2026-11-04: Cal.com, free tier. Confirm
  at setup that the free tier covers one 30-minute intro event linked to
  my calendar.
- [x] **Repo visibility.** Resolved 2026-11-04: public GitHub repo
  (`vpciii/ciganik.dev`). It doubles as a portfolio piece, and no secrets live in it (R-7).

## Out of scope (for now)

- A blog or writing section.
- Case studies or testimonials pages, until there's client work to show.
- Reviewing `ciganik.com`'s public DNS records (tracked privately, not in this public repo).

## Traceability

| Criterion | Requirement(s) | Verified by (test) |
|---|---|---|
| SC-1 | R-1, R-2 | `tests/smoke/live.test.ts` (run post-deploy with npm run test:smoke) |
| SC-2 | R-3 | `tests/build/pages.test.ts` |
| SC-3 | R-4 | `tests/unit/contact.test.ts` |
| SC-4 | R-5 | `tests/build/third-party.test.ts` |
| SC-5 | R-7 | `.github/workflows/ci.yml` (gitleaks job) |
| SC-6 | R-9 | `tests/e2e/a11y.spec.ts` |
| SC-7 | R-6 | `docs/launch-checklist.md` (manual, recorded at launch) |
