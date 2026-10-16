"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardList, Clock, Compass, FileBarChart, Info, ListChecks, MessagesSquare, Sparkles, Users } from "lucide-react";
import { assessments, getAssessment, users } from "@/data";
import { STAGE_META } from "@/data/constants";
import { formatDate, formatNumber } from "@/lib/format";
import type { Assessment } from "@/lib/types";
import { useDemoStore } from "@/store/demo-store";
import { useCurrentUser, useHydrated } from "@/store/hooks";
import { DemoBadge, StatusPill } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_ICON: Record<Assessment["category"], React.ComponentType<{ className?: string }>> = {
  Interests: Compass,
  Personality: Users,
  Employability: ListChecks,
  Strengths: Sparkles,
};

export function AssessmentHub() {
  const hydrated = useHydrated();
  const drafts = useDemoStore((s) => s.assessmentDrafts);
  const allResults = useDemoStore((s) => s.assessmentResults);
  const { user, userId, isParent } = useCurrentUser();

  const childId = useMemo(
    () => (isParent ? users.find((u) => u.name.split(" ")[0] === user.childName && u.stage === user.childStage)?.id : undefined),
    [isParent, user.childName, user.childStage],
  );
  const results = useMemo(
    () => allResults.filter((r) => r.userId === userId || (childId && r.userId === childId)).sort((a, b) => b.completedOn.localeCompare(a.completedOn)),
    [allResults, userId, childId],
  );
  const active = assessments.filter((a) => a.status === "active");
  const upcoming = assessments.filter((a) => a.status === "draft");

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 md:px-6 md:py-12">
      <header className="space-y-3">
        <p className="text-xs font-semibold tracking-wide text-brand uppercase">Career assessments</p>
        <h1 className="font-heading text-3xl font-semibold md:text-4xl">Understand yourself a little better</h1>
        <p className="max-w-2xl text-muted-foreground md:text-[15px]">
          Short self-reflection tools that turn your answers into an illustrative report — interests, work style, strengths and suggested learning.
        </p>
        <div className="flex max-w-3xl items-start gap-2.5 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            <span className="font-semibold">Demo disclaimer:</span> these are illustrative self-reflection tools, not scientifically validated psychometric
            instruments. Use the results as conversation starters, not verdicts.
          </p>
        </div>
      </header>

      <section className="grid gap-5 md:grid-cols-2">
        {active.map((a) => {
          const draft = hydrated ? drafts[a.id] : undefined;
          const answered = draft ? Object.keys(draft.answers).length : 0;
          const progress = draft ? Math.round((answered / a.questions.length) * 100) : 0;
          const sections = Array.from(new Set(a.questions.map((q) => q.section)));
          const Icon = CATEGORY_ICON[a.category];
          const latest = results.find((r) => r.assessmentId === a.id && r.userId === userId);
          return (
            <article key={a.id} className="flex flex-col rounded-2xl border bg-card p-6 shadow-xs">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Icon className="size-6" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone="primary" dot={false}>
                      {a.category}
                    </StatusPill>
                    {draft && <StatusPill tone="warning">In progress</StatusPill>}
                    {latest && !draft && <StatusPill tone="success">Completed {formatDate(latest.completedOn, "d MMM")}</StatusPill>}
                  </div>
                  <h2 className="mt-2 font-heading text-xl font-semibold">{a.title}</h2>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{a.description}</p>
              <dl className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-muted/60 p-3 text-center text-xs">
                <div>
                  <dt className="text-muted-foreground">Time</dt>
                  <dd className="mt-0.5 flex items-center justify-center gap-1 font-semibold text-foreground">
                    <Clock className="size-3.5" /> ~{a.estimatedMin} min
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Questions</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{a.questions.length}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Taken by</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{formatNumber(a.completions)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">For:</span> {a.audience.map((s) => STAGE_META[s].plural).join(", ")} ·{" "}
                <span className="font-medium text-foreground">Sections:</span> {sections.join(", ")}
              </p>
              {draft && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">
                      {answered} of {a.questions.length} answered
                    </span>
                    <span className="text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="mt-1.5 h-1.5 [&>[data-slot=progress-indicator]]:bg-brand" />
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-2 pt-1 md:mt-auto md:pt-5">
                <Button asChild className="h-10 bg-brand px-4 text-brand-foreground hover:bg-brand/90">
                  <Link href={`/assessment/${a.id}`}>
                    {draft ? "Resume" : latest ? "Retake" : "Start"} assessment <ArrowRight />
                  </Link>
                </Button>
                {latest && (
                  <Button asChild variant="outline" className="h-10">
                    <Link href={`/assessment/report/${latest.id}`}>
                      <FileBarChart /> Latest report
                    </Link>
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Coming soon</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {upcoming.map((a) => (
              <Link
                key={a.id}
                href={`/assessment/${a.id}`}
                className="flex items-center gap-4 rounded-xl border border-dashed bg-card/60 p-4 transition hover:bg-card"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <ClipboardList className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{a.title}</p>
                  <p className="truncate text-sm text-muted-foreground">Under review — not yet available</p>
                </div>
                <StatusPill tone="neutral">Draft</StatusPill>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold">Your previous results</h2>
            <p className="text-sm text-muted-foreground">
              Showing results for {user.name}
              {isParent && user.childName ? ` and ${user.childName}` : ""}.
            </p>
          </div>
          <DemoBadge>Illustrative demo results</DemoBadge>
        </div>
        {!hydrated ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : results.length === 0 ? (
          <EmptyState
            icon={FileBarChart}
            title="No results yet"
            description="Complete an assessment and your report will appear here."
            action={
              <Button asChild variant="outline">
                <Link href="/assessment/career-compass">Start the Career Compass</Link>
              </Button>
            }
          />
        ) : (
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
            {results.map((r) => {
              const a = getAssessment(r.assessmentId);
              const who = users.find((u) => u.id === r.userId);
              return (
                <li key={r.id}>
                  <Link href={`/assessment/report/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 transition hover:bg-muted/50 sm:flex-nowrap">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                      <FileBarChart className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{a?.title ?? "Assessment"}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {r.userId === userId ? "You" : who?.name} · {formatDate(r.completedOn)}
                        {r.topInterests.length ? ` · Top interest: ${r.topInterests[0]}` : r.strengths[0] ? ` · Strength: ${r.strengths[0]}` : ""}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                      View report <ArrowRight className="size-4" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col items-start gap-4 rounded-2xl bg-navy p-6 text-navy-foreground md:flex-row md:items-center md:p-8">
        <span className="flex size-12 items-center justify-center rounded-xl bg-white/10">
          <MessagesSquare className="size-6 text-brand-soft" />
        </span>
        <div className="flex-1">
          <h2 className="font-heading text-lg font-semibold">Not sure where to start?</h2>
          <p className="text-sm text-white/70">Have a 3-minute conversation with our career guide and get a free snapshot first.</p>
        </div>
        <Button asChild className="h-10 bg-brand px-4 text-brand-foreground hover:bg-brand/90">
          <Link href="/discover">
            Start free discovery <ArrowRight />
          </Link>
        </Button>
      </section>
    </div>
  );
}
