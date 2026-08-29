"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, Spinner, Banner } from "@/components/ui";
import { LanguageSelector } from "@/components/LanguageSelector";
import { SignOutButton } from "@/components/SignOutButton";
import { useT } from "@/i18n/I18nProvider";

export default function AdminSettingsPage() {
  const t = useT();
  const [me, setMe] = useState<any>(null);
  useEffect(() => {
    api.get<any>("auth/me").then(setMe);
  }, []);
  if (!me) return <div className="py-16 flex justify-center"><Spinner className="h-8 w-8 text-green-700" /></div>;

  return (
    <div className="space-y-4 max-w-reading">
      <h1 className="text-xl font-bold">{t("admin.nav.settings")}</h1>
      <Card>
        <dl className="text-sm space-y-1">
          <div className="flex justify-between"><dt className="text-muted">Email</dt><dd>{me.user.emailMasked}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Role</dt><dd>{me.user.role}</dd></div>
        </dl>
      </Card>
      <Card>
        <h2 className="font-semibold mb-2">{t("profile.language")}</h2>
        <LanguageSelector />
      </Card>
      <Banner tone="info">Multi-factor authentication is recommended for any non-demo deployment.</Banner>
      <SignOutButton className="btn-outline" />
    </div>
  );
}
