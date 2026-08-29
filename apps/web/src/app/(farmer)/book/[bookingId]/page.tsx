"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Card, Button, Banner, Spinner, StatusBadge } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useT } from "@/i18n/I18nProvider";
import { formatSlot } from "@/lib/format";
import { CentreMap } from "@/components/farmer/CentreMap";

export default function BookingConfirmationPage() {
  const t = useT();
  const router = useRouter();
  const { push } = useToast();
  const { bookingId } = useParams<{ bookingId: string }>();
  const [b, setB] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.get<any>(`bookings/${bookingId}`).then((d) => setB(d.booking)).catch((e: ApiError) => setError(e.message));
  }, [bookingId]);

  if (error) return <Banner tone="danger">{error}</Banner>;
  if (!b) return <div className="py-16 flex justify-center"><Spinner className="h-8 w-8 text-green-700" /></div>;

  const active = !["cancelled"].includes(b.status);
  const ics = buildIcs(b);

  async function cancel() {
    if (!confirm(t("booking.cancelConfirm"))) return;
    setCancelling(true);
    try {
      await api.post(`bookings/${bookingId}/cancel`, {});
      push({ title: t("bookingStatus.cancelled"), tone: "info" });
      router.push("/my-bookings");
    } catch (e) {
      push({ title: t("common.somethingWrong"), body: (e as ApiError).message, tone: "error" });
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="max-w-reading space-y-4">
      {active && b.status === "confirmed" && (
        <Banner tone="success">
          <span className="font-semibold">{t("booking.confirmedTitle")}.</span> {t("booking.confirmedMsg")}
        </Banner>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-muted">{t("booking.bookingId")}</p>
          <StatusBadge tone={active ? "ok" : "closed"}>{t(`bookingStatus.${b.status}`)}</StatusBadge>
        </div>
        <p className="text-2xl font-bold tracking-wide">{b.bookingCode}</p>

        <dl className="mt-3 grid grid-cols-1 gap-2 text-sm">
          <div><dt className="text-muted">{t("booking.centre")}</dt><dd className="font-medium">{b.centre.name}</dd><dd className="text-muted">{b.centre.address}</dd></div>
          <div><dt className="text-muted">{t("booking.dateTime")}</dt><dd className="font-medium">{formatSlot(b.slot)}</dd></div>
          <div><dt className="text-muted">{t("booking.token")}</dt><dd className="font-medium">{b.tokenNumber}</dd></div>
        </dl>

        <p className="mt-3 text-sm text-muted">{t("booking.prepare")}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <a className="btn-outline no-underline" href={ics} download={`${b.bookingCode}.ics`}>{t("booking.addCalendar")}</a>
          {b.centre.latitude && (
            <a
              className="btn-outline no-underline"
              target="_blank"
              rel="noreferrer"
              href={`https://www.openstreetmap.org/?mlat=${b.centre.latitude}&mlon=${b.centre.longitude}#map=16/${b.centre.latitude}/${b.centre.longitude}`}
            >
              {t("booking.directions")}
            </a>
          )}
          {active && (
            <Button variant="outline" loading={cancelling} onClick={cancel} className="text-danger border-red-300">
              {t("booking.cancelBtn")}
            </Button>
          )}
        </div>
      </Card>

      <CentreMap centres={[b.centre]} />
    </div>
  );
}

function buildIcs(b: any) {
  const dt = (d: string, tm: string) => `${d.replace(/-/g, "")}T${tm.replace(":", "")}00`;
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `UID:${b.bookingCode}@kisan-sahayak`,
    `DTSTART:${dt(b.slot.slotDate, b.slot.startTime)}`,
    `DTEND:${dt(b.slot.slotDate, b.slot.endTime)}`,
    `SUMMARY:Procurement slot ${b.bookingCode}`,
    `LOCATION:${b.centre.name}, ${b.centre.address}`,
    `DESCRIPTION:Token ${b.tokenNumber}. Carry required documents.`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
}
