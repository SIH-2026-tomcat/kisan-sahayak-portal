"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, Spinner } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";
import { formatDateTime } from "@/lib/format";

export default function AdminAuditPage() {
  const t = useT();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>("admin/audit").then((d) => { setItems(d.items); setLoading(false); });
  }, []);

  if (loading) return <div className="py-16 flex justify-center"><Spinner className="h-8 w-8 text-green-700" /></div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("admin.nav.audit")}</h1>
      <Card>
        <table className="w-full text-sm">
          <thead className="text-left"><tr><th className="py-1">When</th><th>Actor</th><th>Action</th><th>Entity</th></tr></thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-t border-line">
                <td className="py-1 text-muted text-xs">{formatDateTime(a.createdAt)}</td>
                <td>{a.actorEmail}</td>
                <td>{a.action}</td>
                <td className="text-muted">{a.entityType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
