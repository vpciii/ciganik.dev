# Launch checklist

These are the one-time manual steps to take `ciganik.dev` live. Each step
happens in a dashboard, not in code. Tick each box as you go and add the
date. This file is also where **SC-7** is recorded (spec
`specs/site-launch/spec.md`).

## 1. Accounts and content

- [ ] **Cal.com:** create a free account and a 30-minute "Intro call" event
  linked to your calendar. Put its URL in `src/config.ts` (`bookingUrl`).
- [ ] **Proton:** confirm the inbox address for the site (default
  `hello@ciganik.dev`). Update `src/config.ts` (`email`) and
  `wrangler.jsonc` (`CONTACT_TO`, `allowed_destination_addresses`) if it
  differs.

## 2. Cloudflare: Turnstile

- [ ] Go to Turnstile → Add widget. Hostnames: `ciganik.dev`. Mode: Managed.
- [ ] Copy the **site key** (public). Add it as the build variable
  `PUBLIC_TURNSTILE_SITE_KEY` in Workers Builds (step 4).
- [ ] Copy the **secret key**. Run `npx wrangler secret put TURNSTILE_SECRET`.
  Never put it in a file in the repo (R-7).

## 3. Cloudflare: Email Service (contact form delivery)

- [ ] Go to Email Service → Email Sending → onboard `ciganik.dev`. It adds
  records on the `cf-bounce` subdomain only.
- [ ] Add `hello@ciganik.dev` as a **verified destination address**, then
  click the verification link Proton receives.
- [ ] **Check (ADR-0001):** the apex MX records must still be Proton's
  (`dig MX ciganik.dev` returns `mail.protonmail.ch`). If Cloudflare tries
  to turn on Email Routing for the apex, stop. Don't accept it; revisit
  ADR-0001 instead.
- [ ] Send a test message through the form. Confirm it arrives at Proton
  with SPF and DKIM passing (Proton → message → "View headers").

## 4. Cloudflare: Worker and Workers Builds

- [ ] Go to Workers & Pages → Create → Import a repository →
  `vpciii/ciganik.dev`. Build command: `npm run build`. Deploy command:
  `npx wrangler deploy`.
- [ ] Enable preview builds for non-production branches.
- [ ] The `routes` in `wrangler.jsonc` attach `ciganik.dev` and
  `www.ciganik.dev` as custom domains on the first deploy.
- [ ] Turn on SSL/TLS → Edge Certificates → **Always Use HTTPS**.
- [ ] Enable Web Analytics for `ciganik.dev`. It's cookieless (R-5).

## 5. Verify

- [ ] `npm run test:smoke` passes (SC-1).
- [ ] **SC-7:** a push to `main` updated production. Date: ____
- [ ] **SC-7:** a branch push produced a preview URL. URL / date: ____
- [ ] R-10: Lighthouse mobile performance ≥ 90. Score: ____
- [ ] R-8: the Cloudflare billing page shows $0 / Free plans only.
