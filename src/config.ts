// Site-wide settings. Everything here is public — no secrets (spec R-7).

export const site = {
  name: "Vincent P. Ciganik III",
  tagline: "Build with AI. Ship software you can trust.",
  url: "https://ciganik.dev",
  // TODO(launch): confirm the Proton address you created for ciganik.dev.
  email: "hello@ciganik.dev",
  // TODO(launch): replace with your Cal.com 30-minute intro event URL.
  bookingUrl: "https://cal.com/vpciii/intro",
  linkedin: "https://www.linkedin.com/in/vincent-ciganik-iii",
  github: "https://github.com/vpciii",
  // Cloudflare Turnstile site key (public by design). The default is
  // Cloudflare's always-pass *test* key; production builds set
  // PUBLIC_TURNSTILE_SITE_KEY in Workers Builds.
  turnstileSiteKey:
    import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA",
} as const;

export const nav = [
  { href: "/", label: "Home" },
  { href: "/services/", label: "Services" },
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
] as const;
