import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Self AI (preview)" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
