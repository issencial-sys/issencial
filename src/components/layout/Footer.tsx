import Image from "next/image";
import Link from "next/link";

const serviceLinks = [
  { href: "/servicos", label: "Viagens & Turismo" },
  { href: "/servicos", label: "Educação na Europa" },
  { href: "/servicos", label: "Transferências" },
  { href: "/servicos", label: "Serviços Administrativos" },
];

const companyLinks = [
  { href: "/sobre", label: "Sobre Nós" },
  { href: "/contacto", label: "Contacto" },
  { href: "/#blog", label: "Blog" },
];

const supportLinks = [
  { href: "/portal", label: "Portal do Cliente" },
  { href: "/faq", label: "FAQ" },
  { href: "/termos-privacidade", label: "Termos de Uso" },
  { href: "/termos-privacidade", label: "Política de Privacidade" },
];

const socialLinks = [
  { label: "LinkedIn", href: "#", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
  )},
  { label: "Facebook", href: "#", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
  )},
  { label: "Instagram", href: "#", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
  )},
];

export default function Footer() {
  return (
    <footer className="bg-dark text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-10 py-16 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="mb-5">
              <Image
                src="/logo/Ativo 7.webp"
                alt="Issencial"
                width={160}
                height={40}
                className="object-contain h-8 w-auto brightness-0 invert-[0.85]"
              />
            </div>
            <p className="mb-6 text-sm leading-relaxed text-white/60">
              A sua sociedade de confiança para cuidar de processos a todos os níveis — desde viagens e educação até serviços administrativos.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-accent hover:text-primary hover:-translate-y-0.5"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            { title: "Serviços", links: serviceLinks },
            { title: "Empresa", links: companyLinks },
            { title: "Suporte", links: supportLinks },
          ].map((section) => (
            <div key={section.title}>
              <h4 className="mb-5 text-xs font-semibold uppercase tracking-widest text-white">{section.title}</h4>
              <div className="flex flex-col gap-3">
                {section.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col items-center gap-4 border-t border-white/10 py-8 md:flex-row md:justify-between">
          <p className="text-sm text-white/40">© 2026 Issencial. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            {[
            { label: "Privacidade", href: "/termos-privacidade#privacidade" },
            { label: "Termos", href: "/termos-privacidade#termos" },
            { label: "Cookies", href: "/termos-privacidade#cookies" },
          ].map((link) => (
            <Link key={link.label} href={link.href} className="text-sm text-white/40 transition-colors hover:text-accent">
              {link.label}
            </Link>
          ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
