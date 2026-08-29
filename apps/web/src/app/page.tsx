"use client";

import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { Card } from "@/components/ui";
import { SchemeCards } from "@/components/SchemeCards";
import { AshokaChakra } from "@/components/national/AshokaChakra";
import { useT } from "@/i18n/I18nProvider";
import { LOCALE_LABELS, LOCALES } from "@/i18n";

export default function HomePage() {
  const t = useT();
  return (
    <PublicShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-green-800 text-white">
        <AshokaChakra className="flag-ribbon__chakra pointer-events-none absolute -right-20 -top-20 h-72 w-72 text-white/10" />
        <div className="container-page py-10 sm:py-14"><div className="max-w-2xl">
          <p className="text-sm uppercase tracking-wide text-saffron-100">{t("brand.govOfIndia")}</p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{t("brand.name")}</h1>
          <p className="mt-3 text-lg text-green-50">{t("brand.tagline")}</p>
          <p className="mt-2 text-sm text-green-100">{t("home.heroSub")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/register" className="btn-saffron no-underline">
              {t("home.heroCta1")}
            </Link>
            <Link
              href="/login"
              className="btn-outline border-white/40 bg-white/10 text-white no-underline hover:bg-white/20"
            >
              {t("home.heroCta2")}
            </Link>
          </div>
        </div></div>
        <div className="tricolour-strip" />
      </section>

      {/* Vision / leadership */}
      <section className="bg-white">
        <div className="container-page grid items-center gap-6 py-10 sm:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-xl font-semibold">{t("home.visionTitle")}</h2>
            <blockquote className="mt-3 border-l-4 border-saffron pl-4 text-lg italic text-ink">
              “{t("home.visionQuote")}”
            </blockquote>
            <p className="mt-2 text-sm font-medium text-muted">{t("home.visionAttribution")}</p>
            <p className="mt-3 max-w-reading text-sm text-muted">{t("home.visionBody")}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/gov/farmer.webp"
            alt="An Indian farmer standing in front of a tractor with a wheat harvest"
            className="mx-auto h-56 w-auto self-end sm:h-72"
          />
        </div>
        <div className="tricolour-strip" />
      </section>

      {/* What this portal does */}
      <section className="container-page py-10">
        <h2 className="mb-4 text-xl font-semibold">{t("home.whatTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {["1", "2", "3"].map((n) => (
            <Card key={n}>
              <h3 className="text-base font-semibold">{t(`home.what${n}Title`)}</h3>
              <p className="mt-1 text-sm text-muted">{t(`home.what${n}Body`)}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Multilingual support */}
      <section className="bg-paper">
        <div className="container-page py-10">
          <h2 className="text-xl font-semibold">{t("home.langTitle")}</h2>
          <p className="mt-1 max-w-reading text-sm text-muted">{t("home.langBody")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {LOCALES.map((l) => (
              <span
                key={l}
                className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium text-green-900"
              >
                {LOCALE_LABELS[l]}
              </span>
            ))}
            <span className="rounded-full border border-dashed border-line px-3 py-1.5 text-sm text-muted">
              {t("home.langMore")}
            </span>
          </div>
        </div>
      </section>

      {/* Current information */}
      <section className="container-page py-10">
        <h2 className="mb-4 text-xl font-semibold">{t("home.currentTitle")}</h2>
        <Card>
          <p className="font-medium">{t("dashboard.importantInfo")}</p>
          <p className="mt-1 text-sm text-muted">{t("home.currentBody")}</p>
        </Card>
      </section>

      {/* About */}
      <section className="bg-paper">
        <div className="container-page py-10">
          <h2 className="mb-2 text-xl font-semibold">{t("home.aboutTitle")}</h2>
          <p className="max-w-reading text-muted">{t("about.body")}</p>
          <p className="mt-2">
            <Link href="/about">{t("home.aboutMore")}</Link>
          </p>
        </div>
      </section>

      {/* Schemes */}
      <section className="container-page py-10">
        <h2 className="mb-4 text-xl font-semibold">{t("home.schemesTitle")}</h2>
        <SchemeCards />
      </section>
    </PublicShell>
  );
}
