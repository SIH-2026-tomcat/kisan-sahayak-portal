"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Card, Tabs, StatusBadge, Button, Spinner, EmptyState, Banner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useRealtime } from "@/lib/realtime";
import { useT } from "@/i18n/I18nProvider";
import { formatSlot } from "@/lib/format";
import { CentreMap } from "@/components/farmer/CentreMap";

type Tab = "open" | "upcoming" | "closed";

export default function BookPage() {
  const t = useT();
  const router = useRouter();
  const { push } = useToast();
  const [me, setMe] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("open");
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "map">("list");
  const [booking, setBooking] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<any | null>(null);

  const areaId = me?.profile?.serviceAreaId;

  const loadSlots = useCallback(() => {
    if (!areaId) return;
    setLoading(true);
    api.get<any>(`slots?serviceAreaId=${areaId}&tab=${tab}`)
      .then((d) => setSlots(d.items))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [areaId, tab]);

  useEffect(() => {
    api.get<any>("auth/me").then(setMe);
  }, []);
  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  useRealtime((ev) => {
    if (["slot.published", "slot.updated", "slot.full", "slot.closed", "booking.created", "booking.cancelled"].includes(ev.type)) {
      loadSlots();
      if (ev.type === "slot.published") push({ title: t("announcements.title"), body: "New slots released for your area.", tone: "info" });
    }
  });

  async function doBook(slotId: string) {
    setBooking(slotId);
    try {
      const res = await api.post<any>(`slots/${slotId}/book`);
      push({ title: t("booking.confirmedTitle"), body: t("booking.confirmedMsg"), tone: "success" });
      router.push(`/book/${res.booking.id}`);
    } catch (e) {
      const err = e as ApiError;
      push({ title: t("common.somethingWrong"), body: err.message, tone: "error" });
      loadSlots();
    } finally {
      setBooking(null);
      setConfirm(null);
    }
  }

  if (!me) return <div className="py-16 flex justify-center"><Spinner className="h-8 w-8 text-green-700" /></div>;

  if (!areaId) {
    return <Banner tone="warning">{t("dashboard.noCoverage")}</Banner>;
  }

  return (
    <div className="max-w-reading space-y-4">
      <div>
        <h1 className="text-xl font-bold">{t("booking.title")}</h1>
        <p className="text-sm text-muted">{t("booking.yourArea", { area: me?.profile?.district ?? "" })}</p>
      </div>

      <div className="flex items-center justify-between">
        <Tabs<Tab>
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "open", label: t("booking.tabOpen") },
            { id: "upcoming", label: t("booking.tabUpcoming") },
            { id: "closed", label: t("booking.tabClosed") },
          ]}
        />
        <button className="btn-text text-sm shrink-0" onClick={() => setView((v) => (v === "list" ? "map" : "list"))}>
          {view === "list" ? t("common.mapView") : t("common.listView")}
        </button>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center"><Spinner className="h-6 w-6 text-green-700" /></div>
      ) : slots.length === 0 ? (
        <EmptyState title={t("booking.noSlots")} />
      ) : view === "map" ? (
        <CentreMap centres={dedupeCentres(slots)} />
      ) : (
        <div className="space-y-3">
          {slots.map((s) => {
            const remaining = s.remaining ?? Math.max(0, s.capacity - s.bookedCount);
            const isFull = remaining <= 0 || s.status === "full";
            return (
              <Card key={s.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{s.centre.name}</p>
                    <p className="text-sm text-muted">{s.procurementWindow.commodity} · {s.procurementWindow.season} {s.procurementWindow.year}</p>
                    <p className="text-sm text-muted">{formatSlot(s)}</p>
                    <p className="text-sm text-muted">{s.centre.address}</p>
                  </div>
                  {tab === "open" ? (
                    isFull ? <StatusBadge tone="closed">{t("booking.full")}</StatusBadge>
                      : <StatusBadge tone={remaining <= 5 ? "attention" : "ok"}>{t("booking.slotsLeft", { count: remaining })}</StatusBadge>
                  ) : tab === "upcoming" ? (
                    <StatusBadge tone="attention">{t("booking.notYetOpen")}</StatusBadge>
                  ) : (
                    <StatusBadge tone="closed">{t("booking.tabClosed")}</StatusBadge>
                  )}
                </div>
                {tab === "open" && (
                  <Button
                    className="mt-3 w-full"
                    disabled={isFull}
                    loading={booking === s.id}
                    onClick={() => setConfirm(s)}
                  >
                    {isFull ? t("booking.full") : t("booking.bookBtn")}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-3" onClick={() => setConfirm(null)}>
          <div className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">{t("booking.confirmTitle")}</h2>
            <p className="mt-1 text-sm text-muted">{t("booking.confirmBody")}</p>
            <div className="mt-3 text-sm">
              <p className="font-medium">{confirm.centre.name}</p>
              <p className="text-muted">{formatSlot(confirm)}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirm(null)}>{t("common.cancel")}</Button>
              <Button className="flex-1" loading={booking === confirm.id} onClick={() => doBook(confirm.id)}>{t("booking.bookBtn")}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function dedupeCentres(slots: any[]) {
  const map = new Map<string, any>();
  for (const s of slots) if (!map.has(s.centre.id)) map.set(s.centre.id, s.centre);
  return [...map.values()];
}
