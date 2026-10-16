"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { WeekRow } from "./college-data";

const pctTick = (v: number) => `${v}%`;

/** Weekly active students — single series, the card title names it. */
export function WeeklyActiveChart({ data, className }: { data: WeekRow[]; className?: string }) {
  const config = { active: { label: "Active students", color: "var(--chart-2)" } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className={cn("aspect-auto h-56 w-full", className)}>
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="fill-active" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-active)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-active)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
        <YAxis tickLine={false} axisLine={false} width={34} domain={[0, 420]} ticks={[0, 100, 200, 300, 400]} />
        <ChartTooltip cursor content={<ChartTooltipContent indicator="line" labelFormatter={(l) => `Week of ${l}`} />} />
        <Area isAnimationActive={false} dataKey="active" type="monotone" stroke="var(--color-active)" strokeWidth={2} fill="url(#fill-active)" activeDot={{ r: 4 }} />
      </AreaChart>
    </ChartContainer>
  );
}

export interface ProgramBarRow {
  name: string;
  value: number;
  provided: boolean;
}

/** Average progress by program; bars coloured by provider (CDL vs institution). */
export function ProgramProgressChart({ rows, brandColor, className }: { rows: ProgramBarRow[]; brandColor: string; className?: string }) {
  const config = { value: { label: "Average progress", color: "var(--chart-1)" } } satisfies ChartConfig;
  return (
    <div className={className}>
      <ChartContainer config={config} className="aspect-auto w-full" style={{ height: Math.max(160, rows.length * 42 + 24) }}>
        <BarChart data={rows} layout="vertical" margin={{ left: 4, right: 40, top: 4, bottom: 4 }} barCategoryGap={10}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={pctTick} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={124} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel={false} formatter={(v, _n, item) => <TooltipValue label={(item.payload as ProgramBarRow).name} value={`${v}% avg progress`} />} />} />
          <Bar isAnimationActive={false} dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {rows.map((r) => (
              <Cell key={r.name} fill={r.provided ? brandColor : "var(--chart-1)"} />
            ))}
            <LabelList dataKey="value" position="right" formatter={(v: unknown) => `${v}%`} className="fill-foreground text-xs font-medium" />
          </Bar>
        </BarChart>
      </ChartContainer>
      <ProviderLegend brandColor={brandColor} />
    </div>
  );
}

function TooltipValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-medium text-foreground">{label}</span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
}

export function ProviderLegend({ brandColor, className }: { brandColor: string; className?: string }) {
  return (
    <div className={cn("mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-[3px] bg-chart-1" /> CDL program
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: brandColor }} /> Institution-provided
      </span>
    </div>
  );
}

/** Start-of-period vs current average progress per program (same % scale). */
export function ProgramWindowChart({ rows, className }: { rows: { name: string; start: number; now: number }[]; className?: string }) {
  const config = {
    start: { label: "Start of period", color: "var(--chart-3)" },
    now: { label: "Now", color: "var(--chart-1)" },
  } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className={cn("aspect-auto w-full", className)} style={{ height: rows.length * 48 + 56 }}>
      <BarChart data={rows} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 0 }} barGap={2} barCategoryGap={10}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={pctTick} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={124} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(v, name) => <SeriesValue name={String(name)} value={`${v}%`} config={config} />} />} />
        <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
        <Bar isAnimationActive={false} dataKey="start" fill="var(--color-start)" radius={[0, 4, 4, 0]} maxBarSize={14} />
        <Bar isAnimationActive={false} dataKey="now" fill="var(--color-now)" radius={[0, 4, 4, 0]} maxBarSize={14} />
      </BarChart>
    </ChartContainer>
  );
}

function SeriesValue({ name, value, config }: { name: string; value: string; config: ChartConfig }) {
  return (
    <div className="flex w-full items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <span className="size-2 rounded-[2px]" style={{ backgroundColor: config[name]?.color }} />
        {config[name]?.label ?? name}
      </span>
      <span className="font-medium text-foreground tabular-nums">{value}</span>
    </div>
  );
}

