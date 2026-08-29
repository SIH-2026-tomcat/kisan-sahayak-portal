"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, Spinner, EmptyState, StatusBadge } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";
import { formatSlot } from "@/lib/format";

const TIMELINE = ["confirmed", "arrived", "procured", "payment_completed"];

export default function MyBookingsPage() {
  const t = useT();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>("bookings").then((d) => setItems(d.items)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-16 flex justify-center"><Spinner className="h-8 w-8 text-green-700" /></div>;

  return (
    <div className="max-w-reading space-y-4">
      <h1 className="text-xl font-bold">{t("myBookings.title")}</h1>
      {items.length === 0 && <EmptyState title={t("myBookings.empty")}><Link href="/book" className="text-link">{t("nav.book")}</Link></EmptyState>}
      {items.map((b) => {
        const idx = b.status === "cancelled" ? -1 : Math.max(0, TIMELINE.indexOf(b.status));
        return (
          <Card key={b.id}>
            <div className="flex items-center justify-between">
              <Link href={`/book/${b.id}`} className="font-semibold no-underline text-green-900">{b.bookingCode}</Link>
              <StatusBadge tone={b.status === "cancelled" ? "danger" : b.status.startsWith("payment") ? "info" : "ok"}>
                {t(`bookingStatus.${b.status}`)}
              </StatusBadge>
            </div>
            <p className="text-sm text-muted">{b.centre.name} · {formatSlot(b.slot)}</p>
            <p className="text-sm text-muted">{t("booking.token")}: {b.tokenNumber} · {b.centre.contactPhone ?? ""}</p>

            {b.status !== "cancelled" && (
              <ol className="mt-3 flex gap-1 text-[11px]">
                {TIMELINE.map((s, i) => (
                  <li key={s} className={`flex-1 rounded px-1.5 py-1 text-center ${i <= idx ? "bg-green-100 text-green-900" : "bg-gray-100 text-muted"}`}>
                    {t(`bookingStatus.${s}`)}
                  </li>
                ))}
              </ol>
            )}
            {b.paymentReference && <p className="mt-1 text-xs text-muted">Payment ref: {b.paymentReference}</p>}
          </Card>
        );
      })}
    </div>
  );
}
