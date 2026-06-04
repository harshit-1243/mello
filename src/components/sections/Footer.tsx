import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/ui/Wordmark";
import { SmoothLink } from "@/components/ui/SmoothLink";
import { SITE } from "@/lib/site";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Mello Voice", href: "#product" },
      { label: "Mello Book", href: "#product" },
      { label: "Mello Chat", href: "#product" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Pricing", href: "#pricing" },
      { label: "About", href: "#" },
      { label: "Contact", href: `mailto:${SITE.CONTACT_EMAIL}` },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer
      data-nav="dark"
      className="is-stage relative z-10 border-t border-white/10 bg-stage text-on-stage"
    >
      <Container className="py-16 sm:py-20">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Wordmark onStage />
            <p className="mt-5 text-[0.97rem] leading-relaxed text-on-stage/65">
              {SITE.tagline}
            </p>
            <div className="mt-6 space-y-1 font-mono text-sm text-on-stage/55">
              <a
                href={`mailto:${SITE.CONTACT_EMAIL}`}
                className="block transition-colors hover:text-signal"
              >
                {SITE.CONTACT_EMAIL}
              </a>
              <p>{SITE.location}</p>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-mono text-eyebrow uppercase text-on-stage/40">
                {col.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <SmoothLink
                      href={l.href}
                      className="text-[0.97rem] text-on-stage/70 transition-colors hover:text-on-stage"
                    >
                      {l.label}
                    </SmoothLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-on-stage/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="text-on-stage/75">{SITE.builtIn}</span> &nbsp;·&nbsp;
            © {SITE.year} {SITE.domain}
          </p>
          <div className="flex gap-6">
            <a
              href={SITE.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-signal"
            >
              LinkedIn
            </a>
            <a
              href={SITE.social.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-signal"
            >
              X
            </a>
            <a
              href={SITE.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-signal"
            >
              Instagram
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
