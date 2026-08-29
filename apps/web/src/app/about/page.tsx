"use client";
import { PublicShell } from "@/components/PublicShell";
import { Card } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";

export default function AboutPage() {
  const t = useT();
  return (
    <PublicShell>
      <div className="container-page py-10 max-w-reading">
        <h1 className="text-2xl font-bold">{t("about.title")}</h1>
        <div className="mt-4 space-y-4 text-ink">
          <Card>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/gov/doca-lockup.png" alt="Department of Consumer Affairs" className="h-12 w-auto" />
            <p className="mt-3 text-sm text-muted">{t("brand.ministry")}</p>
            <p className="text-sm text-muted">{t("brand.department")}</p>
          </Card>
          <p>{t("about.body")}</p>
          <p>{t("about.purpose")}</p>
          <div>
            <h2 className="text-lg font-semibold">{t("about.howTitle")}</h2>
            <p className="mt-1 text-muted">{t("about.how")}</p>
          </div>
          <Card>
            <h2 className="text-lg font-semibold">{t("about.dataTitle")}</h2>
            <p className="mt-1 text-sm text-muted">{t("about.dataBody")}</p>
          </Card>
        </div>
      </div>
    </PublicShell>
  );
}
