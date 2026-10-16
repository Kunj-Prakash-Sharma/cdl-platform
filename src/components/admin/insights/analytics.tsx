"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, Eye, Lightbulb, MessagesSquare, MousePointerClick, ShoppingCart, Sparkles, TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DemoBadge } from "@/components/shared/badges";
import { CourseIcon } from "@/components/shared/course-thumbnail";
import { PageHeader, StatCard } from "@/components/shared/page-header";
import { assessments, funnelDays, getCourse, popularPrograms, stageMix, trafficSources } from "@/data";
import { STAGE_META } from "@/data/constants";
import { formatCompact, formatNumber } from "@/lib/format";
import type { LearnerStage } from "@/lib/types";
import { HBarChart, TrendChart } from "./charts";
import { FunnelBars } from "./funnel";
import {
  dailyPoints,
  fmtPct,
  funnelRows,
  pctDelta,
  previousRangeDays,
  RANGE_OPTIONS,
  rangeDays,
  SEGMENT_OPTIONS,
  sumDays,
  type RangeKey,
  type SegmentKey,
} from "./metrics";
import { ChartCard, Segmented, tooltipRow } from "./ui";

const ALL_30 = sumDays(funnelDays);

/** Share of each traffic source's visitors that arrive through college partners. */
const SOURCE_COLLEGE_SHARE: Record<string, number> = {
  Instagram: 0.03,
  "Google Search": 0.05,
  YouTube: 0.04,
  WhatsApp: 0.12,
  "College partner": 0.92,
  Direct: 0.1,
  Referral: 0.08,
};
/** Share of each learner stage that belongs to college-partner accounts. */
const STAGE_COLLEGE_SHARE: Record<LearnerStage, number> = { college: 0.38, school: 0.22, graduate: 0.06, professional: 0.01, parent: 0.02 };
/** Assessment completion rate (completed ÷ started). */
const ASSESSMENT_COMPLETION: Record<string, number> = { "career-compass": 0.78, "employability-index": 0.86 };

const share = (segment: SegmentKey, collegeShare: number) => (segment === "all" ? 1 : segment === "college" ? collegeShare : 1 - collegeShare);

