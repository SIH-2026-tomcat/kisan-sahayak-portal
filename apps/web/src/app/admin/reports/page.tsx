"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, Spinner } from "@/components/ui";
import { CapacityChart } from "@/components/admin/CapacityChart";
import { useT } from "@/i18n/I18nProvider";

export default function AdminReportsPage() {
  const t = useT();
  const [byCentre, setByCentre] = useState<any[]>([]);
  const [capacity, setCapacity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get<any>("admin/reports/by-centre"), api.get<any>("admin/reports/capacity")]).then(([b, c]) => {
      setByCentre(b.items);
      setCapacity(c.items);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="py-16 flex justify-center"><Spinner className="h-8 w-8 text-green-700" /></div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("admin.nav.reports")}</h1>
      <Card>
        <h2 className="font-semibold mb-2">Bookings vs capacity</h2>
        <CapacityChart data={capacity} />
      </Card>
      <Card>
        <h2 className="font-semibold mb-2">By centre</h2>
        <table className="w-full text-sm">
          <thead className="text-left"><tr><th className="py-1">Centre</th><th>Bookings</th><th>Capacity</th><th>Booked</th><th>Utilisation</th></tr></thead>
          <tbody>
            {byCentre.map((r) => (
              <tr key={r.centreId} className="border-t border-line">
                <td className="py-1">{r.centre}</td>
                <td>{r.bookings}</td>
                <td>{r.capacity}</td>
                <td>{r.booked}</td>
                <td>{r.capacity > 0 ? Math.round((r.booked / r.capacity) * 100) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
