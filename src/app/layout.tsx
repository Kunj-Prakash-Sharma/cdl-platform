import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { DemoProvider } from "@/components/layout/demo-provider";
import { DemoSwitcher } from "@/components/layout/demo-switcher";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Career Design Lab — Discover your potential",
    template: "%s · Career Design Lab",
  },
  description:
    "Career discovery, psychometric assessments, recorded courses, live cohorts and one-to-one mentoring for students, graduates, professionals and parents. Interactive prototype with demo data.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <DemoProvider>
          {children}
          <DemoSwitcher />
        </DemoProvider>
      </body>
    </html>
  );
}
