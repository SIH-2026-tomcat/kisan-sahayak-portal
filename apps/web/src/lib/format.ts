export function formatSlot(slot: { slotDate: string; startTime: string; endTime: string }): string {
  const d = new Date(slot.slotDate + "T00:00:00");
  const date = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return `${date} · ${slot.startTime} - ${slot.endTime}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}
