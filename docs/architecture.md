# Architecture — ciganik.dev

This describes the system as it is now; the ADRs in `docs/adr/` explain
why. Update this file in the same PR as any structural change.

## What this is

`ciganik.dev` is a public consulting site with four content pages and
one dynamic endpoint, a contact form that emails me. It costs $0 to run
and has no dependency on the home network.

## System context

```
Visitor ──HTTPS──▶ Cloudflare edge (ciganik.dev, www.ciganik.dev)
                     │
                     ▼
              Worker "ciganik-dev"  ── runs first for every request
               ├─ www.* ──▶ 301 to https://ciganik.dev
               ├─ POST /api/contact ──▶ Turnstile siteverify (Cloudflare)
               │                     └▶ send_email binding ──▶ Proton inbox
               └─ everything else ──▶ ASSETS binding (Astro build in dist/)

Mail to @ciganik.dev ──MX──▶ Proton (not Cloudflare)
```

## Major components

| Component | Where | What it does |
|---|---|---|
| Static pages | `src/pages/*.astro`, `src/layouts/Base.astro`, `src/styles/global.css` | Astro builds these to plain HTML/CSS in `dist/`. Site-wide settings are in `src/config.ts`. |
| Contact enhancement | `public/contact.js` | Submits the form with `fetch` and shows the result inline. Without it, the form still works as a plain POST that redirects to `/thanks/`. |
| Worker entry | `worker/index.ts` | Handles the www→apex redirect, routes `/api/contact`, serves assets, and adds security headers (CSP, HSTS, etc.) to every response. |
| Contact handler | `worker/contact.ts` | Validates fields, checks the honeypot, verifies Turnstile on the server, and sends the email. |
| Deploy config | `wrangler.jsonc` | Worker name, assets, custom domains, `send_email` binding, and public vars. |

## Data stores

None. Contact submissions aren't stored. They exist only as the email in
my Proton inbox.

## External dependencies

| Dependency | Used for | Notes |
|---|---|---|
| Cloudflare Workers + static assets | Hosting | Free plan (ADR-0001) |
| Cloudflare Workers Builds | Git-push deploys, branch Previews | Connected to `vpciii/ciganik.dev` |
| Cloudflare Email Service (`send_email`) | Contact-form delivery | Free only to verified destination addresses; the binding is restricted to my inbox |
| Cloudflare Turnstile | Bot check on the form | Loaded only on `/contact/` |
| Cloudflare Web Analytics | Visit counts | Cookieless; injected at the edge |
| Cloudflare DNS | `ciganik.dev` zone | Namecheap stays the registrar |
| Proton Mail | Inbound mail for `@ciganik.dev` | Apex MX/SPF/DKIM/DMARC |
| Cal.com | Booking intro calls | Plain outbound link, no embed |

## Trust boundaries

- **The browser is untrusted.** `/api/contact` re-validates every field
  on the server and enforces length limits. Turnstile is verified on the
  server, never trusted from the client. Newlines are stripped from
  anything that goes into a header.
- **Secrets:** `TURNSTILE_SECRET` lives only as a Worker secret
  (`wrangler secret put`), and `.dev.vars` is git-ignored. gitleaks runs
  in CI (SC-5).
- **Outbound email:** the `send_email` binding has
  `allowed_destination_addresses` set to my own inbox, so even a bug
  can't turn the form into a relay to arbitrary recipients.
- **Third-party code:** the CSP allows scripts only from self, Turnstile,
  and Cloudflare Insights. SC-4 enforces this on the built HTML.

## Shape-defining decisions

- ADR-0001: host on Cloudflare Workers with static assets.
- ADR-0002: site and test stack (Astro, Vitest, Playwright + axe).
