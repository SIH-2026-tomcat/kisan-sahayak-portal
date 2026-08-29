"use client";
import { authClient } from "@/lib/auth/client";
import { useT } from "@/i18n/I18nProvider";

export function SignOutButton({ className }: { className?: string }) {
  const t = useT();
  return (
    <button
      className={className ?? "btn-text text-sm"}
      onClick={async () => {
        try {
          await authClient.signOut();
        } catch {}
        window.location.href = "/";
      }}
    >
      {t("nav.logout")}
    </button>
  );
}
