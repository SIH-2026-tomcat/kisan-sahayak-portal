"use client";
import Link from "next/link";
import { useT } from "@/i18n/I18nProvider";

const PARTNERS = [
  { src: "/gov/digital-india.png", alt: "Digital India", href: "https://www.digitalindia.gov.in/" },
  { src: "/gov/mygov.png", alt: "MyGov", href: "https://www.mygov.in/" },
  { src: "/gov/fci.webp", alt: "Food Corporation of India", href: "https://fci.gov.in/" },
];

export function Footer() {
  const t = useT();
  return (
    <footer className="mt-12 border-t border-line bg-white">
      <div className="tricolour-strip" />
      <div className="container-page py-8">
        <div className="grid gap-6 sm:grid-cols-[1.4fr_1fr]">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/gov/doca-lockup.png" alt="Department of Consumer Affairs" className="h-12 w-auto" />
            <p className="mt-3 text-sm font-semibold text-green-900">{t("brand.name")}</p>
            <p className="text-sm text-muted">{t("brand.ministry")}</p>
            <p className="text-sm text-muted">{t("brand.department")}</p>
          </div>
          <div className="text-sm">
            <p className="font-medium text-ink">{t("footer.partners")}</p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              {PARTNERS.map((p) => (
                <a key={p.alt} href={p.href} target="_blank" rel="noreferrer" aria-label={p.alt}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.alt} className="h-9 w-auto opacity-90 grayscale transition hover:opacity-100 hover:grayscale-0" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-4 text-sm text-muted">
          <Link href="/help">{t("footer.contact")}</Link>
          <Link href="/about">{t("footer.privacy")}</Link>
          <Link href="/about">{t("footer.terms")}</Link>
          <Link href="/about">{t("footer.accessibility")}</Link>
          <a href="https://consumeraffairs.nic.in/" target="_blank" rel="noreferrer">
            {t("footer.sources")}
          </a>
        </div>
        <p className="mt-3 text-xs text-muted">{t("brand.prototypeNote")}</p>
      </div>
    </footer>
  );
}
