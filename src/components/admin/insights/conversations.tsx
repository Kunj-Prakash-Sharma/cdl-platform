"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CircleCheckBig, CircleX, Download, Funnel, MessagesSquare, ShoppingCart, Timer, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoBadge } from "@/components/shared/badges";
import { PageHeader, StatCard } from "@/components/shared/page-header";
import { conversations } from "@/data";
import { formatDate, formatNumber } from "@/lib/format";
import type { AnonymousConversation } from "@/lib/types";
import { CallbackRequests } from "./callback-requests";
import { TrendChart, type SeriesSpec } from "./charts";
import { ConversationSessions } from "./conversation-sessions";
import { ConversationSheet } from "./conversation-sheet";
import { FunnelBars } from "./funnel";
import { StepDropoff } from "./step-dropoff";
import {
  dailyPoints,
  fmtPct,
  formatSeconds,
  funnelRows,
  pctDelta,
  previousRangeDays,
  RANGE_OPTIONS,
  rangeDays,
  stepRows,
  sumDays,
  weeklyPoints,
  type FollowUp,
  type RangeKey,
} from "./metrics";
import { ChartCard, PrivacyNote, Segmented } from "./ui";

type TrendMetric = "conversations" | "commerce" | "visitors";

const TREND_SERIES: Record<TrendMetric, SeriesSpec[]> = {
  conversations: [
    { key: "conversations", label: "Conversations started", color: "var(--chart-1)" },
    { key: "snapshots", label: "Completed (snapshot)", color: "var(--chart-2)" },
  ],
  commerce: [
    { key: "checkouts", label: "Checkout started", color: "var(--chart-4)" },
    { key: "purchases", label: "Purchase completed", color: "var(--chart-2)" },
  ],
  visitors: [{ key: "visitors", label: "Visitors", color: "var(--chart-1)" }],
};

/** Abandonment split into conversation phases (percentage points of started conversations, last 30 days). */
const lostIn = (ids: string[]) => stepRows.filter((s) => ids.includes(s.id)).reduce((n, s) => n + s.lostPct, 0);
const PHASES = [
  { key: "completed", label: "Completed — reached snapshot", value: stepRows[stepRows.length - 1].reachedPct, color: "var(--chart-2)" },
  { key: "early", label: "Left in intro (phone → stage)", value: lostIn(["contact", "name", "persona", "stage"]), color: "var(--chart-3)" },
  { key: "background", label: "Left at Background (open text)", value: lostIn(["background"]), color: "var(--chart-5)" },
  { key: "late", label: "Left at interests → goals", value: lostIn(["interests", "challenges", "goals"]), color: "var(--chart-4)" },
  { key: "snapshot", label: "Left before the snapshot loaded", value: lostIn(["snapshot"]), color: "var(--chart-1)" },
];

const completedSample = conversations.filter((c) => c.completed);
const abandonedSample = conversations.filter((c) => !c.completed);
const avg = (list: AnonymousConversation[]) => Math.round(list.reduce((n, c) => n + c.durationSec, 0) / Math.max(1, list.length));

