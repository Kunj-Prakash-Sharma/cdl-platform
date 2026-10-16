"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, ClipboardCheck, Compass, MessagesSquare, PlayCircle, Sparkles, UserRound } from "lucide-react";
import { useCurrentUser } from "@/store/hooks";
import { AiFeatureGrid, AiWaitlistCard } from "@/components/ai/ai-feature-grid";
import { AiPrinciples, AiPrototypeNote, AiSignalsPanel } from "@/components/ai/ai-sections";
import { SectionHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

const PHASE_ONE = [
  { icon: Compass, label: "Free career discovery (guided dialogue)", href: "/discover" },
  { icon: ClipboardCheck, label: "Psychometric assessments & reports", href: "/dashboard/assessments" },
  { icon: PlayCircle, label: "Self-Paced courses & video library", href: "/dashboard/learning" },
  { icon: CalendarDays, label: "Live Cohort sessions & recordings", href: "/dashboard/sessions" },
  { icon: UserRound, label: "One-to-One Mentoring", href: "/dashboard/mentoring" },
  { icon: MessagesSquare, label: "Discussions & doubt clearing", href: "/dashboard/discussions" },
];

export default function MySelfAiPage() {
  const { user, isParent } = useCurrentUser();
  const firstName = user.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      {/* Hero */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-navy p-6 text-navy-foreground shadow-md sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-[0.12]" />
        <div className="pointer-events-none absolute -top-32 -right-24 -z-10 size-96 rounded-full bg-brand/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 -z-10 size-80 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-teal-200 ring-1 ring-white/15">
                <Sparkles className="size-3.5" /> Phase 2 preview
              </span>
              <span className="inline-flex items-center rounded-full border border-dashed border-amber-300/50 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-200">
                Planned · not live in this prototype
              </span>
            </div>
            <h1 className="font-heading text-3xl leading-tight font-semibold text-white sm:text-4xl">
              My Self AI — your personal
              <br className="hidden sm:block" /> career companion
            </h1>
            <p className="max-w-xl text-[15px] leading-relaxed text-white/75">
              {isParent
                ? `Hi ${firstName} — My Self AI is planned to help parents and students plan together: explaining assessment results in plain language, suggesting next steps and preparing you for mentor conversations.`
                : `Hi ${firstName} — My Self AI is planned to bring everything you do on CDL together: your discovery snapshot, assessments, courses, live sessions and mentor notes, turned into clear daily guidance and a career plan that keeps up with you.`}
            </p>
            <AiWaitlistCard defaultEmail={user.email ?? ""} tone="dark" />
          </div>
          <AiSignalsPanel className="lg:ml-auto lg:max-w-md" />
        </div>
      </section>

      {/* Phase 1 vs Phase 2 */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 items-center gap-1 rounded-full bg-success-soft px-2.5 text-xs font-semibold text-success ring-1 ring-success/20 ring-inset">
              <CheckCircle2 className="size-3.5" /> Live now
            </span>
            <h2 className="font-heading font-semibold">Phase 1 — what you can use today</h2>
          </div>
          <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
            {PHASE_ONE.map((p) => (
              <li key={p.label}>
                <Link href={p.href} className="group flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition hover:bg-muted">
                  <p.icon className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">{p.label}</span>
                  <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-dashed border-primary/30 bg-secondary/40 p-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 items-center gap-1 rounded-full bg-brand-soft px-2.5 text-xs font-semibold text-brand ring-1 ring-brand/25 ring-inset">
              <Sparkles className="size-3.5" /> Planned
            </span>
            <h2 className="font-heading font-semibold">Phase 2 — My Self AI</h2>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Seven AI features are planned on top of Phase 1. Open any card below to see an <span className="font-medium text-foreground">illustrative example</span> of
            how it could work for you.
          </p>
          <p className="mt-3 rounded-lg bg-background/70 px-3 py-2.5 text-xs text-muted-foreground ring-1 ring-border">
            Today&apos;s discovery conversation uses predefined dialogue, and recommendations use simple transparent rules. No AI model runs in this prototype and none
            of your data is sent anywhere.
          </p>
          <Button asChild variant="link" className="mt-2 h-auto px-0">
            <a href="#ai-features">
              Explore planned features <ArrowRight />
            </a>
          </Button>
        </div>
      </section>

      <section id="ai-features" className="scroll-mt-20 space-y-4">
        <SectionHeader title="Planned AI features" description="Tap “Notify me” on the ones you'd use — it helps us prioritise (stored only in this browser)." />
        <AiFeatureGrid extraTile={<AiPrototypeNote />} />
      </section>

      <section className="space-y-4">
        <SectionHeader title="Built responsibly" description="Principles My Self AI is being designed around." />
        <AiPrinciples />
      </section>
    </div>
  );
}
