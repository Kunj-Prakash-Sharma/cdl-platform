import { ArrowRight, Bot, CheckCircle2, CircleAlert, Clock, Flag, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiFeatureId } from "./ai-features";

/** Banner shown on every example so it is never mistaken for a working AI feature. */
export function IllustrativeBanner() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-dashed border-warning/50 bg-warning-soft px-3 py-2 text-xs text-warning">
      <CircleAlert className="mt-px size-3.5 shrink-0" />
      <span>
        <span className="font-semibold">Illustrative preview — not live AI.</span> A static example written for this prototype; no AI model runs and nothing is
        generated from your data.
      </span>
    </div>
  );
}

function Bubble({ from, children }: { from: "ai" | "me"; children: React.ReactNode }) {
  return (
    <div className={cn("flex gap-2.5", from === "me" && "flex-row-reverse")}>
      {from === "ai" ? (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Bot className="size-4" />
        </span>
      ) : (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">RM</span>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          from === "ai" ? "rounded-tl-sm border bg-card" : "rounded-tr-sm bg-primary text-primary-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function SourceChip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{children}</span>;
}

function AssistantPreview() {
  return (
    <div className="space-y-3 rounded-xl bg-muted/40 p-3 sm:p-4">
      <Bubble from="me">I have GD Class 4 tonight and a mock interview on Monday. What should I focus on today?</Bubble>
      <Bubble from="ai">
        <p>Here&apos;s a 45-minute plan for today:</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>
            Rewatch <span className="font-medium">“Building on others&apos; points”</span> (10 min) — tonight&apos;s mock GD will test it.
          </li>
          <li>Write two bridge phrases you can use to enter a crowded discussion (10 min).</li>
          <li>Draft one STAR story from your college fest — it&apos;s still open on Dr. Meera&apos;s follow-up list (25 min).</li>
        </ol>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <SourceChip>GD Mastery · 3 of 7 lessons</SourceChip>
          <SourceChip>Mentor notes · 26 Sep</SourceChip>
          <SourceChip>Live class · today 7 PM</SourceChip>
        </div>
      </Bubble>
      <Bubble from="me">Can you remind me before class?</Bubble>
      <Bubble from="ai">Sure — I&apos;ll nudge you at 6:30 PM with the GD topic bank and your two bridge phrases.</Bubble>
    </div>
  );
}

const CAREERS = [
  { title: "Brand / Product Marketing", fit: 86, why: "Strong Enterprising + Social interests; enjoys persuasion and storytelling.", role: "Marketing Trainee, FMCG or D2C", skills: ["Consumer insight", "Campaign planning"] },
  { title: "Digital Marketing", fit: 78, why: "Creative communication with measurable results suits your profile.", role: "Digital Marketing Associate", skills: ["Performance analytics", "Content strategy"] },
  { title: "HR Business Partner", fit: 64, why: "People-facing work fits; less match with process-heavy tasks.", role: "HR Generalist Trainee", skills: ["Employee relations", "Data-driven HR"] },
];

function ExplorerPreview() {
  return (
    <div className="space-y-2.5">
      {CAREERS.map((c) => (
        <div key={c.title} className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-heading font-semibold">{c.title}</p>
            <span className="text-sm font-semibold text-brand tabular-nums">{c.fit}% match</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-brand" style={{ width: `${c.fit}%` }} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{c.why}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>
              First role: <span className="font-medium text-foreground">{c.role}</span>
            </span>
            <span>Build: {c.skills.join(" · ")}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const DIMENSIONS = [
  { label: "Enterprising", value: 82, note: "Enjoys leading, persuading and taking initiative" },
  { label: "Social", value: 74, note: "Energised by helping and working with people" },
  { label: "Artistic", value: 55, note: "Some interest in creative expression" },
  { label: "Conventional", value: 41, note: "Less drawn to routine, rule-based work" },
];

function PsychometricPreview() {
  return (
    <div className="space-y-4">
      <div className="space-y-2.5 rounded-xl border bg-card p-4">
        {DIMENSIONS.map((d) => (
          <div key={d.label}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{d.label}</span>
              <span className="text-muted-foreground tabular-nums">{d.value}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-[var(--chart-1)]" style={{ width: `${d.value}%` }} />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{d.note}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-secondary/60 p-4 text-sm leading-relaxed">
        <p className="flex items-center gap-1.5 font-semibold text-primary">
          <Sparkles className="size-4" /> In plain language
        </p>
        <p className="mt-1.5 text-foreground/85">
          You seem to do your best work when you&apos;re influencing people and ideas — pitching, presenting, organising. Roles that mix people and persuasion (marketing,
          sales, client-facing HR) are worth exploring first.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          What this doesn&apos;t mean: these are interest patterns, not ability scores or a verdict. Discuss them with a mentor before deciding.
        </p>
      </div>
    </div>
  );
}

const NEXT_STEPS = [
  { title: "Join tonight's live class: Mock GD round 1", why: "Practise entry and summary live with feedback.", time: "7:00 PM", tag: "Today" },
  { title: "Submit “Record a 2-minute GD opening”", why: "Due Sun, 18 Oct — 20 points.", time: "30 min", tag: "Due soon" },
  { title: "Write three STAR stories", why: "Your mock interview with Arjun is on Mon, 19 Oct.", time: "45 min", tag: "Prepare" },
  { title: "Finish Interview Preparation lesson 3", why: "Unlocks the interview readiness quiz.", time: "12 min", tag: "Continue" },
];

function NextStepPreview() {
  return (
    <ol className="space-y-2">
      {NEXT_STEPS.map((s, i) => (
        <li key={s.title} className="flex items-start gap-3 rounded-xl border bg-card p-3.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{s.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{s.why}</p>
          </div>
          <div className="shrink-0 text-right">
            <span className="block rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">{s.tag}</span>
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="size-3" /> {s.time}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}

const SCORES = [
  { label: "Structure", value: 7 },
  { label: "Relevance to role", value: 8 },
  { label: "Clarity", value: 6 },
  { label: "Confidence & delivery", value: 7 },
];

function MockInterviewPreview() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-card p-4">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Question 1 of 5 · HR round</p>
        <p className="mt-1 font-medium">“Tell me about yourself.”</p>
        <p className="mt-2 border-l-2 border-muted pl-3 text-sm text-muted-foreground italic">
          “I&apos;m a final-year BBA student at Northfield College… I led the marketing team for our college fest, where we grew footfall by 30%…”
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
        <div className="flex flex-col items-center justify-center rounded-xl bg-navy p-4 text-navy-foreground">
          <span className="font-heading text-4xl font-semibold">72</span>
          <span className="text-xs text-white/70">Overall / 100</span>
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-emerald-300">
            <TrendingUp className="size-3" /> +9 vs last attempt
          </span>
        </div>
        <div className="space-y-2 rounded-xl border bg-card p-4">
          {SCORES.map((s) => (
            <div key={s.label} className="flex items-center gap-3 text-sm">
              <span className="w-36 shrink-0 text-muted-foreground">{s.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-brand" style={{ width: `${s.value * 10}%` }} />
              </div>
              <span className="w-8 text-right font-medium tabular-nums">{s.value}/10</span>
            </div>
          ))}
          <p className="pt-1 text-xs text-muted-foreground">Pace: 162 words/min — slightly fast. Filler words: 4.</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <p className="flex items-start gap-2 rounded-lg bg-success-soft px-3 py-2 text-xs text-success">
          <CheckCircle2 className="mt-px size-3.5 shrink-0" /> Strong, quantified example from the college fest.
        </p>
        <p className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
          <Flag className="mt-px size-3.5 shrink-0" /> Close with why this marketing role — the answer ended abruptly at 2:40.
        </p>
      </div>
    </div>
  );
}

const WEEK = [
  { day: "Mon", items: ["Interview Prep · Lesson 3 (12 min)", "STAR story #1 (20 min)"] },
  { day: "Tue", items: ["GD live class · 7 PM (75 min)"] },
  { day: "Wed", items: ["Resume refresh for marketing roles (30 min)"] },
  { day: "Thu", items: ["GD live class · 7 PM (75 min)", "Topic bank: 2 topics (15 min)"] },
  { day: "Fri", items: ["Interview readiness quiz (10 min)"] },
  { day: "Sat", items: ["Weekend GD drill with peers (30 min)"] },
  { day: "Sun", items: ["Rest · weekly reflection (10 min)"] },
];

function StudyPlanPreview() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium">Week of 19 Oct · placement season focus</span>
        <span className="text-xs text-muted-foreground">≈ 6h 20m planned · fits around college hours</span>
      </div>
      <ol className="relative space-y-2 border-l-2 border-dashed border-primary/20 pl-5">
        {WEEK.map((d) => (
          <li key={d.day} className="relative">
            <span className="absolute top-2 -left-[27px] flex size-3 rounded-full border-2 border-background bg-primary" />
            <div className="rounded-lg border bg-card px-3 py-2">
              <p className="text-xs font-semibold text-primary">{d.day}</p>
              <ul className="mt-0.5 space-y-0.5">
                {d.items.map((i) => (
                  <li key={i} className="text-sm text-foreground/85">
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

const ROADMAP = [
  { when: "Oct – Dec 2026", title: "Placement season", items: ["Finish GD Mastery + Interview Prep", "3 mock interviews", "Apply to 15 marketing roles"] },
  { when: "Jan – Mar 2027", title: "Convert & choose", items: ["Final interviews", "Compare offers with a mentor", "Communication Skills refresher"] },
  { when: "Apr – Jun 2027", title: "First-job readiness", items: ["Professional Readiness course", "Build a 90-day plan", "Graduate and relocate if needed"] },
  { when: "Jul – Sep 2027", title: "Thrive in role", items: ["Monthly mentor check-ins", "Leadership Essentials (self-paced)", "Review plan at 12 months"] },
];

function CareerPlanPreview() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3.5 py-2.5 text-sm">
        <span className="font-medium">Today: Final-year BBA</span>
        <ArrowRight className="size-4 text-muted-foreground" />
        <span className="font-medium text-primary">Target: Brand Marketing Associate</span>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {ROADMAP.map((r, i) => (
          <div key={r.when} className="rounded-xl border bg-card p-3.5">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-brand-foreground">{i + 1}</span>
              <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{r.when}</span>
            </div>
            <p className="mt-1.5 font-heading font-semibold">{r.title}</p>
            <ul className="mt-1.5 space-y-1">
              {r.items.map((it) => (
                <li key={it} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="mt-px size-3.5 shrink-0 text-brand" /> {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Every plan would be reviewed with a human mentor before it&apos;s shared with you.</p>
    </div>
  );
}

const PREVIEWS: Record<AiFeatureId, () => React.ReactNode> = {
  assistant: AssistantPreview,
  explorer: ExplorerPreview,
  psychometric: PsychometricPreview,
  "next-step": NextStepPreview,
  "mock-interview": MockInterviewPreview,
  "study-plan": StudyPlanPreview,
  "career-plan": CareerPlanPreview,
};

/** Static example for a feature (example learner: Riya, final-year BBA). */
export function AiFeaturePreview({ id }: { id: AiFeatureId }) {
  const Preview = PREVIEWS[id];
  return <Preview />;
}
