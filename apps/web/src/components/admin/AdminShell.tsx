"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { GovMark } from "@/components/GovMark";
import { SignOutButton } from "@/components/SignOutButton";
import { RealtimeBanner } from "@/components/admin/RealtimeBanner";
import { useT } from "@/i18n/I18nProvider";
import { cx } from "@/components/ui";

const NAV = [
  ["/admin", "dashboard"],
  ["/admin/farmers", "farmers"],
  ["/admin/centres", "centres"],
  ["/admin/slots", "slots"],
  ["/admin/announcements", "announcements"],
  ["/admin/bookings", "bookings"],
  ["/admin/reports", "reports"],
  ["/admin/audit", "audit"],
  ["/admin/settings", "settings"],
] as const;

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden md:flex flex-col border-r border-line bg-white">
        <div className="p-4 border-b border-line"><GovMark /></div>
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV.map(([href, key]) => (
            <Link
              key={href}
              href={href}
              className={cx(
                "block rounded px-3 py-2 text-sm no-underline",
                (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href))
                  ? "bg-green-100 text-green-900 font-medium"
                  : "text-ink hover:bg-green-50"
              )}
            >
              {t(`admin.nav.${key}`)}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-line text-xs text-muted">
          <p className="truncate">{email}</p>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex flex-col">
        <header className="flex items-center justify-between border-b border-line bg-white px-4 py-2.5 md:hidden">
          <GovMark variant="compact" />
          <button className="btn-text" onClick={() => setOpen((o) => !o)}>☰</button>
        </header>
        {open && (
          <div className="md:hidden border-b border-line bg-white p-2 space-y-0.5">
            {NAV.map(([href, key]) => (
              <Link key={href} href={href} className="block rounded px-3 py-2 text-sm no-underline" onClick={() => setOpen(false)}>
                {t(`admin.nav.${key}`)}
              </Link>
            ))}
            <SignOutButton />
          </div>
        )}
        <div className="px-4 pt-3"><RealtimeBanner /></div>
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
