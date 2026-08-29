"use client";
import { PublicShell } from "@/components/PublicShell";
import { SchemeCards } from "@/components/SchemeCards";
import { useT } from "@/i18n/I18nProvider";

export default function SchemesPage() {
  const t = useT();
  return (
    <PublicShell>
      <div className="container-page py-10">
        <h1 className="text-2xl font-bold mb-4">{t("schemes.title")}</h1>
        <SchemeCards />
      </div>
    </PublicShell>
  );
}
