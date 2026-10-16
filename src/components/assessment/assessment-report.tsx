"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addMonths, parseISO, format } from "date-fns";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  CalendarClock,
  CalendarDays,
  FileSearch,
  History,
  Lightbulb,
  Minus,
  Printer,
  RotateCcw,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { getAssessment, getCourse, getMentor, getUser } from "@/data";
import { STAGE_META } from "@/data/constants";
import { CAREER_AREAS, dimensionKey, groupsPresent, relatedResults, reportSummary, scoreBand, tipForLabel, type ScoredDimension } from "@/lib/assessment";
import { formatDate } from "@/lib/format";
import type { Assessment, AssessmentResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useCurrentUser, useHydrated } from "@/store/hooks";
import { LogoMark } from "@/components/brand/logo";
import { DemoBadge, StatusPill } from "@/components/shared/badges";
import { CourseCard } from "@/components/shared/cards";
import { MentorBookingDialog } from "@/components/shared/mentor-booking-dialog";
import { EmptyState } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

/** Lets recharts' fixed-size SVG scale down to the printed page width. */
const PRINT_CHART =
  "print:[&_.recharts-wrapper]:!h-auto print:[&_.recharts-wrapper]:!w-full print:[&_.recharts-surface]:h-auto print:[&_.recharts-surface]:w-full";

export function AssessmentReport({ resultId }: { resultId: string }) {
  const hydrated = useHydrated();
  const results = useDemoStore((s) => s.assessmentResults);
  const result = results.find((r) => r.id === resultId);
  const assessment = result ? getAssessment(result.assessmentId) : undefined;

  if (!result || !assessment) {
    if (!hydrated) return <ReportSkeleton />;
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <EmptyState
          icon={FileSearch}
          title="Report not found"
          description="This report doesn't exist in this demo session — it may have been cleared when the demo was reset."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href="/assessment">View my assessments</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/assessment/career-compass">Take the Career Compass</Link>
              </Button>
            </div>
          }
        />
      </div>
    );
  }
  return <Report result={result} assessment={assessment} all={results} />;
}

function ReportSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-10">
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, description, children, className, action }: { title: string; icon: React.ComponentType<{ className?: string }>; description?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5 shadow-xs break-inside-avoid md:p-6 print:shadow-none", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-base font-semibold md:text-lg">
            <Icon className="size-4.5 text-brand" /> {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Meter({ d, delta }: { d: ScoredDimension; delta?: number }) {
  const band = scoreBand(d.score);
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{d.label}</span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {delta !== undefined && <Delta value={delta} />}
          <span className="font-semibold text-foreground tabular-nums">{d.score}</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted print:border">
        <div
          className={cn("h-full rounded-full", band.tone === "brand" ? "bg-brand" : band.tone === "primary" ? "bg-chart-1" : "bg-chart-4")}
          style={{ width: `${d.score}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{band.label}</p>
    </li>
  );
}

function Delta({ value }: { value: number }) {
  if (value === 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-muted-foreground">
        <Minus className="size-3" /> 0
      </span>
    );
  const up = value > 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-semibold", up ? "text-success" : "text-destructive")}>
      {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
      {up ? "+" : ""}
      {value}
    </span>
  );
}

const interestConfig = { score: { label: "Score", color: "var(--chart-1)" } } satisfies ChartConfig;
const compareConfig = {
  previous: { label: "Previous", color: "var(--chart-3)" },
  current: { label: "This report", color: "var(--chart-1)" },
} satisfies ChartConfig;

function Report({ result, assessment, all }: { result: AssessmentResult; assessment: Assessment; all: AssessmentResult[] }) {
  const { user: currentUser, userId } = useCurrentUser();
  const [debriefOpen, setDebriefOpen] = useState(false);
  const learner = result.userId === userId ? currentUser : getUser(result.userId);
  const name = learner?.name ?? "Learner";
  const firstName = name.split(" ")[0];
  const meera = getMentor("m-meera")!;

  const { interests, traits, skills } = useMemo(() => groupsPresent(assessment, result.scores), [assessment, result.scores]);
  const { previous, newer } = useMemo(() => relatedResults(all, result), [all, result]);
  const summary = reportSummary(assessment, result, firstName);
  const courses = result.recommendedCourseIds.map(getCourse).filter((c) => !!c);
  const retakeOn = format(addMonths(parseISO(result.completedOn), 6), "d MMM yyyy");
  const delta = (key: string) => (previous && typeof previous.scores[key] === "number" ? result.scores[key] - previous.scores[key] : undefined);

  const interestData = [...interests].sort((a, b) => b.score - a.score).map((d) => ({ label: d.label, score: d.score }));
  const compareData = previous
    ? [...interests, ...traits, ...skills]
        .filter((d) => typeof previous.scores[d.key] === "number")
        .map((d) => ({ label: d.label, previous: previous.scores[d.key], current: d.score, change: d.score - previous.scores[d.key] }))
    : [];
  const biggestGains = [...compareData].sort((a, b) => b.change - a.change).slice(0, 3);
  const careerAreas = result.topInterests.map((label) => ({ label, key: dimensionKey(assessment, label) })).filter((x) => x.key && CAREER_AREAS[x.key!]);

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 md:px-6 md:py-10 print:max-w-none print:space-y-4 print:p-0">
      {/* Print-only header */}
      <div className="print-only">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-9" />
            <div>
              <p className="font-heading text-base font-bold text-primary">Career Design Lab</p>
              <p className="text-[11px] text-muted-foreground">Career Assessment Report · {assessment.title}</p>
            </div>
          </div>
          <p className="text-right text-[11px] text-muted-foreground">
            {name} · {formatDate(result.completedOn)}
            <br />
            Report ID {result.id}
          </p>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Illustrative demo report generated from self-reported answers. Not a scientifically validated psychometric instrument.
        </p>
      </div>

      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href="/assessment" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> All assessments
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-9" onClick={() => window.print()}>
            <Printer /> Print / Save as PDF
          </Button>
          <Button className="h-9 bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => setDebriefOpen(true)}>
            <CalendarClock /> Book a debrief
          </Button>
        </div>
      </div>

      {/* Header */}
      <header className="overflow-hidden rounded-2xl border bg-navy text-navy-foreground shadow-xs print:border-0 print:bg-transparent print:text-foreground">
        <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:p-8">
          <Portrait avatar={learner?.avatar} name={name} className="size-16 ring-2 ring-white/20 print:hidden" rounded="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ring-1 ring-white/15 print:hidden">
                Assessment report
              </span>
              <DemoBadge className="print:hidden">Illustrative demo result</DemoBadge>
            </div>
            <h1 className="mt-2 font-heading text-2xl font-semibold md:text-3xl">{name}</h1>
            <p className="mt-1 text-sm text-white/70 print:text-muted-foreground">
              {assessment.title} · Completed {formatDate(result.completedOn)}
              {learner ? ` · ${learner.stage === "parent" ? "Parent" : STAGE_META[learner.stage].label}${learner.education ? `, ${learner.education}` : ""}` : ""}
            </p>
          </div>
          {result.topInterests[0] && (
            <div className="rounded-xl bg-white/8 px-4 py-3 ring-1 ring-white/15 print:ring-border">
              <p className="text-[11px] tracking-wide text-white/60 uppercase print:text-muted-foreground">Top interest</p>
              <p className="font-heading font-semibold">{result.topInterests[0]}</p>
            </div>
          )}
        </div>
      </header>

      {newer && (
        <div className="no-print flex flex-wrap items-center justify-between gap-2 rounded-xl border border-info/25 bg-info-soft px-4 py-3 text-sm text-info">
          <span className="flex items-center gap-2">
            <History className="size-4" /> A newer result from {formatDate(newer.completedOn)} is available.
          </span>
          <Link href={`/assessment/report/${newer.id}`} className="font-semibold underline-offset-4 hover:underline">
            View latest report
          </Link>
        </div>
      )}

      <Section title="Summary" icon={Sparkles}>
        <p className="leading-relaxed text-foreground/90">{summary}</p>
      </Section>

      {interests.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-5">
          <Section title="Interest profile" icon={TrendingUp} description="How strongly each type of work appeals (0–100)." className="sm:col-span-3">
            <ChartContainer config={interestConfig} className={cn("aspect-auto h-64 w-full", PRINT_CHART)}>
              <BarChart data={interestData} layout="vertical" margin={{ left: 8, right: 36, top: 4, bottom: 4 }} barCategoryGap={8}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tickCount={6} />
                <YAxis type="category" dataKey="label" width={150} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator />} />
                <Bar dataKey="score" fill="var(--color-score)" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
                  <LabelList dataKey="score" position="right" className="fill-foreground" fontSize={12} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </Section>
          <Section title="Top interests" icon={Star} className="sm:col-span-2">
            <ol className="space-y-3">
              {result.topInterests.map((label, i) => {
                const key = dimensionKey(assessment, label);
                return (
                  <li key={label} className="flex gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">{i + 1}</span>
                    <div>
                      <p className="font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{key ? CAREER_AREAS[key]?.why : ""}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Section>
        </div>
      )}

      {(traits.length > 0 || skills.length > 0) && (
        <div className={cn("grid gap-5", traits.length && skills.length && "sm:grid-cols-2")}>
          {traits.length > 0 && (
            <Section title="Personality & work style" icon={Lightbulb} description="Behavioural tendencies from your answers.">
              <ul className="space-y-3.5">
                {traits.map((d) => (
                  <Meter key={d.key} d={d} delta={delta(d.key)} />
                ))}
              </ul>
            </Section>
          )}
          {skills.length > 0 && (
            <Section title={interests.length ? "Skills" : "Readiness by area"} icon={Briefcase} description="Self-rated, based on situations you described.">
              <ul className="space-y-3.5">
                {skills.map((d) => (
                  <Meter key={d.key} d={d} delta={delta(d.key)} />
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Section title="Strengths" icon={Star}>
          {result.strengths.length ? (
            <ul className="space-y-2">
              {result.strengths.map((s) => (
                <li key={s} className="flex items-center gap-2.5 rounded-lg bg-brand-soft/60 px-3 py-2 text-sm font-medium">
                  <span className="size-1.5 rounded-full bg-brand" /> {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No area scored 60 or above yet — that&apos;s common early on, and every area here can be developed.</p>
          )}
        </Section>
        <Section title="Development opportunities" icon={TrendingUp}>
          <ul className="space-y-3">
            {result.developmentAreas.map((d) => {
              const tip = tipForLabel(d, assessment);
              return (
                <li key={d} className="rounded-lg border px-3 py-2.5">
                  <p className="text-sm font-medium">{d}</p>
                  {tip && <p className="mt-0.5 text-xs text-muted-foreground">Try: {tip}</p>}
                </li>
              );
            })}
          </ul>
        </Section>
      </div>

      {careerAreas.length > 0 && (
        <Section title="Career development suggestions" icon={Briefcase} description="Career areas that often suit people with these interests — worth exploring, not prescribing.">
          <div className="grid gap-3 sm:grid-cols-3">
            {careerAreas.map(({ label, key }) => {
              const area = CAREER_AREAS[key!];
              return (
                <div key={label} className="rounded-xl border bg-background p-4 break-inside-avoid">
                  <p className="text-[11px] font-semibold tracking-wide text-brand uppercase">{area.family}</p>
                  <p className="mt-0.5 text-sm font-medium">{label}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {area.areas.map((a) => (
                      <span key={a} className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-primary">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {previous && (
        <Section
          title="Profile history"
          icon={History}
          description={`Change since your previous result on ${formatDate(previous.completedOn)}.`}
          action={
            <Link href={`/assessment/report/${previous.id}`} className="no-print shrink-0 text-sm font-medium text-primary hover:underline">
              View previous report
            </Link>
          }
        >
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ChartContainer config={compareConfig} className={cn("aspect-auto h-72 w-full", PRINT_CHART)}>
                <BarChart data={compareData} margin={{ left: -16, right: 8, top: 8, bottom: 0 }} barGap={2}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} angle={-35} textAnchor="end" height={78} tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickCount={6} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} verticalAlign="top" />
                  <Bar dataKey="previous" fill="var(--color-previous)" radius={[4, 4, 0, 0]} maxBarSize={12} isAnimationActive={false} />
                  <Bar dataKey="current" fill="var(--color-current)" radius={[4, 4, 0, 0]} maxBarSize={12} isAnimationActive={false} />
                </BarChart>
              </ChartContainer>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold">Biggest improvements</p>
              <ul className="space-y-2">
                {biggestGains.map((g) => (
                  <li key={g.label} className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                    <span>{g.label}</span>
                    <span className="text-xs">
                      <span className="text-muted-foreground tabular-nums">
                        {g.previous} → {g.current}
                      </span>{" "}
                      <Delta value={g.change} />
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">Per-dimension changes are also shown next to each score above.</p>
            </div>
          </div>
        </Section>
      )}

      {courses.length > 0 && (
        <Section title="Recommended learning programs" icon={Sparkles} description="Matched to your development areas and top interests." action={<DemoBadge className="no-print">Rule-based</DemoBadge>}>
          <div className="grid gap-4 sm:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} compact className="break-inside-avoid" />
            ))}
          </div>
        </Section>
      )}

      <Section title="Suggested next steps" icon={ArrowRight}>
        <ol className="grid gap-3 md:grid-cols-3">
          <li className="flex flex-col rounded-xl border bg-background p-4 break-inside-avoid">
            <div className="flex items-center gap-3">
              <Portrait avatar={meera.avatar} name={meera.name} className="size-10" />
              <div>
                <p className="text-sm font-semibold">Book a debrief</p>
                <p className="text-xs text-muted-foreground">with {meera.name}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Walk through this report with a career psychologist and set three next steps.</p>
            <Button variant="outline" size="sm" className="no-print mt-3 self-start md:mt-auto" onClick={() => setDebriefOpen(true)}>
              <CalendarDays /> Choose a slot
            </Button>
          </li>
          <li className="flex flex-col rounded-xl border bg-background p-4 break-inside-avoid">
            <p className="text-sm font-semibold">Start your top recommendation</p>
            <p className="mt-1 text-xs text-muted-foreground">{courses[0] ? `${courses[0].title} targets ${result.developmentAreas[0]?.toLowerCase() ?? "your growth areas"}.` : "Explore courses matched to your results."}</p>
            <Button asChild size="sm" className="no-print mt-3 self-start md:mt-auto">
              <Link href={courses[0] ? `/courses/${courses[0].id}` : "/courses"}>
                View program <ArrowRight />
              </Link>
            </Button>
          </li>
          <li className="flex flex-col rounded-xl border bg-background p-4 break-inside-avoid">
            <p className="text-sm font-semibold">Retake around {retakeOn}</p>
            <p className="mt-1 text-xs text-muted-foreground">Preferences shift with experience. Retaking in six months shows how you&apos;ve grown.</p>
            <Button asChild variant="outline" size="sm" className="no-print mt-3 self-start md:mt-auto">
              <Link href={`/assessment/${assessment.id}`}>
                <RotateCcw /> Retake later
              </Link>
            </Button>
          </li>
        </ol>
      </Section>

      <footer className="rounded-xl border border-dashed px-4 py-3 text-xs text-muted-foreground break-inside-avoid">
        <StatusPill tone="warning" className="mr-2 print:hidden">
          Demo
        </StatusPill>
        This report is illustrative and generated from self-reported answers using simple, transparent scoring (points earned ÷ maximum possible per dimension). It is not a
        scientifically validated psychometric instrument and should not be used for selection decisions.
      </footer>

      <MentorBookingDialog mentor={meera} open={debriefOpen} onOpenChange={setDebriefOpen} defaultOfferId="o-meera-report" />
    </div>
  );
}
