import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import { FocusHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Free Career Discovery",
  description: "A free, 3-minute career discovery conversation with personalised learning suggestions. No registration needed.",
};

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <FocusHeader
        right={
          <>
            <span className="hidden items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand sm:inline-flex">
              <span className="size-1.5 rounded-full bg-brand" /> Free career discovery
            </span>
            <Button asChild variant="ghost" size="sm" className="h-8">
              <Link href="/">
                <X /> Exit
              </Link>
            </Button>
          </>
        }
      />
      <main className="flex min-h-0 flex-1">{children}</main>
    </div>
  );
}
