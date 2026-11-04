# ADR 0001: Host on Cloudflare Workers with static assets

- **Status:** Accepted
- **Date:** 2026-11-04
- **Deciders:** vpc

## Context

`ciganik.dev` is a public consulting site. It is mostly static pages,
plus one dynamic endpoint: a contact form that emails me. These
constraints come from the spec (`specs/site-launch/spec.md`):

- No dependency on the home network and no inbound firewall rules (R-2).
- The site is served at the bare domain `ciganik.dev` (R-1).
- Running cost stays at $0 beyond the domain (R-8).
- Git-push deploys with branch previews (R-6).
- Contact-form submissions never pass through a third-party form
  service. The spec's decision log records this as the reason GitHub
  Pages was rejected.

The domain's DNS is already on Cloudflare, and email for the domain is
on Proton.

The spec first chose Cloudflare Pages. While checking during
implementation, I found that Pages does not support the Email Workers
`send_email` binding the contact form depends on. It is listed as
unsupported in Cloudflare's Pages-vs-Workers compatibility matrix. That
forced this decision.

## Decision

We will host the site as a single **Cloudflare Worker with static
assets**:

- Astro builds the pages to `dist/`, and the Worker serves them as assets.
- The Worker runs first only for `/api/*`. `POST /api/contact` verifies
  Cloudflare Turnstile and emails the submission to my verified Proton
  address through the `send_email` binding.
- Workers Builds, connected to the GitHub repo, deploys `main` to
  production and builds other branches as Previews.

## Alternatives considered

- **Cloudflare Pages + Pages Functions.** This was the spec's original
  choice, and it has the simplest git-push setup. Rejected: no
  `send_email` binding, and Cloudflare now points new projects to
  Workers.
- **Pages + a third-party email API (e.g. Resend).** This would keep
  Pages. Rejected: it adds a second vendor and an API key secret just to
  route around a platform gap, and the form data would pass through that
  third party.
- **GitHub Pages + a form service (Formspree).** DNS could have stayed at
  Namecheap. Rejected in the spec: form data would go through a third
  party, and there would be one more account to manage.
- **S3 + CloudFront (+ Lambda/SES for the form).** This would keep
  everything in my AWS account. Rejected: more moving parts for the
  same result, and SES needs its own domain verification and
  sandbox-exit request.

## Consequences

- **Easier:**
  - One account and one deploy unit cover DNS, certificates, pages, the
    form endpoint, and email.
  - Adding more dynamic routes later is trivial.
- **Harder:**
  - The project is tied to Cloudflare-specific APIs: `send_email`,
    the assets binding, and `wrangler.jsonc`. Moving off Cloudflare
    would mean rewriting the ~100-line contact handler. The static pages
    are portable to any host.
- **Constraint:** `send_email` is free only for *verified destination
  addresses*. The form must only ever email my own inbox, never the
  visitor. An auto-reply to the visitor would need the Workers Paid plan
  (spec R-8).
- **To verify at setup:** verifying a destination address must not
  require turning on Email Routing for `ciganik.dev`. Email Routing
  would take over the apex MX records from Proton. If it turns out to be
  required, supersede this ADR rather than turning it on.

## Adoption impact

None beyond this repo. `wrangler.jsonc` is the deploy configuration;
the Turnstile secret and destination address are set in Cloudflare,
never committed (spec R-7).

## References

- Spec: `specs/site-launch/spec.md` (Decisions, 2026-11-04)
- [Migrate from Pages to Workers: compatibility matrix](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/#compatibility-matrix)
- [Workers Builds: build branches / Previews](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/)
- [Email Service pricing: verified destinations are free](https://developers.cloudflare.com/email-service/platform/pricing/)
- [Email Service: send emails (cf-bounce subdomain)](https://developers.cloudflare.com/email-service/get-started/send-emails/)
