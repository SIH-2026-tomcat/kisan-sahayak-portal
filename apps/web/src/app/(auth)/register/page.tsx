"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { api, ApiError } from "@/lib/api";
import { PublicShell } from "@/components/PublicShell";
import { Card, Field, Button, Stepper, Banner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useT } from "@/i18n/I18nProvider";

export default function RegisterPage() {
  const t = useT();
  const router = useRouter();
  const { push } = useToast();
  const [step, setStep] = useState(0);
  const steps = [t("register.step1Title"), t("register.step2Title"), t("register.step3Title"), t("register.step4Title")];

  // step 1
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  // step 2
  const [addr, setAddr] = useState({ addressLine1: "", addressLine2: "", village: "", district: "", state: "", pincode: "" });
  const [areaInfo, setAreaInfo] = useState<{ found: boolean; message: string } | null>(null);

  // step 3
  const [aadhaar, setAadhaar] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(false);

  // step 4
  const [consent, setConsent] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createAccount() {
    setError(null);
    setBusy(true);
    try {
      const { error: e } = await authClient.signUp.email({ email: email.trim(), password, name });
      if (e && !e.message?.toLowerCase().includes("exist")) throw new Error(e.message);
      if (e) {
        // account exists - try signing in
        const { error: se } = await authClient.signIn.email({ email: email.trim(), password });
        if (se) throw new Error("An account already exists with this email. Try Login instead.");
      }
      setAccountCreated(true);
      try {
        await authClient.emailOtp.sendVerificationOtp({ email: email.trim(), type: "email-verification" });
        setOtpSent(true);
      } catch {
        setOtpSent(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.somethingWrong"));
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    setBusy(true);
    setError(null);
    try {
      const { error: e } = await authClient.emailOtp.verifyEmail({ email: email.trim(), otp });
      if (e) throw new Error(t("auth.errOtpWrong"));
      setEmailVerified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.errOtpWrong"));
    } finally {
      setBusy(false);
    }
  }

  async function checkPincode() {
    if (!/^\d{6}$/.test(addr.pincode)) return;
    try {
      const d = await api.get<any>(`areas/by-pincode/${addr.pincode}`);
      setAreaInfo({ found: true, message: t("register.serviceAreaFound", { district: d.serviceArea.district }) });
      setAddr((a) => ({ ...a, district: d.serviceArea.district, state: d.serviceArea.state }));
    } catch (e) {
      const err = e as ApiError;
      setAreaInfo({ found: false, message: err.status === 404 ? t("register.serviceAreaMissing") : err.message });
      if ((err as any).body?.suggestion) {
        setAddr((a) => ({ ...a, district: (err as any).body.suggestion.district, state: (err as any).body.suggestion.state }));
      }
    }
  }

  async function uploadDoc() {
    if (!file || !/^\d{12}$/.test(aadhaar)) {
      setError(t("register.aadhaarNumber") + ": " + t("common.somethingWrong"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("document", file);
      fd.append("aadhaarNumber", aadhaar);
      await api.post("farmers/aadhaar-document", fd);
      setUploaded(true);
    } catch (e) {
      setError((e as ApiError).message || t("register.errUploadFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      await api.post("farmers/profile", {
        fullName: name || "Farmer",
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2 || undefined,
        village: addr.village || undefined,
        district: addr.district,
        state: addr.state,
        pincode: addr.pincode,
        mobile,
        aadhaarNumber: /^\d{12}$/.test(aadhaar) ? aadhaar : undefined,
        consent: true,
      });
      push({ title: "Account created", tone: "success" });
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicShell>
      <div className="container-page py-10 max-w-md">
        <h1 className="text-2xl font-bold">{t("register.title")}</h1>
        <p className="text-sm text-muted mt-1">{t("register.step", { n: step + 1 })}</p>

        <Card className="mt-4">
          <Stepper steps={steps} current={step} />
          {error && <div className="mb-3"><Banner tone="danger">{error}</Banner></div>}

          {step === 0 && (
            <div>
              <p className="text-sm text-muted mb-3">{t("register.step1Helper")}</p>
              <Field label={t("register.fullName")} htmlFor="nm">
                <input id="nm" className="input" value={name} onChange={(e) => setName(e.target.value)} disabled={accountCreated} />
              </Field>
              <Field label={t("auth.email")} help={t("register.emailHint")} htmlFor="em">
                <input id="em" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={accountCreated} required />
              </Field>
              {!accountCreated && (
                <Field label={t("auth.password")} htmlFor="pw">
                  <input id="pw" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
                </Field>
              )}
              <Field label={t("auth.mobile")} help={t("register.mobileHint")} htmlFor="mb">
                <input id="mb" className="input" type="tel" inputMode="numeric" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+91" required />
              </Field>

              {!accountCreated ? (
                <Button className="w-full" loading={busy} onClick={createAccount}
                  disabled={!email || password.length < 8 || !/^(\+91)?[6-9]\d{9}$/.test(mobile)}>
                  {t("register.verifyEmail")}
                </Button>
              ) : emailVerified ? (
                <Banner tone="success">{t("register.emailVerified")}</Banner>
              ) : (
                <div>
                  {otpSent ? (
                    <>
                      <Field label={t("auth.codeLabel")} htmlFor="otp">
                        <input id="otp" className="input tracking-widest" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} />
                      </Field>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => authClient.emailOtp.sendVerificationOtp({ email: email.trim(), type: "email-verification" })}>
                          {t("auth.resendCode")}
                        </Button>
                        <Button className="flex-1" loading={busy} onClick={verifyOtp}>{t("auth.verifyCode")}</Button>
                      </div>
                    </>
                  ) : (
                    <Banner tone="info">Check your email inbox and confirm your address. You can continue now and verify later.</Banner>
                  )}
                </div>
              )}

              {accountCreated && (
                <Button variant="text" className="w-full mt-2" onClick={() => setStep(1)}>{t("common.continue")} →</Button>
              )}
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="text-sm text-muted mb-3">{t("register.step2Helper")}</p>
              <Field label={t("register.addressLine1")} htmlFor="a1">
                <input id="a1" className="input" value={addr.addressLine1} onChange={(e) => setAddr({ ...addr, addressLine1: e.target.value })} required />
              </Field>
              <Field label={t("register.village")} htmlFor="vl">
                <input id="vl" className="input" value={addr.village} onChange={(e) => setAddr({ ...addr, village: e.target.value })} />
              </Field>
              <Field label={t("register.pincode")} htmlFor="pc">
                <input id="pc" className="input" inputMode="numeric" maxLength={6} value={addr.pincode}
                  onChange={(e) => setAddr({ ...addr, pincode: e.target.value })} onBlur={checkPincode} required />
              </Field>
              {areaInfo && <div className="mb-3"><Banner tone={areaInfo.found ? "success" : "warning"}>{areaInfo.message}</Banner></div>}
              <div className="grid grid-cols-2 gap-2">
                <Field label={t("register.district")} htmlFor="ds"><input id="ds" className="input" value={addr.district} onChange={(e) => setAddr({ ...addr, district: e.target.value })} required /></Field>
                <Field label={t("register.state")} htmlFor="st"><input id="st" className="input" value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} required /></Field>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)}>{t("common.back")}</Button>
                <Button className="flex-1" disabled={!addr.addressLine1 || !/^\d{6}$/.test(addr.pincode) || !addr.district} onClick={() => setStep(2)}>{t("common.next")}</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-sm text-muted mb-3">{t("register.step3Helper")}</p>
              <Field label={t("register.aadhaarNumber")} htmlFor="ad">
                <input id="ad" className="input tracking-widest" inputMode="numeric" maxLength={12} value={aadhaar} onChange={(e) => setAadhaar(e.target.value)} />
              </Field>
              <Field label="Aadhaar document" help={t("register.privacyNote")} htmlFor="fl">
                <input id="fl" className="input py-2" type="file" accept="image/*,application/pdf" capture="environment"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </Field>
              {uploaded ? (
                <Banner tone="success">{t("register.uploadDone")}</Banner>
              ) : (
                <Button className="w-full" loading={busy} disabled={!file || !/^\d{12}$/.test(aadhaar)} onClick={uploadDoc}>
                  {t("register.chooseFile")}
                </Button>
              )}
              <div className="flex gap-2 mt-3">
                <Button variant="outline" onClick={() => setStep(1)}>{t("common.back")}</Button>
                <Button className="flex-1" onClick={() => setStep(3)}>{t("common.next")}</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-semibold">{t("register.step4Title")}</h2>
              <dl className="mt-2 text-sm space-y-1">
                <div className="flex justify-between"><dt className="text-muted">{t("register.fullName")}</dt><dd>{name}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">{t("auth.email")}</dt><dd>{maskEmail(email)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">{t("auth.mobile")}</dt><dd>{maskMobile(mobile)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">{t("register.pincode")}</dt><dd>{addr.pincode} · {addr.district}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Aadhaar</dt><dd>{aadhaar ? `XXXX XXXX ${aadhaar.slice(-4)}` : "-"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Document</dt><dd>{uploaded ? "Uploaded" : "Not uploaded"}</dd></div>
              </dl>
              <label className="mt-3 flex items-start gap-2 text-sm">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
                <span>{t("register.consent")}</span>
              </label>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setStep(2)}>{t("common.back")}</Button>
                <Button className="flex-1" disabled={!consent} loading={busy} onClick={finish}>{t("register.createBtn")}</Button>
              </div>
            </div>
          )}
        </Card>

        <p className="mt-4 text-sm text-muted">
          {t("auth.haveAccount")} <Link href="/login" className="font-medium">{t("nav.login")}</Link>
        </p>
      </div>
    </PublicShell>
  );
}

function maskEmail(e: string) {
  const [l, d] = e.split("@");
  return d ? `${l[0]}***@${d}` : e;
}
function maskMobile(m: string) {
  const d = m.replace(/\D/g, "");
  return d.length >= 4 ? `${"*".repeat(d.length - 4)}${d.slice(-4)}` : m;
}
