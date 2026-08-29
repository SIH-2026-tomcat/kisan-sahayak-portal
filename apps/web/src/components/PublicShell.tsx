"use client";
import { PublicHeader } from "./PublicHeader";
import { Footer } from "./Footer";
import { FlagRibbon } from "./national/FlagRibbon";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <FlagRibbon />
    </div>
  );
}
