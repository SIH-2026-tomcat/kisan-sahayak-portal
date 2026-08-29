"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, Spinner, StatusBadge, Button } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useT } from "@/i18n/I18nProvider";
import { formatSlot } from "@/lib/format";

export default function AdminBookingsPage() {
  const t = useT();
  const { push } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.get<any>("admin/bookings").then((d) => { setItems(d.items); setLoading(false); });
  useEffect(() => { load(); }, []);

  async function status(id: string, s: string) {
    await api.post(`admin/bookings/${id}/status`, { status: s });
    push({ title: `Marked ${s}`, tone: "success" });
    load();
  }
  async function payment(id: string, s: string) {
    const reference = s === "payment_completed" ? `PAY-${Math.floor(Math.random() * 1e6)}` : undefined;
    await api.post(`admin/bookings/${id}/payment`, { status: s, reference });
    push({ title: `Payment ${s.replace("payment_", "")}`, tone: "success" });
    load();
  }

  if (loading) return <div className="py-16 flex justify-center"><Spinner className="h-8 w-8 text-green-700" /></div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("admin.nav.bookings")}</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-paper text-left"><tr>
            <th className="px-3 py-2">Code</th><th className="px-3 py-2">Farmer</th><th className="px-3 py-2">Slot</th><th className="px-3 py-2">Status</th><th></th>
          </tr></thead>
          <tbody>
            {items.map((b) => (
              <tr key={b.id} className="border-t border-line">
                <td className="px-3 py-2 font-medium">{b.bookingCode}</td>
                <td className="px-3 py-2">{b.farmerName}<br /><span className="text-muted text-xs">{b.farmerEmailMasked}</span></td>
                <td className="px-3 py-2">{b.centre.name}<br /><span className="text-muted text-xs">{formatSlot(b.slot)}</span></td>
                <td className="px-3 py-2"><StatusBadge tone={b.status === "cancelled" ? "danger" : b.status.startsWith("payment") ? "info" : "ok"}>{t(`bookingStatus.${b.status}`)}</StatusBadge></td>
                <td className="px-3 py-2 whitespace-nowrap space-x-2">
                  {b.status === "confirmed" && <button className="text-link" onClick={() => status(b.id, "arrived")}>Arrived</button>}
                  {b.status === "arrived" && <button className="text-link" onClick={() => status(b.id, "procured")}>Procured</button>}
                  {b.status === "procured" && <button className="text-link" onClick={() => payment(b.id, "payment_initiated")}>Init payment</button>}
                  {b.status === "payment_initiated" && <button className="text-link" onClick={() => payment(b.id, "payment_completed")}>Complete payment</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
