"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { useRealtime } from "@/lib/realtime";
import { useT } from "@/i18n/I18nProvider";

type Notification = { id: string; title: string; body: string; readAt: string | null; createdAt: string };

export function NotificationBell() {
  const t = useT();
  const { push } = useToast();
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = () =>
    api.get<{ items: Notification[]; unread: number }>("notifications").then((d) => {
      setItems(d.items);
      setUnread(d.unread);
    }).catch(() => {});

  useEffect(() => {
    load();
  }, []);

  useRealtime((ev) => {
    if (ev.type === "notification.created") {
      push({ title: (ev.payload?.title as string) ?? t("announcements.notificationsTitle"), tone: "info" });
      load();
    }
    if (ev.type === "announcement.sent") {
      push({ title: (ev.payload?.title as string) ?? "New announcement", tone: "info" });
      load();
    }
  });

  return (
    <div className="relative">
      <button
        className="btn-text relative"
        onClick={() => setOpen((o) => !o)}
        aria-label={`${t("nav.notifications")} (${unread})`}
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-saffron px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] card p-0 z-50 max-h-96 overflow-auto">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="text-sm font-medium">{t("nav.notifications")}</span>
            <button
              className="text-xs text-link"
              onClick={async () => {
                await api.post("notifications/read-all");
                load();
              }}
            >
              {t("announcements.markAllRead")}
            </button>
          </div>
          {items.length === 0 && <p className="p-4 text-sm text-muted">{t("announcements.empty")}</p>}
          {items.map((n) => (
            <div key={n.id} className={`border-b border-line px-3 py-2 text-sm ${n.readAt ? "opacity-60" : ""}`}>
              <p className="font-medium">{n.title}</p>
              <p className="text-muted">{n.body}</p>
            </div>
          ))}
          <Link href="/announcements" className="block px-3 py-2 text-center text-sm text-link" onClick={() => setOpen(false)}>
            {t("announcements.title")}
          </Link>
        </div>
      )}
    </div>
  );
}
