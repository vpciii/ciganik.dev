# Glossary — Ubiquitous Language

The terms this project uses. Use them exactly in code, tests, and docs.

| Term | Meaning |
|---|---|
| **contact form** | The form on `/contact/` that posts to `/api/contact`. |
| **submission** | One contact-form post. It is never stored; it becomes one email. |
| **booking link** | The outbound link to the Cal.com intro-call event (`site.bookingUrl`). |
| **apex** | `ciganik.dev` itself, as opposed to `www.ciganik.dev`. |
| **verified destination address** | An inbox verified in Cloudflare Email Service. Sending to it is free. The form only ever emails this address. |
| **honeypot** | The hidden `website` field. Any submission that fills it is dropped silently. |
| **Preview** | A Workers Builds deployment of a non-`main` branch at its own URL. |

## Conventions

- Success criteria are referred to by id (`SC-n`), and requirements by
  id (`R-n`), from `specs/site-launch/spec.md`.
