"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, Banner, StatusBadge, Spinner, EmptyState } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";
import { formatSlot } from "@/lib/format";

export default function DashboardPage() {
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<any>("auth/me"),
      api.get<any>("bookings").catch(() => ({ items: [] })),
      api.get<any>("announcements").catch(() => ({ items: [] })),
    ]).then(([m, b, a]) => {
      setMe(m);
      setBookings(b.items);
      setAnnouncements(a.items);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="py-16 flex justify-center"><Spinner className="h-8 w-8 text-green-700" /></div>;

  const name = me?.profile?.fullName?.split(" ")[0] ?? "Farmer";
  const next = bookings.find((b) => b.status !== "cancelled");
  const noCoverage = me?.hasProfile && !me?.profile?.serviceAreaId;

  return (
    <div className="space-y-5 max-w-reading">
      <div>
        <h1 className="text-xl font-bold">{t("dashboard.greeting", { name })}</h1>
        <p className="text-sm text-muted">{t("dashboard.importantInfo")}</p>
      </div>

      {!me?.hasProfile && (
        <Banner tone="warning">
          Complete your profile to see procurement centres for your area.{" "}
          <Link href="/register" className="font-medium">Finish registration →</Link>
        </Banner>
      )}
      {noCoverage && <Banner tone="warning">{t("dashboard.noCoverage")}</Banner>}

      <Card>
        <h2 className="text-base font-semibold">{t("dashboard.nextVisitTitle")}</h2>
        {next ? (
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <p className="font-medium">{next.centre.name}</p>
              <StatusBadge tone={next.status === "cancelled" ? "closed" : "ok"}>
                {t(`bookingStatus.${next.status}`)}
              </StatusBadge>
            </div>
            <p className="text-sm text-muted">{formatSlot(next.slot)}</p>
            <p className="text-sm text-muted">{t("booking.token")}: {next.tokenNumber}</p>
            <Link href={`/book/${next.id}`} className="btn-primary mt-3 no-underline">{t("dashboard.viewBooking")}</Link>
          </div>
        ) : (
          <EmptyState title={t("dashboard.noBooking")}>
            <Link href="/book" className="btn-outline mt-2 no-underline">{t("nav.book")}</Link>
          </EmptyState>
        )}
      </Card>

      <Card>
        <h2 className="text-base font-semibold mb-2">{t("dashboard.noticesTitle")}</h2>
        {announcements.length === 0 && <p className="text-sm text-muted">{t("announcements.empty")}</p>}
        <ul className="space-y-2">
          {announcements.slice(0, 3).map((a) => (
            <li key={a.id} className="text-sm">
              <p className="font-medium">{a.title}</p>
              <p className="text-muted">{a.message}</p>
            </li>
          ))}
        </ul>
        <Link href="/announcements" className="text-sm text-link mt-2 inline-block">{t("announcements.title")} →</Link>
      </Card>

      <Card>
        <h2 className="text-base font-semibold mb-2">{t("dashboard.quickLinks")}</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Link href="/procurement" className="btn-outline no-underline">{t("nav.procurement")}</Link>
          <Link href="/book" className="btn-outline no-underline">{t("nav.book")}</Link>
          <Link href="/my-bookings" className="btn-outline no-underline">{t("nav.myBookings")}</Link>
          <Link href="/schemes" className="btn-outline no-underline">{t("nav.schemes")}</Link>
        </div>
      </Card>
    </div>
  );
}
