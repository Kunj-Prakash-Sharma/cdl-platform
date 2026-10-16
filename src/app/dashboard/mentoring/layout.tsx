import type { Metadata } from "next";

export const metadata: Metadata = { title: "One-to-One Mentoring" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
