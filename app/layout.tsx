import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hiventra — AI Talent Intelligence Platform",
  description:
    "Intelligent Hiring, Powered by Carl AI. Automate resume screening, conduct adaptive AI interviews, and deliver deep candidate intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
