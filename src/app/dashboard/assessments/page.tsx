"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, ClipboardList, Clock, Compass, FileClock, Gauge, ListChecks, PlayCircle, Sparkles } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { assessments, getAssessment, getUser } from "@/data";
import { formatDate, relativeDay } from "@/lib/format";
import type { AssessmentResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useCurrentUser } from "@/store/hooks";
import { DemoBadge } from "@/components/shared/badges";
import { EmptyState, PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Panel } from "@/components/learner/overview-parts";
import { CHILD_USER_ID } from "@/components/learner/utils";
import { OwnerTag, TealProgress } from "@/components/learner/widgets";

const CATEGORY_ICON = { Interests: Compass, Personality: Sparkles, Employability: Gauge, Strengths: ListChecks } as const;
type Group = "interest" | "trait" | "skill";

export default function AssessmentsPage() {
  const { user, userId, isParent } = useCurrentUser();
  const results = useDemoStore((s) => s.assessmentResults);
  const drafts = useDemoStore((s) => s.assessmentDrafts);
  const childName = user.childName ?? getUser(CHILD_USER_ID)?.name.split(" ")[0] ?? "Child";

  const mine = useMemo(() => results.filter((r) => r.userId === userId).sort((a, b) => b.completedOn.localeCompare(a.completedOn)), [results, userId]);
  const childResults = useMemo(
    () => (isParent ? results.filter((r) => r.userId === CHILD_USER_ID).sort((a, b) => b.completedOn.localeCompare(a.completedOn)) : []),
    [results, isParent],
  );
  const compassAttempts = (isParent ? childResults : mine).filter((r) => r.assessmentId === "career-compass");
  const draftList = Object.entries(drafts)
    .map(([id, d]) => ({ assessment: getAssessment(id), draft: d }))
    .filter((d) => d.assessment);
  const available = assessments.filter((a) => a.status === "active");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="My Self"
        title="Assessments"
        description="Your previous assessment records, how your results have changed, and assessments you can take next."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/dashboard/development">My Development</Link>
            </Button>
            <Button asChild>
              <Link href="/assessment">
                <ClipboardList /> All assessments
              </Link>
            </Button>
          </>
        }
      />

      <p className="flex items-start gap-2 rounded-xl border border-dashed border-warning/40 bg-warning-soft/60 px-3 py-2 text-xs text-warning">
        <Sparkles className="mt-0.5 size-3.5 shrink-0" />
        Assessment results in this prototype are illustrative reflections, not scientifically validated psychometric measurements.
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Panel title={isParent ? "Records" : "Your assessment records"} description={`${mine.length + childResults.length} completed`}>
            {mine.length + childResults.length === 0 ? (
              <EmptyState icon={ClipboardList} title="No assessments yet" description="Start with the Career Compass — it takes about 12 minutes." action={<Button asChild size="sm"><Link href="/assessment/career-compass">Start Career Compass</Link></Button>} />
            ) : (
              <ul className="space-y-3">
                {childResults.map((r) => (
                  <RecordRow key={r.id} result={r} owner={`${childName}'s`} />
                ))}
                {mine.map((r) => (
                  <RecordRow key={r.id} result={r} owner={isParent ? "Yours" : undefined} />
                ))}
              </ul>
            )}
          </Panel>

          {compassAttempts.length >= 2 ? (
            <ComparisonCard latest={compassAttempts[0]} previous={compassAttempts[1]} subject={isParent ? childName : undefined} />
          ) : (
            <Panel title="Compare attempts" description="Retake the Career Compass to see how your profile changes">
              <EmptyState icon={Compass} title="Only one Career Compass attempt" description="Take it again after a few months of learning to compare results side by side." action={<Button asChild size="sm"><Link href="/assessment/career-compass">Retake Career Compass</Link></Button>} />
            </Panel>
          )}
        </div>

        <aside className="space-y-6">
          <Panel title="Drafts in progress" description="Pick up where you left off">
            {draftList.length ? (
              <ul className="space-y-3">
                {draftList.map(({ assessment, draft }) => {
                  const total = assessment!.questions.length;
                  const answered = Object.keys(draft.answers).length;
                  const pct = Math.round((answered / total) * 100);
                  return (
                    <li key={assessment!.id} className="rounded-xl border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{assessment!.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {answered} of {total} answered · saved {relativeDay(draft.updatedAt).toLowerCase()}
                          </p>
                        </div>
                        <FileClock className="size-4 shrink-0 text-warning" />
                      </div>
                      <TealProgress value={pct} className="mt-2.5" />
                      <Button asChild size="sm" className="mt-3 w-full bg-brand text-brand-foreground hover:bg-brand/90">
                        <Link href={`/assessment/${assessment!.id}`}>
                          <PlayCircle /> Resume
                        </Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon={FileClock} title="No drafts" description="Assessments you start but don't finish are saved here." className="py-8" />
            )}
          </Panel>

          <Panel title="Available assessments" description="Free for all CDL learners">
            <ul className="space-y-3">
              {available.map((a) => {
                const Icon = CATEGORY_ICON[a.category];
                const done = mine.filter((r) => r.assessmentId === a.id).length;
                const hasDraft = Boolean(drafts[a.id]);
                return (
                  <li key={a.id} className="rounded-xl border p-3.5">
                    <div className="flex items-start gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{a.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.description}</p>
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3" /> {a.estimatedMin} min
                          </span>
                          <span>· {a.questions.length} questions</span>
                          {done > 0 && <span className="text-success">· taken {done}×</span>}
                        </p>
                      </div>
                    </div>
                    <Button asChild variant={hasDraft ? "default" : "outline"} size="sm" className="mt-3 w-full">
                      <Link href={`/assessment/${a.id}`}>{hasDraft ? "Resume draft" : done ? "Retake" : "Start"}</Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function RecordRow({ result, owner }: { result: AssessmentResult; owner?: string }) {
  const a = getAssessment(result.assessmentId);
  if (!a) return null;
  const Icon = CATEGORY_ICON[a.category];
  const highlights = result.topInterests.length ? result.topInterests : result.strengths;
  return (
    <li className="flex flex-col gap-3 rounded-xl border p-4 transition hover:shadow-xs sm:flex-row sm:items-center">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {owner && <OwnerTag tone={owner === "Yours" ? "primary" : "brand"}>{owner}</OwnerTag>}
          <p className="font-semibold">{a.title}</p>
          <span className="text-xs text-muted-foreground">· {formatDate(result.completedOn)}</span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {highlights.slice(0, 3).map((h) => (
            <span key={h} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {h}
            </span>
          ))}
        </div>
      </div>
      <Button asChild variant="outline" size="sm" className="shrink-0">
        <Link href={`/assessment/report/${result.id}`}>
          View report <ArrowRight />
        </Link>
      </Button>
    </li>
  );
}

const chartConfig = {
  previous: { label: "Earlier attempt", color: "var(--chart-3)" },
  latest: { label: "Latest attempt", color: "var(--chart-1)" },
} satisfies ChartConfig;

function ComparisonCard({ latest, previous, subject }: { latest: AssessmentResult; previous: AssessmentResult; subject?: string }) {
  const [group, setGroup] = useState<Group>("skill");
  const assessment = getAssessment(latest.assessmentId)!;
  const config = {
    previous: { ...chartConfig.previous, label: formatDate(previous.completedOn, "MMM yyyy") },
    latest: { ...chartConfig.latest, label: formatDate(latest.completedOn, "MMM yyyy") },
  } satisfies ChartConfig;
  const rows = Object.entries(assessment.dimensions)
    .filter(([, d]) => d.group === group)
    .map(([key, d]) => ({ key, label: d.label, previous: previous.scores[key] ?? 0, latest: latest.scores[key] ?? 0 }));
  const changes = Object.entries(assessment.dimensions)
    .map(([key, d]) => ({ key, label: d.label, delta: (latest.scores[key] ?? 0) - (previous.scores[key] ?? 0) }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 4);

  return (
    <Panel
      title={`${subject ? `${subject}'s ` : ""}Career Compass: what changed`}
      description={`${formatDate(previous.completedOn)} → ${formatDate(latest.completedOn)}`}
      action={<DemoBadge>Illustrative</DemoBadge>}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ToggleGroup type="single" value={group} onValueChange={(v) => v && setGroup(v as Group)} variant="outline" size="sm" spacing={0}>
          <ToggleGroupItem value="interest">Interests</ToggleGroupItem>
          <ToggleGroupItem value="trait">Personality</ToggleGroupItem>
          <ToggleGroupItem value="skill">Skills</ToggleGroupItem>
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">Scores out of 100</p>
      </div>
      <ChartContainer config={config} className="mt-4 aspect-auto w-full" style={{ height: rows.length * 52 + 60 }}>
        <BarChart data={rows} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }} barGap={3} barCategoryGap="22%">
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} ticks={[0, 25, 50, 75, 100]} />
          <YAxis type="category" dataKey="label" width={150} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
          <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="previous" fill="var(--color-previous)" radius={[0, 4, 4, 0]} maxBarSize={14} isAnimationActive={false} />
          <Bar dataKey="latest" fill="var(--color-latest)" radius={[0, 4, 4, 0]} maxBarSize={14} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
      <div className="mt-4 border-t pt-4">
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Biggest changes</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {changes.map((c) => (
            <div key={c.key} className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
              <span className="truncate">{c.label}</span>
              <span className={cn("inline-flex items-center gap-0.5 font-semibold tabular-nums", c.delta >= 0 ? "text-success" : "text-destructive")}>
                {c.delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                {c.delta > 0 ? "+" : ""}
                {c.delta}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
