"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock, Compass, FileBarChart, Hourglass, Layers, Lock, PartyPopper, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { DEMO_TODAY, STAGE_META } from "@/data/constants";
import { scoreAssessment } from "@/lib/assessment";
import type { Assessment, AssessmentResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useCurrentUser, useHydrated } from "@/store/hooks";
import { DemoBadge, StatusPill } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const GROUP_LABEL = { interest: "Career interests", trait: "Personality & work style", skill: "Skills & readiness" } as const;

export function AssessmentRunner({ assessment }: { assessment: Assessment }) {
  const hydrated = useHydrated();
  if (assessment.status !== "active") return <NotAvailable assessment={assessment} />;
  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }
  return <Runner assessment={assessment} />;
}

function NotAvailable({ assessment }: { assessment: Assessment }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Hourglass className="size-7" />
      </span>
      <StatusPill tone="neutral" className="mt-5">
        Draft · under review
      </StatusPill>
      <h1 className="mt-3 font-heading text-2xl font-semibold">{assessment.title}</h1>
      <p className="mt-2 text-muted-foreground">This assessment is not yet available. It&apos;s being reviewed by our content team and will open soon.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button asChild className="h-10 px-4">
          <Link href="/assessment">Browse available assessments</Link>
        </Button>
        <Button asChild variant="outline" className="h-10 px-4">
          <Link href="/discover">Try free career discovery</Link>
        </Button>
      </div>
    </div>
  );
}

