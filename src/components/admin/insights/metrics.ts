import { format, parseISO } from "date-fns";
import { FUNNEL_STAGES, funnelDays, stepReach } from "@/data";
import { DISCOVERY_STEPS } from "@/data/constants";
import type { AnonymousConversation, DiscoveryStep, FunnelDay } from "@/lib/types";

// Helpers that turn the synthetic analytics data into the numbers the admin insight screens show.
// Everything is deterministic so every render (server and client) agrees.

export type RangeKey = "7" | "14" | "30";
export const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
];

export type MetricKey = Exclude<keyof FunnelDay, "date">;
export type MetricTotals = Record<MetricKey, number>;
export type FunnelKey = (typeof FUNNEL_STAGES)[number]["key"];

const METRIC_KEYS: MetricKey[] = ["visitors", "conversations", "snapshots", "programViews", "checkouts", "purchases", "assessments", "courseViews"];

export type SegmentKey = "all" | "b2c" | "college";
export const SEGMENT_OPTIONS: { value: SegmentKey; label: string }[] = [
  { value: "all", label: "All" },
  { value: "b2c", label: "B2C" },
  { value: "college", label: "College partner" },
];

/** Share of each metric that comes from college-partner traffic. B2C is the remainder, so B2C + College = All. */
const COLLEGE_SHARE: Record<MetricKey, number> = {
  visitors: 0.09,
  conversations: 0.11,
  snapshots: 0.12,
  programViews: 0.13,
  checkouts: 0.16,
  purchases: 0.19,
  assessments: 0.24,
  courseViews: 0.12,
};

export function segmentFactor(segment: SegmentKey, key: MetricKey) {
  if (segment === "all") return 1;
  return segment === "college" ? COLLEGE_SHARE[key] : 1 - COLLEGE_SHARE[key];
}

/** The last N days of the funnel, scaled to a segment. */
export function rangeDays(range: RangeKey, segment: SegmentKey = "all"): FunnelDay[] {
  const days = funnelDays.slice(-Number(range));
  if (segment === "all") return days;
  return days.map((d) => {
    const out = { ...d };
    for (const k of METRIC_KEYS) out[k] = Math.round(d[k] * segmentFactor(segment, k));
    return out;
  });
}

/** The equal-length window immediately before the selected range (undefined when data doesn't go back that far). */
export function previousRangeDays(range: RangeKey, segment: SegmentKey = "all"): FunnelDay[] | undefined {
  const n = Number(range);
  if (n * 2 > funnelDays.length) return undefined;
  const days = funnelDays.slice(-n * 2, -n);
  if (segment === "all") return days;
  return days.map((d) => {
    const out = { ...d };
    for (const k of METRIC_KEYS) out[k] = Math.round(d[k] * segmentFactor(segment, k));
    return out;
  });
}

export function sumDays(days: FunnelDay[]): MetricTotals {
  const acc = Object.fromEntries(METRIC_KEYS.map((k) => [k, 0])) as MetricTotals;
  for (const d of days) for (const k of METRIC_KEYS) acc[k] += d[k];
  return acc;
}

export interface TrendPoint extends MetricTotals {
  label: string;
  date: string;
}

/** Daily points, labelled "16 Sep". */
export function dailyPoints(days: FunnelDay[]): TrendPoint[] {
  return days.map((d) => ({ ...d, label: format(parseISO(d.date), "d MMM") }));
}

/** Complete 7-day weeks counted back from the most recent day, labelled "9–15 Oct". */
export function weeklyPoints(days: FunnelDay[]): TrendPoint[] {
  const out: TrendPoint[] = [];
  for (let end = days.length; end - 7 >= 0; end -= 7) {
    const chunk = days.slice(end - 7, end);
    const first = parseISO(chunk[0].date);
    const last = parseISO(chunk[chunk.length - 1].date);
    const label =
      format(first, "MMM") === format(last, "MMM") ? `${format(first, "d")}–${format(last, "d MMM")}` : `${format(first, "d MMM")}–${format(last, "d MMM")}`;
    out.unshift({ ...sumDays(chunk), label, date: chunk[0].date });
  }
  return out;
}

export interface FunnelStageRow {
  key: FunnelKey;
  label: string;
  value: number;
  /** share of the first stage, 0-100 */
  ofTop: number;
  /** conversion from the previous stage, 0-100 (100 for the first stage) */
  stepConversion: number;
  /** drop-off from the previous stage, 0-100 (0 for the first stage) */
  dropOff: number;
}

