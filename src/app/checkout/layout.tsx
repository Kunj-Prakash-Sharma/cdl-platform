import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { FocusHeader } from "@/components/layout/site-header";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FocusHeader
        right={
          <>
            <span className="hidden items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
              <LockKeyhole className="size-3.5" /> Simulated checkout · no real payment
            </span>
            <Link href="/courses" className="rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground">
              Continue browsing
            </Link>
          </>
        }
      />
      <main className="flex-1 bg-muted/40">{children}</main>
    </>
  );
}
