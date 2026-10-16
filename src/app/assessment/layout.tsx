import type { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { FocusHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: { default: "Career assessments", template: "%s · Career Design Lab" },
  description: "Illustrative self-reflection assessments on interests, work style and employability readiness.",
};

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <FocusHeader
        right={
          <>
            <Button asChild variant="ghost" size="sm" className="h-8">
              <Link href="/assessment">
                <LayoutGrid /> <span className="max-sm:sr-only">All assessments</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-8">
              <Link href="/dashboard">My dashboard</Link>
            </Button>
          </>
        }
      />
      <main className="flex-1 bg-muted/30">{children}</main>
    </div>
  );
}
