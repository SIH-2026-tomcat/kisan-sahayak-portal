"use client";

import React from "react";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "saffron" | "outline" | "text";
  loading?: boolean;
};
export function Button({ variant = "primary", loading, className, children, disabled, ...rest }: BtnProps) {
  const map = {
    primary: "btn-primary",
    saffron: "btn-saffron",
    outline: "btn-outline",
    text: "btn-text",
  } as const;
  return (
    <button className={cx(map[variant], className)} disabled={disabled || loading} aria-busy={loading} {...rest}>
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cx("animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Card({ className, children, as: As = "div" }: { className?: string; children: React.ReactNode; as?: any }) {
  return <As className={cx("card p-4 sm:p-5", className)}>{children}</As>;
}

type BadgeTone = "ok" | "attention" | "closed" | "danger" | "info";
export function StatusBadge({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  const map: Record<BadgeTone, string> = {
    ok: "bg-green-100 text-green-900",
    attention: "bg-saffron-100 text-saffron-700",
    closed: "bg-gray-200 text-gray-700",
    danger: "bg-red-100 text-danger",
    info: "bg-blue-100 text-link",
  };
  return <span className={cx("badge", map[tone])}>{children}</span>;
}

export function Field({
  label,
  help,
  error,
  htmlFor,
  children,
}: {
  label: string;
  help?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {help && <span className="field-help">{help}</span>}
      {children}
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-line" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={cx(
            "whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 -mb-px transition",
            value === tab.id ? "border-green-700 text-green-900" : "border-transparent text-muted hover:text-ink"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2 mb-6 text-xs">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span
            className={cx(
              "flex h-6 w-6 items-center justify-center rounded-full font-semibold",
              i < current ? "bg-green-700 text-white" : i === current ? "bg-green-100 text-green-900 ring-2 ring-green-700" : "bg-gray-100 text-muted"
            )}
          >
            {i + 1}
          </span>
          <span className={cx("hidden sm:inline", i === current ? "text-ink font-medium" : "text-muted")}>{s}</span>
          {i < steps.length - 1 && <span className="w-6 h-px bg-line" />}
        </li>
      ))}
    </ol>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="text-center py-10 px-4">
      <p className="font-medium text-ink">{title}</p>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  );
}

export function Banner({ tone = "info", children }: { tone?: "info" | "warning" | "danger" | "success"; children: React.ReactNode }) {
  const map = {
    info: "bg-blue-50 text-link border-blue-200",
    warning: "bg-saffron-50 text-saffron-700 border-saffron-100",
    danger: "bg-red-50 text-danger border-red-200",
    success: "bg-green-50 text-green-900 border-green-100",
  };
  return <div className={cx("rounded-lg border px-4 py-3 text-sm", map[tone])} role="status">{children}</div>;
}
