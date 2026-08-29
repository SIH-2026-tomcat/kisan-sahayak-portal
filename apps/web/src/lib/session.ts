import "server-only";
import { apiFetch } from "./bff";

export type Me = {
  user: {
    id: string;
    email?: string;
    emailMasked: string;
    mobile?: string;
    mobileMasked: string;
    role: "farmer" | "operations_admin" | "super_admin" | "support_agent";
    language: "en" | "hi" | "te" | "bn";
    emailVerified: boolean;
    mobileVerified: boolean;
  };
  profile: { id: string; fullName: string; serviceAreaId: string | null; verificationStatus: string } | null;
  hasProfile: boolean;
};

export async function getMe(): Promise<Me | null> {
  try {
    return await apiFetch<Me>("auth/me", { authed: true });
  } catch {
    return null;
  }
}
