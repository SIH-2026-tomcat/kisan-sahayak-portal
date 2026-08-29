"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Card, Spinner, StatusBadge, Button, Banner } from "@/components/ui";
import { LanguageSelector } from "@/components/LanguageSelector";
import { SignOutButton } from "@/components/SignOutButton";
import { useToast } from "@/components/Toast";
import { useT } from "@/i18n/I18nProvider";

export default function ProfilePage() {
  const t = useT();
  const { push } = useToast();
  const [me, setMe] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    api.get<any>("auth/me").then(setMe);
    api.get<any>("farmers/profile").then((d) => setProfile(d)).catch(() => {});
  }, []);

  if (!me) return <div className="py-16 flex justify-center"><Spinner className="h-8 w-8 text-green-700" /></div>;

  async function viewDoc() {
    try {
      const { url } = await api.get<any>("farmers/aadhaar-document/url");
      window.open(url, "_blank");
    } catch (e) {
      push({ title: t("common.somethingWrong"), body: (e as ApiError).message, tone: "error" });
    }
  }

  const v = profile?.profile?.verificationStatus ?? "pending";

  return (
    <div className="max-w-reading space-y-4">
      <h1 className="text-xl font-bold">{t("profile.title")}</h1>

      <Card>
        <p className="font-semibold">{profile?.profile?.fullName ?? "-"}</p>
        <dl className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-muted">{t("auth.email")}</dt><dd>{me.user.emailMasked}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">{t("auth.mobile")}</dt><dd>{me.user.mobileMasked || "-"}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Area</dt><dd>{profile?.serviceArea ? `${profile.serviceArea.district}, ${profile.serviceArea.state}` : "-"}</dd></div>
          <div className="flex justify-between items-center">
            <dt className="text-muted">{t("profile.verification")}</dt>
            <dd><StatusBadge tone={v === "verified" ? "ok" : v === "rejected" ? "danger" : "attention"}>{v}</StatusBadge></dd>
          </div>
        </dl>
        {profile?.profile?.aadhaarDocumentId && (
          <Button variant="outline" className="mt-3" onClick={viewDoc}>{t("profile.viewAadhaar")}</Button>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold mb-2">{t("profile.language")}</h2>
        <LanguageSelector />
        <Banner tone="info"><span className="text-xs">{t("profile.languageUnavailable")}</span></Banner>
      </Card>

      <Card>
        <h2 className="font-semibold mb-2">{t("profile.help")}</h2>
        <p className="text-sm text-muted">Help desk: 1800-11-4000 · kisansahayak@hawkvance.in</p>
        <a className="text-sm text-link" href="/help">FAQ →</a>
      </Card>

      <SignOutButton className="btn-outline w-full text-danger border-red-300" />
    </div>
  );
}
