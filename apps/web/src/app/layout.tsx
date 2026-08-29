import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Noto_Sans, Noto_Sans_Devanagari, Noto_Sans_Telugu, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ToastProvider } from "@/components/Toast";
import { LOCALE_COOKIE, normalizeLocale } from "@/i18n";

const noto = Noto_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-noto-latin", display: "swap" });
const notoDeva = Noto_Sans_Devanagari({ subsets: ["devanagari"], weight: ["400", "500", "600", "700"], variable: "--font-noto-deva", display: "swap" });
const notoTelu = Noto_Sans_Telugu({ subsets: ["telugu"], weight: ["400", "500", "600", "700"], variable: "--font-noto-telu", display: "swap" });
const notoBeng = Noto_Sans_Bengali({ subsets: ["bengali"], weight: ["400", "500", "600", "700"], variable: "--font-noto-beng", display: "swap" });

export const metadata: Metadata = {
  title: "Kisan Sahayak Portal",
  description: "Know your centre. Book your slot. Come when it is your turn.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const locale = normalizeLocale(store.get(LOCALE_COOKIE)?.value);

  return (
    <html lang={locale} className={`${noto.variable} ${notoDeva.variable} ${notoTelu.variable} ${notoBeng.variable}`}>
      <body
        className="min-h-screen"
        style={{ fontFamily: "var(--font-noto-latin), var(--font-noto-deva), var(--font-noto-telu), var(--font-noto-beng), system-ui, sans-serif" }}
      >
        <I18nProvider initialLocale={locale}>
          <ToastProvider>{children}</ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
