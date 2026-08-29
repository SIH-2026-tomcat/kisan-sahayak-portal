"use client";

import { useEffect, useRef } from "react";

export type RealtimeEvent = { type: string; payload?: Record<string, unknown>; serviceAreaId?: string | null };

/** Subscribe to the server-sent event stream. Returns nothing; pass a handler. */
export function useRealtime(onEvent: (ev: RealtimeEvent) => void) {
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    let es: EventSource | null = null;
    let closed = false;
    let retry: ReturnType<typeof setTimeout>;

    const connect = () => {
      if (closed) return;
      es = new EventSource("/api/events");
      const types = [
        "slot.published",
        "slot.updated",
        "slot.full",
        "slot.closed",
        "booking.created",
        "booking.cancelled",
        "announcement.sent",
        "notification.created",
      ];
      for (const type of types) {
        es.addEventListener(type, (e) => {
          try {
            handler.current({ type, ...JSON.parse((e as MessageEvent).data) });
          } catch {
            handler.current({ type });
          }
        });
      }
      es.onerror = () => {
        es?.close();
        if (!closed) retry = setTimeout(connect, 4000);
      };
    };
    connect();

    return () => {
      closed = true;
      clearTimeout(retry);
      es?.close();
    };
  }, []);
}

/** Tracks connection state for the "Live data connected / lost" banner. */
export function useRealtimeStatus() {
  const stateRef = useRef<"connecting" | "live" | "lost">("connecting");
  return stateRef;
}
