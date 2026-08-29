"use client";

import Link from "next/link";
import { useState } from "react";
import { useT } from "@/i18n/I18nProvider";
import { GovMark } from "./GovMark";
import { LanguageSelector } from "./LanguageSelector";
import { cx } from "./ui";

export function PublicHeader() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/about", label: t("nav.about") },
    { href: "/schemes", label: t("nav.schemes") },
    { href: "/help", label: t("nav.help") },
  ];
  return (
    <header className="border-b border-line bg-white sticky top-0 z-40">
      <div className="container-page flex items-center justify-between gap-3 py-2.5">
        <Link href="/" className="no-underline">
          <GovMark />
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-ink no-underline hover:text-green-800">
              {l.label}
            </Link>
          ))}
          <LanguageSelector />
          <Link href="/login" className="btn-outline h-9 min-h-0 px-3 no-underline">
            {t("nav.login")}
          </Link>
          <Link href="/register" className="btn-primary h-9 min-h-0 px-3 no-underline">
            {t("nav.register")}
          </Link>
        </nav>
        <button className="md:hidden btn-text" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu">
          ☰
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-line bg-white px-4 py-3 space-y-2">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="block py-1 text-ink no-underline" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <div className="py-1"><LanguageSelector /></div>
          <div className="flex gap-2 pt-1">
            <Link href="/login" className="btn-outline flex-1 no-underline" onClick={() => setOpen(false)}>{t("nav.login")}</Link>
            <Link href="/register" className="btn-primary flex-1 no-underline" onClick={() => setOpen(false)}>{t("nav.register")}</Link>
          </div>
        </div>
      )}
    </header>
  );
}
