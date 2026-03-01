import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lexi - LittleCrew",
  description: "Emma's Fashion & Story Companion",
  manifest: "/manifest-lexi.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lexi",
  },
};

export default function LexiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
