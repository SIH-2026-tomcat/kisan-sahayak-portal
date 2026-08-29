"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { cx } from "./ui";

type Toast = { id: number; title: string; body?: string; tone: "success" | "info" | "warning" | "error" };
type Ctx = { push: (t: Omit<Toast, "id">) => void };

const ToastContext = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((cur) => [...cur, { ...t, id }]);
    const ttl = t.tone === "error" ? 9000 : 6000;
    setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== id)), ttl);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-3 sm:items-end sm:p-4" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cx(
              "w-full max-w-sm rounded-lg border px-4 py-3 shadow-md bg-white",
              t.tone === "error" && "border-red-200",
              t.tone === "warning" && "border-saffron-100",
              t.tone === "success" && "border-green-100",
              t.tone === "info" && "border-blue-200"
            )}
            role={t.tone === "error" ? "alert" : "status"}
          >
            <p className="font-medium text-ink text-sm">{t.title}</p>
            {t.body && <p className="text-sm text-muted mt-0.5">{t.body}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