/** Department comparison: average progress vs weekly-active rate (both %). */
export function DepartmentChart({ rows, className }: { rows: { short: string; avgProgress: number; activeRate: number }[]; className?: string }) {
  const config = {
    avgProgress: { label: "Avg progress", color: "var(--chart-1)" },
    activeRate: { label: "Weekly active rate", color: "var(--chart-2)" },
  } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className={cn("aspect-auto h-72 w-full", className)}>
      <BarChart data={rows} margin={{ left: 0, right: 8, top: 8, bottom: 0 }} barGap={2}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="short" tickLine={false} axisLine={false} tickMargin={8} interval={0} />
        <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={pctTick} tickLine={false} axisLine={false} width={40} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(v, name) => <SeriesValue name={String(name)} value={`${v}%`} config={config} />} />} />
        <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
        <Bar isAnimationActive={false} dataKey="avgProgress" fill="var(--color-avgProgress)" radius={[4, 4, 0, 0]} maxBarSize={26} />
        <Bar isAnimationActive={false} dataKey="activeRate" fill="var(--color-activeRate)" radius={[4, 4, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ChartContainer>
  );
}

/** Assessment completion donut with the headline rate in the centre. */
export function AssessmentDonut({
  completed,
  inProgress,
  notStarted,
  rate,
  className,
}: {
  completed: number;
  inProgress: number;
  notStarted: number;
  rate: number;
  className?: string;
}) {
  const config = {
    completed: { label: "Completed", color: "var(--chart-2)" },
    inProgress: { label: "In progress", color: "var(--chart-4)" },
    notStarted: { label: "Not started", color: "var(--muted-foreground)" },
  } satisfies ChartConfig;
  const data = [
    { key: "completed", value: completed, fill: "var(--color-completed)" },
    { key: "inProgress", value: inProgress, fill: "var(--color-inProgress)" },
    { key: "notStarted", value: notStarted, fill: "var(--color-notStarted)" },
  ];
  return (
    <div className={cn("flex flex-col items-center gap-4 sm:flex-row", className)}>
      <div className="relative">
        <ChartContainer config={config} className="aspect-square h-44">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
            <Pie isAnimationActive={false} data={data} dataKey="value" nameKey="key" innerRadius={54} outerRadius={78} strokeWidth={2} stroke="var(--card)" startAngle={90} endAngle={-270} />
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-2xl font-semibold tabular-nums">{rate}%</span>
          <span className="text-[11px] text-muted-foreground">completed</span>
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: config[d.key as keyof typeof config].color }} />
              {config[d.key as keyof typeof config].label}
            </span>
            <span className="font-medium tabular-nums">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Weekly class attendance per batch (null weeks = no class held). */
export function AttendanceTrendChart({ data, className }: { data: WeekRow[]; className?: string }) {
  const config = {
    attendanceA: { label: "Batch A", color: "var(--chart-1)" },
    attendanceB: { label: "Batch B", color: "var(--chart-2)" },
  } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className={cn("aspect-auto h-64 w-full", className)}>
      <LineChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={12} />
        <YAxis domain={[50, 100]} ticks={[50, 60, 70, 80, 90, 100]} tickFormatter={pctTick} tickLine={false} axisLine={false} width={40} />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={(l) => `Week of ${l}`} formatter={(v, name) => <SeriesValue name={String(name)} value={`${v}%`} config={config} />} />}
        />
        <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
        <Line isAnimationActive={false} dataKey="attendanceA" type="monotone" stroke="var(--color-attendanceA)" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: "var(--card)" }} connectNulls={false} />
        <Line isAnimationActive={false} dataKey="attendanceB" type="monotone" stroke="var(--color-attendanceB)" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: "var(--card)" }} connectNulls={false} />
      </LineChart>
    </ChartContainer>
  );
}
