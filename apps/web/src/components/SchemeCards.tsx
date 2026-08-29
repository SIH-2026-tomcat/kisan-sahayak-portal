"use client";
import { useT } from "@/i18n/I18nProvider";
import { Card } from "./ui";

const SCHEMES = [
  { key: "pmkisan", url: "https://www.pmkisan.gov.in/" },
  { key: "pmfby", url: "https://www.pmfby.gov.in/" },
  { key: "enam", url: "https://www.enam.gov.in/" },
] as const;

export function SchemeCards() {
  const t = useT();
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {SCHEMES.map((s) => (
        <Card key={s.key}>
          <h3 className="text-base font-semibold">{t(`schemes.items.${s.key}.name`)}</h3>
          <p className="mt-1 text-sm text-muted">{t(`schemes.items.${s.key}.desc`)}</p>
          <p className="mt-3 text-xs text-muted">{t("schemes.lastChecked", { date: "Aug 2026" })}</p>
          <a href={s.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm">
            {t("schemes.learnMore")} →
          </a>
        </Card>
      ))}
    </div>
  );
}
