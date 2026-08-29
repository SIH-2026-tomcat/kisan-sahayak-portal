import en from "./en.json";
import hi from "./hi.json";
import te from "./te.json";
import bn from "./bn.json";

export const LOCALES = ["en", "hi", "te", "bn"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  te: "తెలుగు",
  bn: "বাংলা",
};

const RESOURCES: Record<Locale, any> = { en, hi, te, bn };
export const LOCALE_COOKIE = "ksp_lang";

function lookup(obj: any, path: string): unknown {
  return path.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

export type TFn = (key: string, vars?: Record<string, string | number>) => string;

export function createT(locale: Locale): TFn {
  return (key, vars) => {
    let value = lookup(RESOURCES[locale], key);
    if (typeof value !== "string") value = lookup(RESOURCES.en, key);
    if (typeof value !== "string") return key;
    return value.replace(/\{\{(\w+)\}\}/g, (_, name) => String(vars?.[name] ?? `{{${name}}}`));
  };
}

export function normalizeLocale(input: string | undefined | null): Locale {
  return (LOCALES as readonly string[]).includes(input ?? "") ? (input as Locale) : "en";
}
