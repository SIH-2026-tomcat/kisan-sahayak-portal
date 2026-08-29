"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, Spinner, Button, Field } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useT } from "@/i18n/I18nProvider";
import { formatDateTime } from "@/lib/format";

export default function AdminAnnouncementsPage() {
  const t = useT();
  const { push } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", message: "", audienceType: "all", serviceAreaId: "", channels: ["in_app", "email"] as string[], sendNow: true });
  const [busy, setBusy] = useState(false);

  const load = () => api.get<any>("admin/announcements").then((d) => { setItems(d.items); setLoading(false); });
  useEffect(() => {
    load();
    api.get<any>("admin/service-areas").then((d) => setAreas(d.items));
  }, []);

  async function send() {
    setBusy(true);
    try {
      const res = await api.post<any>("admin/announcements", { ...form, serviceAreaId: form.audienceType === "service_area" ? form.serviceAreaId : undefined });
      push({ title: t("admin.announcements.sentTo", { count: res.recipientCount }), tone: "success" });
      setForm({ ...form, title: "", message: "" });
      load();
    } catch (e: any) {
      push({ title: t("common.somethingWrong"), body: e.message, tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("admin.announcements.title")}</h1>

      <Card>
        <h2 className="font-semibold mb-2">{t("admin.announcements.compose")}</h2>
        <Field label={t("admin.announcements.titleField")} htmlFor="ti"><input id="ti" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label={t("admin.announcements.messageField")} htmlFor="ms">
          <textarea id="ms" className="input min-h-24 py-2" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("admin.announcements.audience")} htmlFor="au">
            <select id="au" className="input" value={form.audienceType} onChange={(e) => setForm({ ...form, audienceType: e.target.value })}>
              <option value="all">{t("admin.announcements.audienceAll")}</option>
              <option value="service_area">{t("admin.announcements.audienceArea")}</option>
              <option value="active_bookings">{t("admin.announcements.audienceActive")}</option>
            </select>
          </Field>
          {form.audienceType === "service_area" && (
            <Field label="Area" htmlFor="ar">
              <select id="ar" className="input" value={form.serviceAreaId} onChange={(e) => setForm({ ...form, serviceAreaId: e.target.value })}>
                <option value="">Select…</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.district}</option>)}
              </select>
            </Field>
          )}
        </div>
        <Field label={t("admin.announcements.channels")} htmlFor="ch">
          <div className="flex gap-3 text-sm">
            {["in_app", "email"].map((c) => (
              <label key={c} className="flex items-center gap-1.5">
                <input type="checkbox" checked={form.channels.includes(c)} onChange={(e) => setForm({ ...form, channels: e.target.checked ? [...form.channels, c] : form.channels.filter((x) => x !== c) })} />
                {c === "in_app" ? "In-app" : "Email"}
              </label>
            ))}
          </div>
        </Field>
        <Button loading={busy} disabled={!form.title || !form.message || form.channels.length === 0} onClick={send}>{t("admin.announcements.sendNow")}</Button>
      </Card>

      {loading ? <Spinner className="h-6 w-6 text-green-700" /> : (
        <div className="space-y-2">
          {items.map((a) => (
            <Card key={a.id}>
              <div className="flex justify-between">
                <p className="font-medium">{a.title}</p>
                <span className="text-xs text-muted">{a.sentAt ? `sent ${formatDateTime(a.sentAt)}` : "draft"}</span>
              </div>
              <p className="text-sm text-muted">{a.message}</p>
              <p className="text-xs text-muted mt-1">{a.audienceType}{a.areaLabel ? ` · ${a.areaLabel}` : ""} · by {a.createdByEmail ?? "system"}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
