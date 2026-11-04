# ciganik.dev

Source for [ciganik.dev](https://ciganik.dev), the consulting site of
Vincent P. Ciganik III. It's built with [Astro](https://astro.build) and
served from a Cloudflare Worker.

## Develop

Requires Node 26 (see `.nvmrc`).

```bash
npm install
npm run dev          # http://localhost:4321 (pages only, no /api)
npm run preview      # build + wrangler dev, including the contact Worker
```

For `npm run preview`, create a git-ignored `.dev.vars` file with
Cloudflare's always-pass Turnstile **test** secret:

```
TURNSTILE_SECRET=1x0000000000000000000000000000000AA
```

## Test

```bash
npm test             # unit tests: contact handler, Worker routing (SC-3)
npm run test:build   # build, then check the output (SC-2, SC-4)
npm run test:a11y    # axe accessibility checks at 375px + desktop (SC-6)
npm run test:all     # all of the above
npm run test:smoke   # against the live site, after deploy (SC-1)
python3 tools/check-spec-coverage.py --include-approved
```

## Deploy

Pushing to `main` deploys to production through Cloudflare Workers Builds.
Other branches get Preview URLs. One-time setup is in
[`docs/launch-checklist.md`](docs/launch-checklist.md).

## Where things are

- Spec: [`specs/site-launch/spec.md`](specs/site-launch/spec.md)
- Architecture: [`docs/architecture.md`](docs/architecture.md)
- Decisions: [`docs/adr/`](docs/adr/)
- Copy draft (source of the page text): [`content/draft-copy.md`](content/draft-copy.md)

This repo follows the methodology in [vpciii/methodology](https://github.com/vpciii/methodology).
