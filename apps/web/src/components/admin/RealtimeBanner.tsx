"use client";

import { useEffect, useState } from "react";
import { useT } from "@/i18n/I18nProvider";
import { cx } from "@/components/ui";

export function RealtimeBanner() {
  const t = useT();
  const [state, setState] = useState<"connecting" | "live" | "lost">("connecting");

  useEffect(() => {
    let es: EventSource | null = null;
    let closed = false;
    let retry: ReturnType<typeof setTimeout>;
    const connect = () => {
      es = new EventSource("/api/events");
      es.addEventListener("ready", () => setState("live"));
      es.onopen = () => setState("live");
      es.onerror = () => {
        setState("lost");
        es?.close();
        if (!closed) retry = setTimeout(connect, 4000);
      };
    };
    connect();
    return () => { closed = true; clearTimeout(retry); es?.close(); };
  }, []);

  return (
    <div
      className={cx(
        "mb-3 rounded px-3 py-1.5 text-xs font-medium",
        state === "live" ? "bg-green-100 text-green-900" : "bg-saffron-100 text-saffron-700"
      )}
      role="status"
    >
      <span className={cx("mr-1.5 inline-block h-2 w-2 rounded-full", state === "live" ? "bg-green-600" : "bg-saffron-600")} />
      {state === "live" ? t("common.liveConnected") : t("common.liveLost")}
    </div>
  );
}
