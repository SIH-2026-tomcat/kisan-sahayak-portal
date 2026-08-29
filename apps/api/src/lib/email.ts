import { Resend } from "resend";
import { env } from "../config.js";

let client: Resend | null = null;
function resend() {
  if (!env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(env.RESEND_API_KEY);
  return client;
}

type Lang = "en" | "hi" | "te" | "bn";
export type TemplateKey =
  | "booking_confirmed"
  | "slot_released"
  | "slot_full"
  | "booking_cancelled"
  | "centre_closed"
  | "announcement"
  | "payment_update"
  | "procurement_update";

type Rendered = { subject: string; text: string };

const T: Record<TemplateKey, Partial<Record<Lang, (p: any) => Rendered>>> = {
  booking_confirmed: {
    en: (p) => ({
      subject: `Booking confirmed - ${p.bookingCode}`,
      text: `Your procurement slot is booked.\n\nBooking ID: ${p.bookingCode}\nCentre: ${p.centreName}\n${p.centreAddress}\nDate: ${p.slotDate}\nTime: ${p.startTime} - ${p.endTime}\nToken number: ${p.tokenNumber}\n\nPlease arrive within your time window and carry the documents listed for your procurement activity.`,
    }),
    hi: (p) => ({
      subject: `बुकिंग की पुष्टि हो गई - ${p.bookingCode}`,
      text: `आपका खरीद स्लॉट बुक हो गया है।\n\nबुकिंग आईडी: ${p.bookingCode}\nकेंद्र: ${p.centreName}\nतारीख: ${p.slotDate}\nसमय: ${p.startTime} - ${p.endTime}\nटोकन नंबर: ${p.tokenNumber}`,
    }),
  },
  slot_released: {
    en: (p) => ({
      subject: `New procurement slots are open in your area`,
      text: `New rice procurement slots are now open for ${p.areaName}. Booking is open now. Please book only a centre shown for your service area.`,
    }),
    hi: (p) => ({
      subject: `आपके क्षेत्र में नए खरीद स्लॉट उपलब्ध हैं`,
      text: `${p.areaName} के लिए नए धान खरीद स्लॉट अब खुले हैं। कृपया अभी बुकिंग करें।`,
    }),
  },
  slot_full: {
    en: (p) => ({
      subject: `A slot you viewed is now full`,
      text: `The slot at ${p.centreName} on ${p.slotDate} (${p.startTime} - ${p.endTime}) is now full. Please choose another available slot.`,
    }),
  },
  booking_cancelled: {
    en: (p) => ({
      subject: `Your booking ${p.bookingCode} was cancelled`,
      text: `Your booking ${p.bookingCode} at ${p.centreName} on ${p.slotDate} has been cancelled${p.reason ? `: ${p.reason}` : "."}\nPlease open Slot Booking to choose another time.`,
    }),
  },
  centre_closed: {
    en: (p) => ({
      subject: `Centre closure affecting your booking`,
      text: `${p.centreName} will be closed on ${p.slotDate}. Your booking ${p.bookingCode} is affected. Please check Notifications and rebook when new slots are published.`,
    }),
  },
  announcement: {
    en: (p) => ({ subject: p.title, text: p.message }),
  },
  payment_update: {
    en: (p) => ({
      subject: `Payment update for booking ${p.bookingCode}`,
      text: `Payment status for booking ${p.bookingCode}: ${p.status}${p.reference ? ` (Ref: ${p.reference})` : ""}.`,
    }),
  },
  procurement_update: {
    en: (p) => ({
      subject: `Procurement update for booking ${p.bookingCode}`,
      text: `Your produce has been ${p.status} at ${p.centreName}.`,
    }),
  },
};

export function renderTemplate(key: TemplateKey, lang: Lang, payload: Record<string, unknown>): Rendered {
  const byLang = T[key];
  const fn = byLang[lang] || byLang.en!;
  return fn(payload);
}

export async function sendEmail(to: string, key: TemplateKey, lang: Lang, payload: Record<string, unknown>) {
  const r = resend();
  const { subject, text } = renderTemplate(key, lang, payload);
  if (!r || !env.EMAIL_FROM) {
    return { id: null, skipped: true as const, subject };
  }
  const res = await r.emails.send({
    from: `Kisan Sahayak Portal <${env.EMAIL_FROM}>`,
    to,
    reply_to: env.EMAIL_REPLY_TO || env.EMAIL_FROM,
    subject,
    text,
  });
  if (res.error) throw new Error(res.error.message);
  return { id: res.data?.id ?? null, skipped: false as const, subject };
}
