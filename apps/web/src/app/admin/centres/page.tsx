"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, Spinner, StatusBadge, Button, Field } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useT } from "@/i18n/I18nProvider";

const EMPTY = { name: "", address: "", pincode: "", district: "", state: "Odisha", latitude: "", longitude: "", contactPhone: "", openingHours: "", commodities: "Rice", status: "active", serviceAreaIds: [] as string[] };

export default function AdminCentresPage() {
  const t = useT();
  const { push } = useToast();
  const [centres, setCentres] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const load = () => {
    Promise.all([api.get<any>("admin/centres"), api.get<any>("admin/service-areas")]).then(([c, a]) => {
      setCentres(c.items);
      setAreas(a.items);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  async function save() {
    const payload = {
      ...form,
      commodities: String(form.commodities).split(",").map((s: string) => s.trim()).filter(Boolean),
    };
    try {
      if (editId) await api.patch(`admin/centres/${editId}`, payload);
      else await api.post("admin/centres", payload);
      push({ title: "Centre saved", tone: "success" });
      setForm(null);
      setEditId(null);
      load();
    } catch (e: any) {
      push({ title: t("common.somethingWrong"), body: e.message, tone: "error" });
    }
  }

  if (loading) return <div className="py-16 flex justify-center"><Spinner className="h-8 w-8 text-green-700" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">{t("admin.centres.title")}</h1>
        <Button onClick={() => { setForm({ ...EMPTY }); setEditId(null); }}>{t("admin.centres.add")}</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {centres.map((c) => (
          <Card key={c.id}>
            <div className="flex justify-between">
              <p className="font-medium">{c.name}</p>
              <StatusBadge tone={c.status === "active" ? "ok" : c.status === "closed" ? "danger" : "attention"}>{c.status}</StatusBadge>
            </div>
            <p className="text-sm text-muted">{c.address}</p>
            <p className="text-sm text-muted">Areas: {c.serviceAreas.map((s: any) => s.label).join(", ") || "none"}</p>
            <p className="text-sm text-muted">Commodities: {c.commodities.join(", ")}</p>
            <button className="text-link text-sm mt-1" onClick={() => {
              setEditId(c.id);
              setForm({ name: c.name, address: c.address, pincode: c.pincode, district: c.district, state: c.state, latitude: c.latitude ?? "", longitude: c.longitude ?? "", contactPhone: c.contactPhone ?? "", openingHours: c.openingHours ?? "", commodities: c.commodities.join(", "), status: c.status, serviceAreaIds: c.serviceAreas.map((s: any) => s.id) });
            }}>{t("admin.centres.edit")}</button>
          </Card>
        ))}
      </div>

      {form && (
        <Card>
          <h2 className="font-semibold mb-2">{editId ? t("admin.centres.edit") : t("admin.centres.add")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("admin.centres.name")} htmlFor="n"><input id="n" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Pincode" htmlFor="p"><input id="p" className="input" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></Field>
            <Field label="Address" htmlFor="a"><input id="a" className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <Field label="District" htmlFor="d"><input id="d" className="input" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} /></Field>
            <Field label="State" htmlFor="s"><input id="s" className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></Field>
            <Field label="Latitude" htmlFor="lat"><input id="lat" className="input" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} /></Field>
            <Field label="Longitude" htmlFor="lng"><input id="lng" className="input" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} /></Field>
            <Field label="Contact phone" htmlFor="ph"><input id="ph" className="input" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></Field>
            <Field label="Opening hours" htmlFor="oh"><input id="oh" className="input" value={form.openingHours} onChange={(e) => setForm({ ...form, openingHours: e.target.value })} /></Field>
            <Field label="Commodities (comma-separated)" htmlFor="cm"><input id="cm" className="input" value={form.commodities} onChange={(e) => setForm({ ...form, commodities: e.target.value })} /></Field>
            <Field label="Status" htmlFor="st">
              <select id="st" className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option><option value="paused">Paused</option><option value="closed">Closed</option>
              </select>
            </Field>
          </div>
          <Field label={t("admin.centres.areas")} htmlFor="ar">
            <div className="flex flex-wrap gap-2">
              {areas.map((a) => {
                const on = form.serviceAreaIds.includes(a.id);
                return (
                  <button key={a.id} type="button"
                    className={`badge ${on ? "bg-green-100 text-green-900" : "bg-gray-100 text-muted"}`}
                    onClick={() => setForm({ ...form, serviceAreaIds: on ? form.serviceAreaIds.filter((x: string) => x !== a.id) : [...form.serviceAreaIds, a.id] })}>
                    {a.district} ({a.pincodes.join(",")})
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setForm(null); setEditId(null); }}>{t("common.cancel")}</Button>
            <Button onClick={save}>{t("common.save")}</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
