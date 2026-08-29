"use client";
import { useT } from "@/i18n/I18nProvider";

/** Emblem placeholder + ministry lockup. Prototype crop; replace with official master before public release. */
export function GovMark({ variant = "full" }: { variant?: "full" | "compact" }) {
  const t = useT();
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-800 text-white text-[10px] font-bold leading-none"
      >
        भारत
      </span>
      <div className="leading-tight">
        <p className="text-[11px] uppercase tracking-wide text-muted">{t("brand.govOfIndia")}</p>
        <p className="text-sm font-semibold text-green-900">{t("brand.name")}</p>
        {variant === "full" && <p className="text-[11px] text-muted hidden sm:block">{t("brand.department")}</p>}
      </div>
    </div>
  );
}
