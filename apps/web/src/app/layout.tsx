import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kisan Sahayak Portal",
  description: "Know your centre. Book your slot. Come when it is your turn.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
