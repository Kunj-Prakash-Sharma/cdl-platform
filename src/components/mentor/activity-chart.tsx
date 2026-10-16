"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

/** Illustrative weekly delivery mix for the last 8 weeks (week starting Monday). */
export const WEEKLY_SESSIONS = [
  { week: "24 Aug", mentoring: 5, cohort: 2, workshops: 1 },
  { week: "31 Aug", mentoring: 6, cohort: 2, workshops: 0 },
  { week: "7 Sep", mentoring: 4, cohort: 3, workshops: 1 },
  { week: "14 Sep", mentoring: 7, cohort: 3, workshops: 1 },
  { week: "21 Sep", mentoring: 6, cohort: 2, workshops: 2 },
  { week: "28 Sep", mentoring: 5, cohort: 2, workshops: 1 },
  { week: "5 Oct", mentoring: 4, cohort: 2, workshops: 1 },
  { week: "12 Oct", mentoring: 5, cohort: 3, workshops: 0 },
];

const config = {
  mentoring: { label: "1:1 mentoring", color: "var(--chart-2)" },
  cohort: { label: "Cohort classes", color: "var(--chart-1)" },
  workshops: { label: "Workshops & doubt hours", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function ActivityChart() {
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={WEEKLY_SESSIONS} margin={{ top: 8, right: 4, left: -20, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={44} />
        <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="mentoring" stackId="s" fill="var(--color-mentoring)" stroke="var(--card)" strokeWidth={2} radius={[0, 0, 4, 4]} />
        <Bar dataKey="cohort" stackId="s" fill="var(--color-cohort)" stroke="var(--card)" strokeWidth={2} />
        <Bar dataKey="workshops" stackId="s" fill="var(--color-workshops)" stroke="var(--card)" strokeWidth={2} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