export function ConversionConversations() {
  const [range, setRange] = useState<RangeKey>("30");
  const [granularity, setGranularity] = useState<"daily" | "weekly">("daily");
  const [metric, setMetric] = useState<TrendMetric>("conversations");
  const [followUps, setFollowUps] = useState<Record<string, FollowUp>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const days = useMemo(() => rangeDays(range), [range]);
  const prevDays = useMemo(() => previousRangeDays(range), [range]);
  const totals = useMemo(() => sumDays(days), [days]);
  const prev = useMemo(() => (prevDays ? sumDays(prevDays) : undefined), [prevDays]);
  const rows = useMemo(() => funnelRows(totals), [totals]);
  const points = useMemo(() => (granularity === "daily" ? dailyPoints(days) : weeklyPoints(days)), [days, granularity]);

  const startRate = (totals.conversations / totals.visitors) * 100;
  const completion = (totals.snapshots / totals.conversations) * 100;
  const prevCompletion = prev ? (prev.snapshots / prev.conversations) * 100 : undefined;
  const conversion = (totals.purchases / totals.visitors) * 100;
  const prevConversion = prev ? (prev.purchases / prev.visitors) * 100 : undefined;
  const vsHint = prev ? `vs prior ${range} days` : `${formatDate(days[0].date, "d MMM")} – ${formatDate(days[days.length - 1].date, "d MMM")}`;

  const selected = conversations.find((c) => c.id === selectedId);
  const setFollowUp = (id: string, v: FollowUp) => setFollowUps((s) => ({ ...s, [id]: v }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Conversion & Conversations"
        description="How anonymous visitors move from the free career discovery conversation to a purchase — and exactly where they lose interest."
        actions={
          <>
            <DemoBadge>Synthetic analytics</DemoBadge>
            <Button
              variant="outline"
              className="h-9"
              onClick={() => toast.success("Export prepared", { description: `Funnel and ${conversations.length} anonymous sessions as CSV (simulated — no file is generated).` })}
            >
              <Download /> Export
            </Button>
          </>
        }
      />

      <PrivacyNote />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-sm font-medium">Date range</span>
        <Segmented label="Date range" value={range} onChange={setRange} options={RANGE_OPTIONS} />
        <span className="text-xs text-muted-foreground">
          {formatDate(days[0].date, "d MMM")} – {formatDate(days[days.length - 1].date, "d MMM yyyy")} · scopes the KPIs, funnel and trend. Step analysis and sessions use the
          30-day sample.
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Visitors" value={formatNumber(totals.visitors)} icon={Users} trend={pctDelta(totals.visitors, prev?.visitors)} hint={vsHint} />
        <StatCard
          label="Conversations started"
          value={formatNumber(totals.conversations)}
          icon={MessagesSquare}
          accent="info"
          hint={`${fmtPct(startRate)} of visitors`}
        />
        <StatCard
          label="Completion rate"
          value={fmtPct(completion)}
          icon={CircleCheckBig}
          accent="success"
          trend={pctDelta(completion, prevCompletion)}
          hint={`${formatNumber(totals.snapshots)} snapshots`}
        />
        <StatCard
          label="Abandonment rate"
          value={fmtPct(100 - completion)}
          icon={CircleX}
          accent="warning"
          hint={prevCompletion !== undefined ? `${fmtPct(100 - prevCompletion)} in prior ${range} days` : "left before the snapshot"}
        />
        <StatCard
          label="Visitor → purchase"
          value={fmtPct(conversion, 2)}
          icon={ShoppingCart}
          accent="brand"
          trend={pctDelta(conversion, prevConversion)}
          hint={`${formatNumber(totals.purchases)} purchases`}
        />
        <StatCard label="Avg. conversation" value={formatSeconds(avg(conversations))} icon={Timer} hint={`Completed ${formatSeconds(avg(completedSample))}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Visitor → purchase funnel"
          description="Counts per stage, step conversion and drop-off. Bars are scaled to visitors."
          action={<Funnel className="size-4 text-muted-foreground" />}
        >
          <FunnelBars rows={rows} />
        </ChartCard>

        <ChartCard title="Completion & abandonment" description="What happens to every 100 started conversations">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="font-heading text-3xl font-semibold text-success">{fmtPct(completion)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Abandoned</p>
              <p className="font-heading text-3xl font-semibold text-destructive">{fmtPct(100 - completion)}</p>
            </div>
          </div>
          <div className="mt-3 flex h-3 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Share of started conversations by outcome">
            {PHASES.map((p) => (
              <span key={p.key} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${p.value}%`, backgroundColor: p.color }} />
            ))}
          </div>
          <ul className="mt-4 space-y-2">
            {PHASES.map((p) => (
              <li key={p.key} className="flex items-center gap-2.5 text-[13px]">
                <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: p.color }} />
                <span className={p.key === "background" ? "font-semibold" : "text-muted-foreground"}>{p.label}</span>
                <span className="ml-auto font-medium tabular-nums">{p.value}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4 text-xs">
            <div className="rounded-lg bg-muted/60 p-2.5">
              <p className="text-muted-foreground">Avg. time to complete</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatSeconds(avg(completedSample))}</p>
            </div>
            <div className="rounded-lg bg-muted/60 p-2.5">
              <p className="text-muted-foreground">Avg. time before leaving</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatSeconds(avg(abandonedSample))}</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">Phase split from the last 30 days of step events; times from the session sample.</p>
        </ChartCard>
      </div>

      <ChartCard
        title="Trend"
        description={
          granularity === "daily" ? "Daily totals for the selected range" : "Weekly totals (complete 7-day weeks ending on the latest day)"
        }
        action={
          <>
            <Segmented
              label="Metric"
              value={metric}
              onChange={setMetric}
              options={[
                { value: "conversations", label: "Conversations" },
                { value: "commerce", label: "Checkout & purchase" },
                { value: "visitors", label: "Visitors" },
              ]}
            />
            <Segmented
              label="Granularity"
              value={granularity}
              onChange={setGranularity}
              options={[
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
              ]}
            />
          </>
        }
      >
        <TrendChart points={points} series={TREND_SERIES[metric]} granularity={granularity} className="h-72" />
      </ChartCard>

      <StepDropoffSection totalsConversations={totals} />

      <ConversationSessions followUps={followUps} onFollowUpChange={setFollowUp} onOpen={(c) => setSelectedId(c.id)} />

      <CallbackRequests />

      <ConversationSheet
        conversation={selected}
        followUp={selected ? (followUps[selected.id] ?? selected.followUp) : "none"}
        onFollowUpChange={setFollowUp}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </div>
  );
}

function StepDropoffSection({ totalsConversations }: { totalsConversations: ReturnType<typeof sumDays> }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-heading text-lg font-semibold">Where visitors lose interest inside the conversation</h2>
        <p className="text-sm text-muted-foreground">Nine discovery questions, from phone number to career snapshot.</p>
      </div>
      <StepDropoff totals={totalsConversations} />
    </section>
  );
}
