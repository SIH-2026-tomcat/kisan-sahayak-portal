"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, Spinner, EmptyState, Tabs } from "@/components/ui";
import { useRealtime } from "@/lib/realtime";
import { useT } from "@/i18n/I18nProvider";
import { formatDateTime } from "@/lib/format";

type View = "notifications" | "announcements";

export default function AnnouncementsPage() {
  const t = useT();
  const [view, setView] = useState<View>("notifications");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    Promise.all([api.get<any>("notifications"), api.get<any>("announcements")]).then(([n, a]) => {
      setNotifications(n.items);
      setUnread(n.unread);
      setAnnouncements(a.items);
      setLoading(false);
    });

  useEffect(() => {
    load();
  }, []);
  useRealtime((ev) => {
    if (["notification.created", "announcement.sent"].includes(ev.type)) load();
  });

  if (loading) return <div className="py-16 flex justify-center"><Spinner className="h-8 w-8 text-green-700" /></div>;

  return (
    <div className="max-w-reading space-y-4">
      <h1 className="text-xl font-bold">{t("announcements.title")}</h1>
      <div className="flex items-center justify-between">
        <Tabs<View>
          value={view}
          onChange={setView}
          tabs={[
            { id: "notifications", label: `${t("announcements.notificationsTitle")}${unread ? ` (${unread})` : ""}` },
            { id: "announcements", label: t("announcements.title") },
          ]}
        />
        {view === "notifications" && unread > 0 && (
          <button className="btn-text text-sm" onClick={async () => { await api.post("notifications/read-all"); load(); }}>
            {t("announcements.markAllRead")}
          </button>
        )}
      </div>

      {view === "notifications" ? (
        notifications.length === 0 ? (
          <EmptyState title={t("announcements.empty")} />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <Card key={n.id} className={n.readAt ? "opacity-70" : ""}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{n.title}</p>
                    <p className="text-sm text-muted">{n.body}</p>
                    <p className="text-xs text-muted mt-1">{formatDateTime(n.createdAt)}</p>
                  </div>
                  {!n.readAt && (
                    <button className="text-xs text-link shrink-0" onClick={async () => { await api.post(`notifications/${n.id}/read`); load(); }}>
                      {t("announcements.markRead")}
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )
      ) : announcements.length === 0 ? (
        <EmptyState title={t("announcements.empty")} />
      ) : (
        <div className="space-y-2">
          {announcements.map((a) => (
            <Card key={a.id}>
              <p className="font-medium">{a.title}</p>
              <p className="text-sm text-muted">{a.message}</p>
              <p className="text-xs text-muted mt-1">{formatDateTime(a.sentAt)}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
