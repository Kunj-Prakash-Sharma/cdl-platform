"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCompact, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TrendPoint } from "./metrics";
import { tooltipRow } from "./ui";

export interface SeriesSpec {
  key: keyof TrendPoint & string;
  label: string;
  color: string;
}

function configFor(series: SeriesSpec[]): ChartConfig {
  return Object.fromEntries(series.map((s) => [s.key, { label: s.label, color: s.color }]));
}

/** Daily → area chart (crosshair tooltip); weekly → grouped columns. One y-axis only. */
export function TrendChart({
  points,
  series,
  granularity,
  className,
  valueFormat = formatNumber,
  showLegend = true,
}: {
  points: TrendPoint[];
  series: SeriesSpec[];
  granularity: "daily" | "weekly";
  className?: string;
  valueFormat?: (n: number) => string;
  showLegend?: boolean;
}) {
  const config = configFor(series);
  const labels = Object.fromEntries(series.map((s) => [s.key, s.label]));
  const tooltip = <ChartTooltipContent formatter={tooltipRow(labels, valueFormat)} />;

  if (granularity === "weekly") {
    return (
      <ChartContainer config={config} className={cn("aspect-auto h-64 w-full", className)}>
        <BarChart data={points} margin={{ left: 0, right: 8, top: 8 }} barGap={2} barCategoryGap="30%">
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={(v: number) => formatCompact(v)} />
          <ChartTooltip cursor={{ fillOpacity: 0.5 }} content={tooltip} />
          {showLegend && series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
          {series.map((s) => (
            <Bar key={s.key} isAnimationActive={false} dataKey={s.key} fill={`var(--color-${s.key})`} radius={[4, 4, 0, 0]} maxBarSize={28} />
          ))}
        </BarChart>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer config={config} className={cn("aspect-auto h-64 w-full", className)}>
      <AreaChart data={points} margin={{ left: 0, right: 8, top: 8 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`var(--color-${s.key})`} stopOpacity={0.18} />
              <stop offset="100%" stopColor={`var(--color-${s.key})`} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} />
        <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={(v: number) => formatCompact(v)} />
        <ChartTooltip cursor content={tooltip} />
        {showLegend && series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
        {series.map((s) => (
          <Area
            key={s.key}
            dataKey={s.key}
            type="monotone"
            stroke={`var(--color-${s.key})`}
            strokeWidth={2}
            fill={`url(#fill-${s.key})`}
            dot={false}
            isAnimationActive={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}

export interface BarDatum {
  name: string;
  value: number;
  highlight?: boolean;
}

/**
 * Horizontal bar list (single series, value labelled at the bar tip).
 * Pass `highlight` on a datum to emphasise it — the rest recede.
 */
export function HBarChart({
  data,
  color = "var(--chart-1)",
  highlightColor = "var(--chart-5)",
  valueFormat = formatNumber,
  label,
  className,
  categoryWidth = 150,
}: {
  data: BarDatum[];
  color?: string;
  highlightColor?: string;
  valueFormat?: (n: number) => string;
  label: string;
  className?: string;
  categoryWidth?: number;
}) {
  const anyHighlight = data.some((d) => d.highlight);
  const config: ChartConfig = { value: { label, color } };
  return (
    <ChartContainer config={config} className={cn("aspect-auto w-full", className)} style={{ height: data.length * 36 + 12 }}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 56, top: 0, bottom: 0 }} barCategoryGap={8}>
        <XAxis type="number" hide domain={[0, "dataMax"]} />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={categoryWidth} tick={{ fontSize: 12 }} />
        <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent formatter={tooltipRow({ value: label }, valueFormat)} />} />
        <Bar dataKey="value" isAnimationActive={false} radius={[0, 4, 4, 0]} maxBarSize={20}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.highlight ? highlightColor : color} fillOpacity={anyHighlight && !d.highlight ? 0.45 : 1} />
          ))}
          <LabelList dataKey="value" position="right" offset={8} className="fill-foreground" fontSize={12} formatter={(v: unknown) => (typeof v === "number" ? valueFormat(v) : "")} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
