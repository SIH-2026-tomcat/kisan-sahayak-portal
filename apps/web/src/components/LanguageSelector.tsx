"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { LOCALES, LOCALE_LABELS } from "@/i18n";
import { cx } from "./ui";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  return (
    <label className={cx("inline-flex items-center gap-1.5 text-sm", compact && "text-xs")}>
      <span className="sr-only">Language</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as (typeof LOCALES)[number])}
        className="rounded border border-line bg-white px-2 py-1 text-ink"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
