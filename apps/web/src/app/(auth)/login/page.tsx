"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { PublicShell } from "@/components/PublicShell";
import { Card, Field, Button, Tabs, Banner } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";

type Method = "email" | "mobile";

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const [method, setMethod] = useState<Method>("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      let email = identifier.trim();
      if (method === "mobile") {
        const res = await fetch(`/api/bff/auth/email-for-mobile?mobile=${encodeURIComponent(identifier)}`);
        if (!res.ok) throw new Error(t("auth.errUnknownAccount"));
        email = (await res.json()).email;
      }
      const { error: authError } = await authClient.signIn.email({ email, password });
      if (authError) {
        setError(authError.message?.toLowerCase().includes("password") ? t("auth.errWrongPassword") : t("auth.errUnknownAccount"));
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.somethingWrong"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicShell>
      <div className="container-page py-10 max-w-md">
        <h1 className="text-2xl font-bold">{t("auth.loginTitle")}</h1>
        <p className="text-sm text-muted mt-1">{t("auth.loginHelper")}</p>

        <Card className="mt-4">
          <Tabs<Method>
            value={method}
            onChange={(m) => { setMethod(m); setIdentifier(""); setError(null); }}
            tabs={[
              { id: "email", label: t("auth.methodEmail") },
              { id: "mobile", label: t("auth.methodMobile") },
            ]}
          />
          <form onSubmit={submit} className="mt-4">
            {error && <div className="mb-3"><Banner tone="danger">{error}</Banner></div>}
            <Field label={method === "email" ? t("auth.email") : t("auth.mobile")} htmlFor="id">
              <input
                id="id"
                className="input"
                type={method === "email" ? "email" : "tel"}
                inputMode={method === "email" ? "email" : "numeric"}
                autoComplete={method === "email" ? "email" : "tel"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </Field>
            <Field label={t("auth.password")} htmlFor="pw">
              <input id="pw" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            <Button type="submit" className="w-full" loading={busy}>{t("nav.login")}</Button>
          </form>
        </Card>

        <p className="mt-4 text-sm text-muted">
          {t("auth.noAccount")} <Link href="/register" className="font-medium">{t("auth.createAccount")}</Link>
        </p>
      </div>
    </PublicShell>
  );
}
