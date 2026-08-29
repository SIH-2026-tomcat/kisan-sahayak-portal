import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL || process.env.NEON_AUTH_URL!;
const secret = process.env.NEON_AUTH_COOKIE_SECRET!;

export const auth = createNeonAuth({
  baseUrl,
  cookies: { secret },
});

export type SessionUser = {
  id: string;
  email?: string;
  name?: string;
  emailVerified?: boolean;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const { data } = await auth.getSession();
    return (data?.user as SessionUser) ?? null;
  } catch {
    return null;
  }
}
