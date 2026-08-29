"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, Spinner } from "@/components/ui";
import { useRealtime } from "@/lib/realtime";
import { useT } from "@/i18n/I18nProvider";
import { CapacityChart } from "@/components/admin/CapacityChart";
import { formatDateTime } from "@/lib/format";

export default function AdminDashboard() {
  const t = useT();
  const [summary, setSummary] = useState<any>(null);
  const [capacity, setCapacity] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  const load = () => {
    api.get<any>("admin/reports/summary").then(setSummary);
    api.get<any>("admin/reports/capacity").then((d) => setCapacity(d.items));
    api.get<any>("admin/activity").then((d) => setActivity(d.items));
  };
  useEffect(() => { load(); }, []);
  useRealtime((ev) => {
    if (ev.type.startsWith("booking") || ev.type.startsWith("slot")) load();
  });

  if (!summary) return <div className="py-16 flex justify-center"><Spinner className="h-8 w-8 text-green-700" /></div>;

  const stats = [
    ["registeredFarmers", summary.registeredFarmers],
    ["activeCentres", summary.activeCentres],
    ["bookingsToday", summary.bookingsToday],
    ["pendingPayments", summary.pendingPaymentUpdates],
    ["pendingVerification", summary.pendingVerification],
  ] as const;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("admin.nav.dashboard")}</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map(([key, val]) => (
          <Card key={key} className="text-center">
            <p className="text-2xl font-bold text-green-900">{val}</p>
            <p className="text-xs text-muted mt-1">{t(`admin.dashboard.${key}`)}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="font-semibold mb-2">{t("admin.dashboard.capacityTitle")}</h2>
        <CapacityChart data={capacity} />
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-semibold mb-2">{t("admin.dashboard.quickActions")}</h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/slots" className="btn-primary no-underline">{t("admin.slots.create")}</Link>
            <Link href="/admin/centres" className="btn-outline no-underline">{t("admin.centres.add")}</Link>
            <Link href="/admin/announcements" className="btn-outline no-underline">{t("admin.announcements.compose")}</Link>
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold mb-2">{t("admin.dashboard.activityTitle")}</h2>
          <ul className="space-y-1.5 text-sm max-h-64 overflow-auto">
            {activity.map((a) => (
              <li key={a.id} className="flex justify-between gap-2">
                <span>{a.action} <span className="text-muted">({a.entityType})</span></span>
                <span className="text-muted shrink-0 text-xs">{formatDateTime(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