export function funnelRows(totals: MetricTotals): FunnelStageRow[] {
  const top = totals.visitors || 1;
  return FUNNEL_STAGES.map((s, i) => {
    const value = totals[s.key];
    const prev = i === 0 ? value : totals[FUNNEL_STAGES[i - 1].key];
    const stepConversion = prev ? (value / prev) * 100 : 0;
    return {
      key: s.key,
      label: s.label,
      value,
      ofTop: (value / top) * 100,
      stepConversion: i === 0 ? 100 : stepConversion,
      dropOff: i === 0 ? 0 : 100 - stepConversion,
    };
  });
}

/** Index of the funnel transition with the highest drop-off (ignores the first row). */
export function biggestDropIndex(rows: FunnelStageRow[]) {
  let best = 1;
  for (let i = 2; i < rows.length; i++) if (rows[i].dropOff > rows[best].dropOff) best = i;
  return best;
}

export function pctDelta(current: number, previous?: number) {
  if (previous === undefined || previous === 0) return undefined;
  const d = ((current - previous) / previous) * 100;
  return `${d >= 0 ? "+" : ""}${d.toFixed(1)}%`;
}

export const fmtPct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;

// ---------------- Discovery conversation steps ----------------

export interface StepRow extends DiscoveryStep {
  reachedPct: number;
  /** percentage points of started conversations lost at this step */
  lostPct: number;
  avgSecondsOnStep: number;
}

export const stepRows: StepRow[] = DISCOVERY_STEPS.map((s, i) => {
  const reach = stepReach.find((r) => r.stepId === s.id)!;
  const prev = i === 0 ? 100 : stepReach.find((r) => r.stepId === DISCOVERY_STEPS[i - 1].id)!.reachedPct;
  return { ...s, reachedPct: reach.reachedPct, lostPct: prev - reach.reachedPct, avgSecondsOnStep: reach.avgSecondsOnStep };
});

export const biggestLeakStep = stepRows.reduce((a, b) => (b.lostPct > a.lostPct ? b : a));

/** Median share lost per step (excluding the leak itself), used for "N× the typical step". */
export const typicalStepLoss = (() => {
  const others = stepRows.filter((s) => s.id !== biggestLeakStep.id && s.lostPct > 0).map((s) => s.lostPct).sort((a, b) => a - b);
  return others[Math.floor(others.length / 2)] ?? 1;
})();

export const stepLabel = (id: DiscoveryStep["id"]) => DISCOVERY_STEPS.find((s) => s.id === id)?.label ?? id;
export const stepIndex = (id: DiscoveryStep["id"]) => DISCOVERY_STEPS.findIndex((s) => s.id === id);

/** Last question the visitor actually answered (undefined when they left at the first question). */
export function lastCompletedStep(c: AnonymousConversation) {
  if (c.completed) return DISCOVERY_STEPS[DISCOVERY_STEPS.length - 1];
  const idx = stepIndex(c.lastStepId);
  return idx > 0 ? DISCOVERY_STEPS[idx - 1] : undefined;
}

// ---------------- Conversation outcomes & follow-ups ----------------

export type Outcome = "purchased" | "checkout" | "viewed" | "snapshot" | "dropped";
type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "brand" | "primary";

export const OUTCOME_META: Record<Outcome, { label: string; tone: Tone }> = {
  purchased: { label: "Purchased", tone: "success" },
  checkout: { label: "Checkout", tone: "warning" },
  viewed: { label: "Viewed program", tone: "info" },
  snapshot: { label: "Snapshot only", tone: "primary" },
  dropped: { label: "Dropped", tone: "danger" },
};

export function outcomeOf(c: AnonymousConversation): Outcome {
  if (c.purchased) return "purchased";
  if (c.checkoutStarted) return "checkout";
  if (c.programViewed) return "viewed";
  if (c.completed) return "snapshot";
  return "dropped";
}

export type FollowUp = AnonymousConversation["followUp"];
export const FOLLOW_UP_META: Record<FollowUp, { label: string; tone: Tone }> = {
  none: { label: "None", tone: "neutral" },
  "callback-requested": { label: "Callback requested", tone: "warning" },
  "follow-up-scheduled": { label: "Follow-up scheduled", tone: "info" },
  nurture: { label: "Nurture", tone: "brand" },
  converted: { label: "Converted", tone: "success" },
};
export const FOLLOW_UPS = Object.keys(FOLLOW_UP_META) as FollowUp[];

/** "Tue, 14 Oct · 9:18 PM" from an ISO datetime, without touching the real clock. */
export function formatStarted(iso: string) {
  const d = parseISO(iso);
  return { day: format(d, "EEE, d MMM"), time: format(d, "h:mm a") };
}

export const formatSeconds = (sec: number) => (sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m ${String(sec % 60).padStart(2, "0")}s`);
