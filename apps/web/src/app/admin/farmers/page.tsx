"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, Spinner, StatusBadge, Button, Field } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useT } from "@/i18n/I18nProvider";

export default function AdminFarmersPage() {
  const t = useT();
  const { push } = useToast();
  const [search, setSearch] = useState("");
  const [verification, setVerification] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);

  const load = () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    if (verification) q.set("verification", verification);
    api.get<any>(`admin/farmers?${q}`).then(setData).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  async function openDetail(id: string, unmask = false) {
    const d = await api.get<any>(`admin/farmers/${id}?unmask=${unmask}`);
    setDetail(d);
  }
  async function setVerif(id: string, status: string) {
    await api.post(`admin/farmers/${id}/verification`, { status });
    push({ title: `Marked ${status}`, tone: "success" });
    setDetail(null);
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("admin.farmers.title")}</h1>
      <Card>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[180px]">
            <Field label={t("common.search")} htmlFor="s">
              <input id="s" className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.farmers.searchPlaceholder")} onKeyDown={(e) => e.key === "Enter" && load()} />
            </Field>
          </div>
          <div>
            <Field label="Verification" htmlFor="v">
              <select id="v" className="input" value={verification} onChange={(e) => setVerification(e.target.value)}>
                <option value="">All</option><option value="pending">Pending</option><option value="verified">Verified</option><option value="rejected">Rejected</option>
              </select>
            </Field>
          </div>
          <Button onClick={load}>{t("common.filter")}</Button>
        </div>
      </Card>

      {loading ? (
        <div className="py-10 flex justify-center"><Spinner className="h-6 w-6 text-green-700" /></div>
      ) : (
        <>
          <p className="text-sm text-muted">{data.total} farmers</p>
          <div className="hidden md:block card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-paper text-left"><tr>
                {t("admin.farmers.columns").split("|").map((c: string) => <th key={c} className="px-3 py-2 font-medium">{c}</th>)}
                <th></th>
              </tr></thead>
              <tbody>
                {data.items.map((f: any) => (
                  <tr key={f.id} className="border-t border-line">
                    <td className="px-3 py-2">{f.name}</td>
                    <td className="px-3 py-2">{f.mobileMasked}</td>
                    <td className="px-3 py-2">{f.emailMasked}</td>
                    <td className="px-3 py-2">{f.aadhaarMasked}</td>
                    <td className="px-3 py-2">{f.area}</td>
                    <td className="px-3 py-2"><StatusBadge tone={f.verification === "verified" ? "ok" : f.verification === "rejected" ? "danger" : "attention"}>{f.verification}</StatusBadge></td>
                    <td className="px-3 py-2"><button className="text-link" onClick={() => openDetail(f.id)}>Open</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-2">
            {data.items.map((f: any) => (
              <Card key={f.id}>
                <div className="flex justify-between"><span className="font-medium">{f.name}</span><StatusBadge tone={f.verification === "verified" ? "ok" : "attention"}>{f.verification}</StatusBadge></div>
                <p className="text-sm text-muted">{f.mobileMasked} · {f.emailMasked}</p>
                <p className="text-sm text-muted">{f.area}</p>
                <button className="text-link text-sm mt-1" onClick={() => openDetail(f.id)}>Open</button>
              </Card>
            ))}
          </div>
        </>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setDetail(null)}>
          <div className="h-full w-full max-w-md overflow-auto bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-semibold">{detail.farmer.name ?? "Farmer"}</h2>
              <button onClick={() => setDetail(null)} className="btn-text">✕</button>
            </div>
            <dl className="mt-3 text-sm space-y-1">
              <div className="flex justify-between"><dt className="text-muted">Email</dt><dd>{detail.farmer.email}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Mobile</dt><dd>{detail.farmer.mobile}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Aadhaar</dt><dd>{detail.farmer.aadhaar}</dd></div>
              <div><dt className="text-muted">Address</dt><dd>{detail.farmer.address ?? "-"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Area</dt><dd>{detail.farmer.area ?? "-"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Verification</dt><dd>{detail.farmer.verification}</dd></div>
            </dl>
            {!detail.unmasked && (
              <button className="mt-2 text-xs text-link" onClick={() => openDetail(detail.farmer.id, true)}>{t("admin.farmers.unmask")}</button>
            )}
            <div className="mt-3 flex gap-2">
              <Button variant="outline" onClick={() => setVerif(detail.farmer.id, "verified")}>Verify</Button>
              <Button variant="outline" className="text-danger border-red-300" onClick={() => setVerif(detail.farmer.id, "rejected")}>Reject</Button>
            </div>
            <h3 className="mt-4 font-medium text-sm">Bookings</h3>
            <ul className="text-sm text-muted">
              {detail.bookings.map((b: any) => <li key={b.id}>{b.bookingCode} · {b.centre.name} · {b.status}</li>)}
              {detail.bookings.length === 0 && <li>None</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
