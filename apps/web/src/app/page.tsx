"use client";

import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { Card } from "@/components/ui";
import { SchemeCards } from "@/components/SchemeCards";
import { useT } from "@/i18n/I18nProvider";

export default function HomePage() {
  const t = useT();
  return (
    <PublicShell>
      <section className="bg-green-800 text-white">
        <div className="container-page py-10 sm:py-14 max-w-reading">
          <p className="text-sm uppercase tracking-wide text-green-100">{t("brand.govOfIndia")}</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-white">{t("brand.name")}</h1>
          <p className="mt-3 text-green-50 text-lg">{t("brand.tagline")}</p>
          <p className="mt-2 text-green-100 text-sm">{t("about.body").slice(0, 160)}…</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/register" className="btn-saffron no-underline">{t("home.heroCta1")}</Link>
            <Link href="/login" className="btn-outline bg-white/10 text-white border-white/40 no-underline hover:bg-white/20">
              {t("home.heroCta2")}
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <h2 className="text-xl font-semibold mb-4">{t("home.whatTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {["1", "2", "3"].map((n) => (
            <Card key={n}>
              <h3 className="text-base font-semibold">{t(`home.what${n}Title`)}</h3>
              <p className="mt-1 text-sm text-muted">{t(`home.what${n}Body`)}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-paper">
        <div className="container-page py-10">
          <h2 className="text-xl font-semibold mb-4">{t("home.currentTitle")}</h2>
          <Card>
            <p className="font-medium">{t("dashboard.importantInfo")}</p>
            <p className="mt-1 text-sm text-muted">Rice Procurement · Kharif 2026 is currently open in mapped service areas.</p>
          </Card>
        </div>
      </section>

      <section className="container-page py-10">
        <h2 className="text-xl font-semibold mb-2">{t("home.aboutTitle")}</h2>
        <p className="text-muted max-w-reading">{t("about.body")}</p>
        <p className="mt-2"><Link href="/about">{t("home.aboutMore")}</Link></p>
      </section>

      <section className="bg-paper">
        <div className="container-page py-10">
          <h2 className="text-xl font-semibold mb-4">{t("home.schemesTitle")}</h2>
          <SchemeCards />
        </div>
      </section>
    </PublicShell>
  );
}