function Runner({ assessment }: { assessment: Assessment }) {
  const router = useRouter();
  const { user, userId } = useCurrentUser();
  const draft = useDemoStore((s) => s.assessmentDrafts[assessment.id]);
  const saveDraft = useDemoStore((s) => s.saveAssessmentDraft);
  const clearDraft = useDemoStore((s) => s.clearAssessmentDraft);
  const addResult = useDemoStore((s) => s.addAssessmentResult);

  const [phase, setPhase] = useState<"intro" | "run">("intro");
  const [done, setDone] = useState<AssessmentResult | null>(null);

  const total = assessment.questions.length;
  const answers = useMemo(() => draft?.answers ?? {}, [draft]);
  const index = Math.min(draft?.index ?? 0, total);
  const answeredCount = assessment.questions.filter((q) => answers[q.id]).length;
  const sections = useMemo(() => {
    const map = new Map<string, number>();
    assessment.questions.forEach((q) => map.set(q.section, (map.get(q.section) ?? 0) + 1));
    return [...map.entries()];
  }, [assessment]);
  const groups = Array.from(new Set(Object.values(assessment.dimensions).map((d) => d.group)));

  const go = (i: number) => saveDraft(assessment.id, { answers, index: i });
  const start = (fresh: boolean) => {
    if (fresh) saveDraft(assessment.id, { answers: {}, index: 0 });
    else if (!draft) saveDraft(assessment.id, { answers: {}, index: 0 });
    setPhase("run");
  };
  const choose = (qid: string, oid: string) => saveDraft(assessment.id, { answers: { ...answers, [qid]: oid }, index });
  const saveAndExit = () => {
    toast.success("Progress saved", { description: `${answeredCount} of ${total} answered — resume any time.` });
    router.push("/assessment");
  };
  const submit = () => {
    if (answeredCount < total) return;
    const scored = scoreAssessment(assessment, answers, user.stage === "parent" ? undefined : user.stage);
    const result = addResult({ assessmentId: assessment.id, userId, completedOn: DEMO_TODAY, ...scored });
    clearDraft(assessment.id);
    setDone(result);
    toast.success("Assessment submitted", { description: "Your illustrative report is ready." });
  };

  if (done) return <Completion assessment={assessment} result={done} />;

  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
        <Link href="/assessment" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> All assessments
        </Link>
        <div className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-xs">
          <div className="bg-navy px-6 py-8 text-navy-foreground md:px-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium ring-1 ring-white/15">{assessment.category}</span>
              <DemoBadge>Illustrative self-reflection</DemoBadge>
            </div>
            <h1 className="mt-3 font-heading text-2xl font-semibold md:text-3xl">{assessment.title}</h1>
            <p className="mt-2 max-w-2xl text-white/75">{assessment.description}</p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" /> About {assessment.estimatedMin} minutes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Layers className="size-4" /> {total} questions · {sections.length} sections
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Compass className="size-4" /> For {assessment.audience.map((s) => STAGE_META[s].plural.toLowerCase()).join(", ")}
              </span>
            </div>
          </div>
          <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
            <div>
              <h2 className="font-heading font-semibold">What it explores</h2>
              <ul className="mt-3 space-y-2">
                {groups.map((g) => (
                  <li key={g} className="text-sm">
                    <p className="font-medium">{GROUP_LABEL[g]}</p>
                    <p className="text-muted-foreground">
                      {Object.values(assessment.dimensions)
                        .filter((d) => d.group === g)
                        .map((d) => d.label)
                        .join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-5">
              <div>
                <h2 className="font-heading font-semibold">Sections</h2>
                <ol className="mt-3 space-y-2">
                  {sections.map(([name, count], i) => (
                    <li key={name} className="flex items-center gap-3 text-sm">
                      <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">{i + 1}</span>
                      <span className="flex-1 font-medium">{name}</span>
                      <span className="text-muted-foreground">{count} questions</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl bg-muted/70 p-3 text-xs text-muted-foreground">
                <Lock className="mt-0.5 size-3.5 shrink-0" />
                <p>
                  <span className="font-medium text-foreground">Privacy:</span> answers are saved automatically in this browser so you can resume later. There are no
                  right or wrong answers — choose what feels most like you. Not a validated psychometric test.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t bg-muted/30 px-6 py-4 md:px-8">
            {draft ? (
              <>
                <div className="mr-auto min-w-48 flex-1">
                  <p className="text-sm font-medium">
                    In progress · {answeredCount} of {total} answered
                  </p>
                  <Progress value={(answeredCount / total) * 100} className="mt-1.5 h-1.5 max-w-xs [&>[data-slot=progress-indicator]]:bg-brand" />
                </div>
                <Button variant="outline" className="h-10" onClick={() => start(true)}>
                  <RotateCcw /> Start over
                </Button>
                <Button className="h-10 bg-brand px-5 text-brand-foreground hover:bg-brand/90" onClick={() => start(false)}>
                  Resume <ArrowRight />
                </Button>
              </>
            ) : (
              <>
                <p className="mr-auto text-sm text-muted-foreground">Taking it as {user.name} (demo account).</p>
                <Button className="h-10 bg-brand px-5 text-brand-foreground hover:bg-brand/90" onClick={() => start(false)}>
                  Start assessment <ArrowRight />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Review step
  if (index >= total) {
    const missing = assessment.questions.map((q, i) => ({ q, i })).filter(({ q }) => !answers[q.id]);
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <div className="rounded-2xl border bg-card p-6 shadow-xs md:p-8">
          <p className="text-xs font-semibold tracking-wide text-brand uppercase">Review</p>
          <h1 className="mt-1 font-heading text-2xl font-semibold">Ready to submit?</h1>
          <p className="mt-1 text-muted-foreground">
            You&apos;ve answered <span className="font-semibold text-foreground">{answeredCount}</span> of {total} questions.
          </p>
          <Progress value={(answeredCount / total) * 100} className="mt-4 h-2 [&>[data-slot=progress-indicator]]:bg-brand" />
          {missing.length > 0 ? (
            <div className="mt-5 rounded-xl border border-warning/30 bg-warning-soft p-4">
              <p className="text-sm font-semibold text-warning">
                {missing.length} unanswered question{missing.length > 1 ? "s" : ""}
              </p>
              <ul className="mt-2 space-y-1.5">
                {missing.map(({ q, i }) => (
                  <li key={q.id} className="flex items-center gap-3 text-sm">
                    <span className="flex-1 truncate">
                      Q{i + 1}. {q.prompt}
                    </span>
                    <Button size="sm" variant="outline" className="bg-background" onClick={() => go(i)}>
                      Answer
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-5 flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success">
              <CheckCircle2 className="size-4" /> All questions answered.
            </p>
          )}
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {assessment.questions.map((q, i) => {
              const opt = q.options.find((o) => o.id === answers[q.id]);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => go(i)}
                  className="flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-xs transition hover:bg-muted/60"
                >
                  <span className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full", opt ? "bg-brand text-brand-foreground" : "ring-1 ring-warning")}>
                    {opt && <Check className="size-2.5" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium text-foreground">Q{i + 1}</span>
                    <span className="line-clamp-1 text-muted-foreground">{opt?.label ?? "Not answered"}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex flex-wrap justify-between gap-2 border-t pt-5">
            <Button variant="outline" className="h-10" onClick={() => go(total - 1)}>
              <ArrowLeft /> Previous
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" className="h-10" onClick={saveAndExit}>
                <Save /> Save & exit
              </Button>
              <Button className="h-10 bg-brand px-5 text-brand-foreground hover:bg-brand/90" disabled={missing.length > 0} onClick={submit}>
                Submit <ArrowRight />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const q = assessment.questions[index];
  const selected = answers[q.id];
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">
          Question {index + 1} <span className="text-muted-foreground">of {total}</span>
        </span>
        <Button variant="ghost" size="sm" onClick={saveAndExit}>
          <Save /> Save & exit
        </Button>
      </div>
      <Progress value={((index + (selected ? 1 : 0)) / total) * 100} className="mt-2 h-2 [&>[data-slot=progress-indicator]]:bg-brand" aria-label="Assessment progress" />
      <div key={q.id} className="mt-6 animate-in rounded-2xl border bg-card p-5 shadow-xs duration-300 fade-in-0 slide-in-from-right-2 md:p-8">
        <p className="text-xs font-semibold tracking-wide text-brand uppercase">{q.section}</p>
        <h1 className="mt-2 font-heading text-xl leading-snug font-semibold md:text-2xl">{q.prompt}</h1>
        <div className="mt-6 grid gap-2.5" role="radiogroup" aria-label={q.prompt}>
          {q.options.map((o, i) => {
            const on = selected === o.id;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => choose(q.id, o.id)}
                className={cn(
                  "flex items-center gap-4 rounded-xl border bg-background px-4 py-4 text-left text-[15px] transition hover:border-primary/40 hover:bg-secondary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  on && "border-primary bg-secondary ring-2 ring-primary/15",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold text-muted-foreground",
                    on && "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  {on ? <Check className="size-4" /> : String.fromCharCode(65 + i)}
                </span>
                <span className={cn(on && "font-medium")}>{o.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <Button variant="outline" className="h-10" disabled={index === 0} onClick={() => go(index - 1)}>
          <ArrowLeft /> Previous
        </Button>
        <span className="hidden text-xs text-muted-foreground sm:block">Answers save automatically</span>
        <Button className="h-10 px-5" disabled={!selected} onClick={() => go(index + 1)}>
          {index === total - 1 ? "Review answers" : "Next"} <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

function Completion({ assessment, result }: { assessment: Assessment; result: AssessmentResult }) {
  const highlights = result.topInterests.length ? result.topInterests : result.strengths;
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success-soft text-success">
        <PartyPopper className="size-8" />
      </span>
      <h1 className="mt-5 font-heading text-2xl font-semibold md:text-3xl">Assessment complete</h1>
      <p className="mt-2 text-muted-foreground">
        Thanks for reflecting honestly. Here&apos;s a first look at your {assessment.title} results.
      </p>
      <div className="mt-6 rounded-2xl border bg-card p-6 text-left shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading font-semibold">{result.topInterests.length ? "Your top 3 interests" : "Your strongest areas"}</h2>
          <DemoBadge>Illustrative</DemoBadge>
        </div>
        <ol className="mt-4 space-y-3">
          {highlights.slice(0, 3).map((label, i) => {
            const key = Object.entries(assessment.dimensions).find(([, d]) => d.label === label)?.[0];
            const score = key ? result.scores[key] : undefined;
            return (
              <li key={label} className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{label}</p>
                  {score !== undefined && <Progress value={score} className="mt-1 h-1.5 [&>[data-slot=progress-indicator]]:bg-brand" />}
                </div>
              </li>
            );
          })}
        </ol>
        {result.developmentAreas.length > 0 && (
          <p className="mt-5 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Growth opportunities:</span> {result.developmentAreas.join(", ")}.
          </p>
        )}
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button asChild className="h-11 bg-brand px-5 text-brand-foreground hover:bg-brand/90">
          <Link href={`/assessment/report/${result.id}`}>
            <FileBarChart /> View full report
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-11 px-5">
          <Link href="/assessment">Back to assessments</Link>
        </Button>
      </div>
    </div>
  );
}
