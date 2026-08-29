"use client";
import { PublicShell } from "@/components/PublicShell";
import { Card } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";

const FAQ = [
  ["How do I book a slot?", "Register, verify your email, add your address and pincode, then open Slot Booking. Only centres for your service area are shown."],
  ["What if my pincode has no centre?", "You can still register. Booking becomes available once an eligible centre is configured for your area. Check Announcements."],
  ["Is a booking a guarantee of payment?", "No. Procurement outcome and payment status are shown separately and update only when the operational record exists."],
  ["How do I cancel?", "Open My Bookings, select the booking, and choose Cancel booking where the policy allows it."],
];

export default function HelpPage() {
  const t = useT();
  return (
    <PublicShell>
      <div className="container-page py-10 max-w-reading">
        <h1 className="text-2xl font-bold">{t("nav.help")}</h1>
        <div className="mt-4 space-y-3">
          {FAQ.map(([q, a]) => (
            <Card key={q}>
              <p className="font-medium">{q}</p>
              <p className="mt-1 text-sm text-muted">{a}</p>
            </Card>
          ))}
          <Card>
            <p className="font-medium">{t("footer.contact")}</p>
            <p className="mt-1 text-sm text-muted">Help desk: 1800-11-4000 · kisansahayak@hawkvance.in</p>
          </Card>
        </div>
      </div>
    </PublicShell>
  );
}
