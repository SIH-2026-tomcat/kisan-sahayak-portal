"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, Spinner } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";

export default function ProcurementPage() {
  const t = useT();
  const [win, setWin] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>("procurement/current").then((d) => setWin(d.window)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-16 flex justify-center"><Spinner className="h-8 w-8 text-green-700" /></div>;

  const before = t("procurement.beforeItems").split("|");
  const steps = t("procurement.steps").split("|");

  return (
    <div className="max-w-reading space-y-4">
      <h1 className="text-xl font-bold">{t("procurement.title")}</h1>
      {win && (
        <Card className="bg-green-50 border-green-100">
          <p className="font-semibold text-green-900">
            {t("procurement.seasonBanner", { commodity: win.commodity, season: win.season, year: win.year })}
          </p>
          <p className="text-sm text-muted">{win.startDate} – {win.endDate}</p>
        </Card>
      )}

      <Card>
        <h2 className="font-semibold">{t("procurement.before")}</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-muted space-y-1">
          {before.map((b) => <li key={b}>{b}</li>)}
        </ul>
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">{t("procurement.timelineTitle")}</h2>
        <ol className="space-y-2">
          {steps.map((s, i) => (
            <li key={s} className="flex gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-900 font-semibold">{i + 1}</span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <h2 className="font-semibold">{t("procurement.faqTitle")}</h2>
        <details className="mt-2 text-sm"><summary className="font-medium cursor-pointer">What documents should I bring?</summary><p className="mt-1 text-muted">Carry the documents listed on your booking confirmation and a photo ID.</p></details>
        <details className="mt-2 text-sm"><summary className="font-medium cursor-pointer">When is payment made?</summary><p className="mt-1 text-muted">Payment status is shown in My Bookings only after the operational record exists.</p></details>
      </Card>
    </div>
  );
}
