import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";

const farmerGuard = auth.middleware({ loginUrl: "/login" });
const adminGuard = auth.middleware({ loginUrl: "/admin-login" });

export default function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return adminGuard(request);
  }
  return farmerGuard(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/book/:path*",
    "/my-bookings/:path*",
    "/profile/:path*",
    "/announcements/:path*",
    "/procurement/:path*",
    "/admin/:path*",
  ],
};
