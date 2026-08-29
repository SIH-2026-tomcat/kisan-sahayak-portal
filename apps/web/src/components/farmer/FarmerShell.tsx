"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { GovMark } from "@/components/GovMark";
import { LanguageSelector } from "@/components/LanguageSelector";
import { NotificationBell } from "@/components/farmer/NotificationBell";
import { SignOutButton } from "@/components/SignOutButton";
import { useT } from "@/i18n/I18nProvider";
import { cx } from "@/components/ui";

const NAV = [
  { href: "/dashboard", key: "dashboard" },
  { href: "/procurement", key: "procurement" },
  { href: "/book", key: "book" },
  { href: "/my-bookings", key: "myBookings" },
  { href: "/announcements", key: "announcements" },
  { href: "/profile", key: "profile" },
] as const;

export function FarmerShell({ name, children }: { name: string; children: React.ReactNode }) {
  const t = useT();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);

  return (
    <div className="flex min-h-screen flex-col pb-16 sm:pb-0">
      <header className="border-b border-line bg-white sticky top-0 z-40">
        <div className="container-page flex items-center justify-between gap-2 py-2.5">
          <Link href="/dashboard" className="no-underline"><GovMark variant="compact" /></Link>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block"><LanguageSelector compact /></div>
            <NotificationBell />
            <button className="btn-text sm:hidden" onClick={() => setMenu((m) => !m)} aria-label="Menu">☰</button>
            <div className="hidden sm:block"><SignOutButton /></div>
          </div>
        </div>
        <nav className="hidden sm:flex container-page gap-1 border-t border-line">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cx(
                "px-3 py-2.5 text-sm font-medium no-underline border-b-2 -mb-px",
                pathname.startsWith(n.href) ? "border-green-700 text-green-900" : "border-transparent text-muted hover:text-ink"
              )}
            >
              {t(`nav.${n.key}`)}
            </Link>
          ))}
        </nav>
        {menu && (
          <div className="sm:hidden border-t border-line bg-white px-4 py-2 space-y-1">
            <LanguageSelector compact />
            <SignOutButton />
          </div>
        )}
        <div className="tricolour-strip" />
      </header>

      <main className="flex-1 container-page py-5">{children}</main>

      <nav className="sm:hidden fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-line bg-white">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={cx(
              "flex flex-col items-center gap-0.5 py-2 text-[10px] no-underline",
              pathname.startsWith(n.href) ? "text-green-800 font-semibold" : "text-muted"
            )}
          >
            {t(`nav.${n.key}`)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
