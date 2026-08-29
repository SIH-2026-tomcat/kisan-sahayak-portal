export function maskEmail(email: string | null | undefined): string {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const head = local.slice(0, 1);
  return `${head}${"*".repeat(Math.max(3, local.length - 1))}@${domain}`;
}

export function maskMobile(mobile: string | null | undefined): string {
  if (!mobile) return "";
  const digits = mobile.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`;
}

export function maskAadhaar(last4: string | null | undefined): string {
  if (!last4) return "XXXX XXXX XXXX";
  return `XXXX XXXX ${last4}`;
}
