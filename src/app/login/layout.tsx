import type { Metadata } from "next";
import Link from "next/link";
import { FocusHeader } from "@/components/layout/site-header";

export const metadata: Metadata = { title: "Log in" };

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FocusHeader
        right={
          <Link href="/discover" className="rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground">
            <span className="hidden sm:inline">Just exploring? </span><span className="text-brand">Try free discovery</span>
          </Link>
        }
      />
      <main className="relative isolate flex-1 bg-muted/40">
        <div className="absolute inset-0 -z-10 bg-dots [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
        {children}
      </main>
    </>
  );
}
