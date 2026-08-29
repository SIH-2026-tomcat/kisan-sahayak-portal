"use client";
import { useT } from "@/i18n/I18nProvider";

/**
 * State Emblem + portal lockup. The emblem artwork is a prototype asset for
 * hackathon evaluation and must be replaced with an official master before any
 * public release (spec §24).
 */
export function GovMark({ variant = "full" }: { variant?: "full" | "compact" }) {
  const t = useT();
  return (
    <div className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/gov/emblem-india.png"
        alt="State Emblem of India"
        className={variant === "full" ? "h-11 w-auto shrink-0" : "h-9 w-auto shrink-0"}
      />
      <div className="leading-tight">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-saffron-700">{t("brand.govOfIndia")}</p>
        <p className="text-sm font-bold text-green-900">{t("brand.name")}</p>
        {variant === "full" && <p className="hidden text-[11px] text-muted sm:block">{t("brand.ministry")}</p>}
      </div>
    </div>
  );
}
