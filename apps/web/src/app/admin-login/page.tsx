"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Card, Field, Button, Banner } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";
import { GovMark } from "@/components/GovMark";
import { AshokaChakra } from "@/components/national/AshokaChakra";

export default function AdminLoginPage() {
  const t = useT();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error: authError } = await authClient.signIn.email({ email: email.trim(), password });
      if (authError) {
        setError(t("admin.login.errInvalid"));
        return;
      }
      const me = await fetch("/api/bff/auth/me").then((r) => (r.ok ? r.json() : null));
      if (!me || me.user.role === "farmer") {
        setError(t("admin.login.notAdmin"));
        return;
      }
      window.location.href = "/admin";
    } catch {
      setError(t("common.somethingWrong"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-green-900 p-4">
      <AshokaChakra className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 text-white/10" />
      <Card className="w-full max-w-sm overflow-hidden !p-0">
        <div className="tricolour-strip" />
        <div className="p-5">
          <GovMark />
          <h1 className="mt-4 text-xl font-bold">{t("admin.login.title")}</h1>
          <p className="text-sm text-muted">{t("admin.subtitle")}</p>
        <form onSubmit={submit} className="mt-4">
          {error && <div className="mb-3"><Banner tone="danger">{error}</Banner></div>}
          <Field label={t("auth.email")} htmlFor="em"><input id="em" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
          <Field label={t("auth.password")} htmlFor="pw"><input id="pw" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
          <Button type="submit" className="w-full" loading={busy}>{t("nav.login")}</Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
