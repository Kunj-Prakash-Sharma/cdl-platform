"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, FlaskConical, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ROLE_META } from "@/data/constants";
import type { Role } from "@/lib/types";
import { useDemoStore } from "@/store/demo-store";
import { Logo } from "@/components/brand/logo";
import { ROLE_ICONS, ROLE_ORDER } from "@/components/layout/demo-switcher";
import { Button } from "@/components/ui/button";

const JOURNEYS: { title: string; steps: string[]; start: string; role: Role }[] = [
  {
    title: "Visitor → recommendation → enrolment",
    role: "visitor",
    start: "/",
    steps: ["Start Free Career Discovery from the landing page", "Answer the conversational questions", "Review your career snapshot and recommendations", "Open a recommended program and check out (simulated)"],
  },
  {
    title: "Learner day-to-day",
    role: "learner",
    start: "/dashboard",
    steps: ["Continue a lesson in the video player", "Book a GD doubt-clearing session", "Ask a doubt in programme discussions", "View certificates and assessment history"],
  },
  {
    title: "Mentor content & questions",
    role: "mentor",
    start: "/mentor",
    steps: ["Check today's schedule and bookings", "Upload a lesson to the central content library", "Answer a student's doubt and mark it resolved"],
  },
  {
    title: "Admin conversion insights",
    role: "admin",
    start: "/admin/conversations",
    steps: ["See where visitors drop off in the conversation", "Open an anonymous journey transcript", "Approve the mentor's upload in the video library"],
  },
];

export default function DemoPage() {
  const router = useRouter();
  const role = useDemoStore((s) => s.role);
  const setRole = useDemoStore((s) => s.setRole);
  const resetDemo = useDemoStore((s) => s.resetDemo);

  const enter = (r: Role, href = ROLE_META[r].home) => {
    setRole(r);
    router.push(href);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-navy text-navy-foreground">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.07]" />
      <div className="pointer-events-none absolute -top-40 right-[-10%] size-[520px] rounded-full bg-brand/25 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Logo inverted />
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/15">
            <FlaskConical className="size-3.5" /> Interactive prototype · no backend · demo data only
          </span>
        </div>

        <div className="mt-12 max-w-2xl">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-white md:text-5xl">Choose how you&apos;d like to explore CDL</h1>
          <p className="mt-4 text-base text-white/70 md:text-lg">
            One product, four connected experiences. Pick a role to sign in instantly — no password or OTP needed. You can switch any time
            from the <span className="font-semibold text-white">Demo</span> button in the corner.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ROLE_ORDER.map((r) => {
            const Icon = ROLE_ICONS[r];
            const current = role === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => enter(r)}
                className="group flex flex-col rounded-2xl bg-white/[0.06] p-5 text-left ring-1 ring-white/10 transition hover:bg-white/[0.1] hover:ring-white/25 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-white">
                    <Icon className="size-5" />
                  </span>
                  {current && <span className="rounded-full bg-brand/30 px-2 py-0.5 text-[10px] font-semibold text-white">Current</span>}
                </div>
                <p className="mt-4 font-heading font-semibold text-white">{ROLE_META[r].label}</p>
                <p className="mt-1 text-sm text-white/60">{ROLE_META[r].description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-soft">
                  Enter <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </span>
              </button>
            );
          })}
          <div className="flex flex-col justify-between rounded-2xl border border-dashed border-white/20 p-5">
            <div>
              <p className="font-heading font-semibold text-white">Start fresh</p>
              <p className="mt-1 text-sm text-white/60">Clears enrolments, bookings and other changes made during a demo.</p>
            </div>
            <Button
              variant="outline"
              className="mt-4 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              onClick={() => {
                resetDemo();
                toast.success("Demo data reset");
              }}
            >
              <RotateCcw /> Reset demo data
            </Button>
          </div>
        </div>

        <h2 className="mt-16 font-heading text-xl font-semibold text-white">Suggested walkthroughs</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {JOURNEYS.map((j, i) => (
            <div key={j.title} className="rounded-2xl bg-white p-5 text-foreground shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-brand uppercase">Journey {i + 1}</p>
                  <p className="mt-1 font-heading text-lg font-semibold">{j.title}</p>
                </div>
                <Button size="sm" onClick={() => enter(j.role, j.start)}>
                  Start <ArrowRight />
                </Button>
              </div>
              <ol className="mt-4 space-y-2">
                {j.steps.map((s, n) => (
                  <li key={s} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-primary">{n + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-white/50">
          Prefer to browse? <Link href="/" className="font-medium text-white underline-offset-4 hover:underline">Go to the public website</Link>
        </p>
      </div>
    </div>
  );
}
