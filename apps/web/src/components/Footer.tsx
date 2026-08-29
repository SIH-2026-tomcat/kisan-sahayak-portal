"use client";
import Link from "next/link";
import { useT } from "@/i18n/I18nProvider";

export function Footer() {
  const t = useT();
  return (
    <footer className="mt-12 border-t border-line bg-white">
      <div className="container-page py-6 text-sm text-muted">
        <p className="font-semibold text-green-900">{t("brand.name")}</p>
        <p>{t("brand.ministry")}</p>
        <p>{t("brand.department")}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/help">{t("footer.contact")}</Link>
          <Link href="/about">{t("footer.privacy")}</Link>
          <Link href="/about">{t("footer.terms")}</Link>
          <Link href="/about">{t("footer.accessibility")}</Link>
          <a href="https://consumeraffairs.nic.in/" target="_blank" rel="noreferrer">
            {t("footer.sources")}
          </a>
        </div>
        <p className="mt-3 text-xs">{t("brand.prototypeNote")}</p>
      </div>
    </footer>
  );
}
