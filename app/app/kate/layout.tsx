import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kate - LittleCrew",
  description: "Erik's Fishing & Mechanics Companion",
  manifest: "/manifest-kate.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kate",
  },
};

export default function KateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
