"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, Spinner, StatusBadge, Button, Field, Banner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useRealtime } from "@/lib/realtime";
import { useT } from "@/i18n/I18nProvider";
import { formatSlot } from "@/lib/format";

export default function AdminSlotsPage() {
  const t = useT();
  const { push } = useToast();
  const [slots, setSlots] = useState<any[]>([]);
  const [centres, setCentres] = useState<any[]>([]);
  const [windows, setWindows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ centreId: "", procurementWindowId: "", slotDate: "", startTime: "10:00", endTime: "13:00", capacity: 100, publish: true });
  const [creating, setCreating] = useState(false);

  const load = () => {
    api.get<any>("admin/slots").then((d) => setSlots(d.items));
  };
  useEffect(() => {
    Promise.all([api.get<any>("admin/slots"), api.get<any>("admin/centres"), api.get<any>("admin/procurement-windows")]).then(([s, c, w]) => {
      setSlots(s.items);
      setCentres(c.items);
      setWindows(w.items);
      setForm((f) => ({ ...f, centreId: c.items[0]?.id ?? "", procurementWindowId: w.items[0]?.id ?? "" }));
      setLoading(false);
    });
  }, []);
  useRealtime((ev) => {
    if (ev.type.startsWith("slot") || ev.type.startsWith("booking")) load();
  });

  async function create() {
    setCreating(true);
    try {
      const res = await api.post<any>("admin/slots", form);
      push({ title: "Slot created", body: res.overlapWarning ? t("admin.slots.overlapWarning") : undefined, tone: res.overlapWarning ? "warning" : "success" });
      load();
    } catch (e: any) {
      push({ title: t("common.somethingWrong"), body: e.message, tone: "error" });
    } finally {
      setCreating(false);
    }
  }
  async function act(id: string, action: string) {
    try {
      await api.post(`admin/slots/${id}/${action}`);
      push({ title: `Slot ${action}`, tone: "success" });
      load();
    } catch (e: any) {
      push({ title: t("common.somethingWrong"), body: e.message, tone: "error" });
    }
  }

  if (loading) return <div className="py-16 flex justify-center"><Spinner className="h-8 w-8 text-green-700" /></div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("admin.slots.title")}</h1>

      <Card>
        <h2 className="font-semibold mb-2">{t("admin.slots.create")}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={t("admin.slots.centre")} htmlFor="c">
            <select id="c" className="input" value={form.centreId} onChange={(e) => setForm({ ...form, centreId: e.target.value })}>
              {centres.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label={t("admin.slots.window")} htmlFor="w">
            <select id="w" className="input" value={form.procurementWindowId} onChange={(e) => setForm({ ...form, procurementWindowId: e.target.value })}>
              {windows.map((w) => <option key={w.id} value={w.id}>{w.commodity} {w.season} {w.year}</option>)}
            </select>
          </Field>
          <Field label={t("admin.slots.date")} htmlFor="d"><input id="d" type="date" className="input" value={form.slotDate} onChange={(e) => setForm({ ...form, slotDate: e.target.value })} /></Field>
          <Field label={t("admin.slots.start")} htmlFor="s"><input id="s" type="time" className="input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></Field>
          <Field label={t("admin.slots.end")} htmlFor="e"><input id="e" type="time" className="input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></Field>
          <Field label={t("admin.slots.capacity")} htmlFor="cap"><input id="cap" type="number" min={1} className="input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm mb-2">
          <input type="checkbox" checked={form.publish} onChange={(e) => setForm({ ...form, publish: e.target.checked })} /> {t("admin.slots.publish")}
        </label>
        {form.endTime <= form.startTime && <div className="mb-2"><Banner tone="danger">{t("admin.slots.errTime")}</Banner></div>}
        <Button loading={creating} disabled={!form.slotDate || form.endTime <= form.startTime || form.capacity < 1} onClick={create}>{t("admin.slots.create")}</Button>
      </Card>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-paper text-left"><tr>
            <th className="px-3 py-2">Centre</th><th className="px-3 py-2">When</th><th className="px-3 py-2">Live</th><th className="px-3 py-2">Status</th><th></th>
          </tr></thead>
          <tbody>
            {slots.map((s) => (
              <tr key={s.id} className="border-t border-line">
                <td className="px-3 py-2">{s.centre.name}</td>
                <td className="px-3 py-2">{formatSlot(s)}</td>
                <td className="px-3 py-2">{t("admin.slots.live", { booked: s.bookedCount, capacity: s.capacity })}</td>
                <td className="px-3 py-2"><StatusBadge tone={s.status === "open" ? "ok" : s.status === "full" ? "attention" : "closed"}>{s.status}</StatusBadge></td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {["draft", "scheduled"].includes(s.status) && <button className="text-link mr-2" onClick={() => act(s.id, "publish")}>Publish</button>}
                  {["open", "full"].includes(s.status) && <button className="text-link mr-2" onClick={() => act(s.id, "close")}>Close</button>}
                  {s.status !== "cancelled" && <button className="text-danger" onClick={() => act(s.id, "cancel")}>Cancel</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
