import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LittleCrew - AI Creative Companions",
  description: "AI companions for creative kids",
  manifest: "/manifest.json",
  themeColor: "#1e293b",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-slate-900 text-slate-100">
        {children}
      </body>
    </html>
  );
}