const assessmentConfig = {
  started: { label: "Started", color: "var(--chart-3)" },
  completed: { label: "Completed", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function AnalyticsDashboard() {
  const [range, setRange] = useState<RangeKey>("30");
  const [segment, setSegment] = useState<SegmentKey>("all");

  const days = useMemo(() => rangeDays(range, segment), [range, segment]);
  const totals = useMemo(() => sumDays(days), [days]);
  const prev = useMemo(() => {
    const p = previousRangeDays(range, segment);
    return p ? sumDays(p) : undefined;
  }, [range, segment]);
  const points = useMemo(() => dailyPoints(days), [days]);
  const funnel = useMemo(() => funnelRows(totals), [totals]);
  const vsHint = prev ? `vs prior ${range} days` : "16 Sep – 15 Oct";

  // Static 30-day datasets are scaled to the selected range + segment so every block agrees.
  const programs = useMemo(
    () =>
      popularPrograms.map((p) => {
        const course = getCourse(p.courseId)!;
        const views = Math.round(p.views * (totals.courseViews / ALL_30.courseViews));
        const checkouts = Math.round(p.checkouts * (totals.checkouts / ALL_30.checkouts));
        const purchases = Math.min(checkouts, Math.round(p.purchases * (totals.purchases / ALL_30.purchases)));
        const free = course.pricing["self-paced"] === 0;
        return { course, views, checkouts, purchases, free, conversion: views ? (purchases / views) * 100 : 0, checkoutRate: views ? (checkouts / views) * 100 : 0 };
      }),
    [totals],
  );

  const sources = useMemo(() => {
    const scale = sumDays(rangeDays(range)).visitors / ALL_30.visitors;
    return trafficSources
      .map((s) => ({ ...s, visitors: Math.round(s.visitors * scale * share(segment, SOURCE_COLLEGE_SHARE[s.source] ?? 0)) }))
      .sort((a, b) => b.visitors - a.visitors);
  }, [range, segment]);

  const stages = useMemo(
    () => stageMix.map((s) => ({ ...s, learners: Math.round(s.learners * share(segment, STAGE_COLLEGE_SHARE[s.stage])) })).sort((a, b) => b.learners - a.learners),
    [segment],
  );

  const assessmentRows = useMemo(() => {
    const live = assessments.filter((a) => a.status === "active");
    const allCompletions = live.reduce((n, a) => n + a.completions, 0);
    return live.map((a) => {
      const completed = Math.round(totals.assessments * (a.completions / allCompletions));
      const rate = ASSESSMENT_COMPLETION[a.id] ?? 0.8;
      return { id: a.id, name: a.title.replace("CDL ", ""), completed, started: Math.round(completed / rate), rate: rate * 100, minutes: a.avgCompletionMin };
    });
  }, [totals]);
  const draftAssessments = assessments.filter((a) => a.status !== "active");

  const paid = programs.filter((p) => !p.free);
  const bestProgram = paid.reduce((a, b) => (b.conversion > a.conversion ? b : a));
  const bestSource = sources.reduce((a, b) => (b.conversionPct > a.conversionPct ? b : a));
  const biggestSource = sources[0];
  const weakestAssessment = assessmentRows.reduce((a, b) => (b.rate < a.rate ? b : a));
  const stageTotal = stages.reduce((n, s) => n + s.learners, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        description="Traffic, discovery, assessments, course interest and simulated purchases — filter by date range and segment."
        actions={<DemoBadge>All metrics are synthetic demo data</DemoBadge>}
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border bg-card px-4 py-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Date range</span>
          <Segmented label="Date range" value={range} onChange={setRange} options={RANGE_OPTIONS} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Segment</span>
          <Segmented label="Segment" value={segment} onChange={setSegment} options={SEGMENT_OPTIONS} />
        </div>
        <span className="text-xs text-muted-foreground lg:ml-auto">Every chart and table below uses this slice.</span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Visitors" value={formatNumber(totals.visitors)} icon={Users} trend={pctDelta(totals.visitors, prev?.visitors)} hint={vsHint} />
        <StatCard
          label="Conversation rate"
          value={fmtPct((totals.conversations / totals.visitors) * 100)}
          icon={MessagesSquare}
          accent="info"
          hint={`${formatNumber(totals.conversations)} conversations`}
        />
        <StatCard label="Assessments completed" value={formatNumber(totals.assessments)} icon={ClipboardCheck} accent="warning" trend={pctDelta(totals.assessments, prev?.assessments)} hint={vsHint} />
        <StatCard label="Course views" value={formatNumber(totals.courseViews)} icon={Eye} trend={pctDelta(totals.courseViews, prev?.courseViews)} hint={vsHint} />
        <StatCard label="Checkouts started" value={formatNumber(totals.checkouts)} icon={MousePointerClick} accent="brand" hint={`${fmtPct((totals.checkouts / totals.programViews) * 100)} of program views`} />
        <StatCard label="Purchases (simulated)" value={formatNumber(totals.purchases)} icon={ShoppingCart} accent="success" trend={pctDelta(totals.purchases, prev?.purchases)} hint={vsHint} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <InsightCard icon={TrendingUp} title={`${bestSource.source} converts ${(bestSource.conversionPct / biggestSource.conversionPct).toFixed(1)}× ${biggestSource.source}`}>
          {biggestSource.source} brings the most visitors ({formatNumber(biggestSource.visitors)}) but converts at {biggestSource.conversionPct}%. Shift budget toward referral rewards.
        </InsightCard>
        <InsightCard icon={Sparkles} title={`${bestProgram.course.title} is the best-converting paid program`}>
          {fmtPct(bestProgram.conversion)} of its viewers purchase — feature it on the career snapshot for matching interests.
        </InsightCard>
        <InsightCard icon={Lightbulb} title={`${weakestAssessment.name}: ${Math.round(weakestAssessment.rate)}% completion`}>
          At {weakestAssessment.minutes} min it is the longest assessment. A save-and-resume reminder could recover ~{formatNumber(Math.round((weakestAssessment.started - weakestAssessment.completed) * 0.3))} completions.
        </InsightCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Visitor-to-conversation funnel"
          description="Step conversion % on the right"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/conversations">
                Deep dive <ArrowRight />
              </Link>
            </Button>
          }
        >
          <FunnelBars rows={funnel} compact />
        </ChartCard>
        <ChartCard className="lg:col-span-2" title="Checkout initiation & simulated purchases" description="Daily, selected range · payments are simulated">
          <TrendChart
            points={points}
            granularity="daily"
            series={[
              { key: "checkouts", label: "Checkouts started", color: "var(--chart-4)" },
              { key: "purchases", label: "Purchases completed", color: "var(--chart-2)" },
            ]}
          />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Course views" description="Program page views by course, selected range">
          <HBarChart label="Views" categoryWidth={200} valueFormat={formatCompact} data={programs.map((p) => ({ name: p.course.title, value: p.views }))} />
        </ChartCard>
        <ChartCard title="Assessment completion" description="Started vs completed per assessment, selected range">
          <ChartContainer config={assessmentConfig} className="aspect-auto h-60 w-full">
            <BarChart data={assessmentRows} margin={{ left: 0, right: 8, top: 8 }} barGap={4} barCategoryGap="30%">
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={(v: number) => formatCompact(v)} />
              <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent formatter={tooltipRow({ started: "Started", completed: "Completed" }, formatNumber)} />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar isAnimationActive={false} dataKey="started" fill="var(--color-started)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar isAnimationActive={false} dataKey="completed" fill="var(--color-completed)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ChartContainer>
          <ul className="mt-3 space-y-1.5 border-t pt-3 text-[13px]">
            {assessmentRows.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3">
                <span className="truncate">{a.name}</span>
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {formatNumber(a.completed)} / {formatNumber(a.started)} · <span className="font-semibold text-foreground">{Math.round(a.rate)}%</span> · {a.minutes} min avg
                </span>
              </li>
            ))}
            {draftAssessments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 text-muted-foreground">
                <span className="truncate">{a.title}</span>
                <span className="shrink-0 text-xs">Draft — not live yet</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>

      <ChartCard title="Popular programs" description="Views, checkouts and simulated purchases, selected range">
        <div className="overflow-x-auto rounded-xl border">
          <Table className="min-w-[760px]">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Checkouts</TableHead>
                <TableHead className="text-right">Purchases</TableHead>
                <TableHead className="text-right">Checkout rate</TableHead>
                <TableHead className="w-44">Conversion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((p) => (
                <TableRow key={p.course.id}>
                  <TableCell>
                    <Link href={`/courses/${p.course.id}`} className="flex items-center gap-2.5 hover:underline">
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundImage: `linear-gradient(135deg, ${p.course.thumbnail.from}, ${p.course.thumbnail.to})` }}
                      >
                        <CourseIcon theme={p.course.thumbnail} className="size-4 text-white" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium">{p.course.title}</span>
                        <span className="block text-xs text-muted-foreground">{p.course.category}</span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(p.views)}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.free ? <span className="text-xs text-muted-foreground">Free enrolment</span> : formatNumber(p.checkouts)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(p.purchases)}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.free ? "—" : fmtPct(p.checkoutRate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, p.conversion * 4)}%`, backgroundColor: p.free ? "var(--chart-3)" : "var(--chart-2)" }} />
                      </div>
                      <span className="w-12 text-right text-[13px] font-medium tabular-nums">{fmtPct(p.conversion)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Conversion = purchases ÷ views. Career Discovery Fundamentals is free, so every enrolment counts as a purchase.</p>
      </ChartCard>

      <ChartCard title="Traffic sources" description="Visitor distribution and visitor → purchase conversion by source, selected range">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Visitors</p>
            <HBarChart label="Visitors" categoryWidth={122} valueFormat={formatCompact} data={sources.map((s) => ({ name: s.source, value: s.visitors }))} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Conversion to purchase</p>
            <HBarChart
              label="Conversion"
              categoryWidth={122}
              color="var(--chart-2)"
              highlightColor="var(--chart-2)"
              valueFormat={(v) => `${v}%`}
              data={sources.map((s) => ({ name: s.source, value: s.conversionPct, highlight: s.source === bestSource.source }))}
            />
          </div>
        </div>
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Engagement by date" description="Course page views and discovery conversations per day">
          <TrendChart
            points={points}
            granularity="daily"
            series={[
              { key: "courseViews", label: "Course views", color: "var(--chart-1)" },
              { key: "conversations", label: "Discovery conversations", color: "var(--chart-3)" },
            ]}
          />
        </ChartCard>
        <ChartCard title="Learner stage mix" description={`${formatNumber(stageTotal)} learners${segment === "all" ? "" : ` · ${SEGMENT_OPTIONS.find((s) => s.value === segment)?.label}`}`}>
          <HBarChart label="Learners" categoryWidth={132} data={stages.map((s) => ({ name: STAGE_META[s.stage].plural, value: s.learners }))} />
          <p className="mt-2 text-xs text-muted-foreground">
            Largest group: {STAGE_META[stages[0].stage].plural} ({Math.round((stages[0].learners / Math.max(1, stageTotal)) * 100)}%).
          </p>
        </ChartCard>
      </div>
    </div>
  );
}

function InsightCard({ icon: Icon, title, children }: { icon: typeof Users; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{children}</p>
        </div>
      </div>
    </div>
  );
}
