import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { AiFeatureGrid, AiWaitlistCard } from "@/components/ai/ai-feature-grid";
import { AiHowItWorks, AiPrinciples, AiPrototypeNote, AiSignalsPanel } from "@/components/ai/ai-sections";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "My Self AI (coming soon)",
  description: "A preview of CDL's planned AI career companion — illustrative examples only; no AI runs in this prototype.",
};

export default function PublicAiPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-navy text-navy-foreground">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-[0.1]" />
        <div className="pointer-events-none absolute -top-40 right-[-10%] -z-10 size-[560px] rounded-full bg-brand/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 left-[-10%] -z-10 size-[420px] rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:px-6 md:py-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:py-24">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-teal-200 ring-1 ring-white/15">
                <Sparkles className="size-3.5" /> My Self AI · Phase 2
              </span>
              <span className="inline-flex items-center rounded-full border border-dashed border-amber-300/50 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-200">
                Coming soon · preview only
              </span>
            </div>
            <h1 className="font-heading text-4xl leading-[1.1] font-semibold text-white md:text-5xl">
              A career companion that <span className="text-teal-300">grows with you</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
              My Self AI is the next chapter of Career Design Lab: a personal assistant that understands your interests, strengths and progress — and helps you decide
              what to learn, practise and do next, alongside real mentors.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="h-11 bg-brand px-5 text-base text-brand-foreground hover:bg-brand/90">
                <Link href="/discover">
                  Start free career discovery <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 border-white/25 bg-white/5 px-5 text-base text-white hover:bg-white/15 hover:text-white">
                <a href="#features">See planned features</a>
              </Button>
            </div>
            <p className="text-xs text-white/55">Career discovery is free and live today. It uses guided, predefined dialogue — no AI model runs in this prototype.</p>
          </div>
          <AiSignalsPanel className="w-full lg:ml-auto lg:max-w-md" />
        </div>
      </section>

      {/* How it will work */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-wide text-brand uppercase">How it will work</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold">Personal guidance, built on what you already do</h2>
          <p className="mt-3 text-muted-foreground">
            Phase 1 gives you discovery, assessments, courses, live cohorts and mentoring. Phase 2 connects them into one companion.
          </p>
        </div>
        <AiHowItWorks className="mt-10" />
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-y bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-wide text-brand uppercase">Seven planned features</p>
              <h2 className="mt-2 font-heading text-3xl font-semibold">What My Self AI will help you do</h2>
              <p className="mt-2 text-muted-foreground">Open any card for an illustrative example. These are static previews, clearly not live AI.</p>
            </div>
          </div>
          <AiFeatureGrid extraTile={<AiPrototypeNote className="bg-background" />} />
        </div>
      </section>

      {/* Principles */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-wide text-brand uppercase">Built responsibly</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold">Helpful, transparent and human-led</h2>
        </div>
        <AiPrinciples />
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-6">
        <div className="relative isolate overflow-hidden rounded-3xl bg-navy px-6 py-10 text-navy-foreground md:px-12 md:py-12">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-[0.1]" />
          <div className="pointer-events-none absolute -top-24 -right-16 -z-10 size-72 rounded-full bg-brand/35 blur-3xl" />
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-heading text-2xl font-semibold text-white md:text-3xl">Start with what&apos;s live today</h2>
              <p className="mt-2 max-w-lg text-white/70">
                Take the free career discovery conversation now — your snapshot will be ready for My Self AI when it launches.
              </p>
              <Button asChild className="mt-5 h-11 bg-white px-5 text-base text-navy hover:bg-white/90">
                <Link href="/discover">
                  Start free career discovery <ArrowRight />
                </Link>
              </Button>
            </div>
            <div className="rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10">
              <p className="mb-3 text-sm text-white/75">Want early access to My Self AI? Join the waitlist — we&apos;ll invite you first (demo only, nothing is sent).</p>
              <AiWaitlistCard tone="dark" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
