"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createT, normalizeLocale, LOCALE_COOKIE, type Locale, type TFn } from "./index";

type Ctx = { locale: Locale; t: TFn; setLocale: (l: Locale) => void };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ initialLocale, children }: { initialLocale: string; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(normalizeLocale(initialLocale));

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}`;
    document.documentElement.lang = l;
    fetch("/api/bff/auth/language", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ language: l }),
    }).catch(() => {});
  }, []);

  const value = useMemo<Ctx>(() => ({ locale, t: createT(locale), setLocale }), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}
