"use client";

import { ArrowDown, TriangleAlert } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { biggestDropIndex, fmtPct, type FunnelStageRow } from "./metrics";
import { LegendKey } from "./ui";

/**
 * Horizontal funnel: one bar per stage scaled to the first stage. The rose wash on each bar shows the volume
 * lost since the previous stage, so the leak is visible without reading numbers.
 */
export function FunnelBars({ rows, compact, className }: { rows: FunnelStageRow[]; compact?: boolean; className?: string }) {
  const worst = biggestDropIndex(rows);

  if (compact) {
    return (
      <ol className={cn("space-y-3", className)}>
        {rows.map((r, i) => {
          const prevOfTop = i === 0 ? r.ofTop : rows[i - 1].ofTop;
          return (
            <li key={r.key}>
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="truncate font-medium">{r.label}</span>
                <span className="shrink-0 tabular-nums">
                  <span className="font-semibold">{formatNumber(r.value)}</span>
                  {i > 0 && (
                    <span className={cn("ml-2 text-xs", i === worst ? "font-semibold text-destructive" : "text-muted-foreground")}>{fmtPct(r.stepConversion)}</span>
                  )}
                </span>
              </div>
              <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                {i > 0 && (
                  <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${prevOfTop}%`, backgroundColor: "var(--chart-5)", opacity: 0.22 }} />
                )}
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.max(r.ofTop, 0.8)}%`, backgroundColor: "var(--chart-1)" }} />
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <LegendKey color="var(--chart-1)" label="Reached this stage" />
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: "var(--chart-5)", opacity: 0.35 }} />
          Lost since previous stage
        </span>
      </div>
      <ol>
        {rows.map((r, i) => {
          const prevOfTop = i === 0 ? r.ofTop : rows[i - 1].ofTop;
          const isWorst = i === worst;
          return (
            <li key={r.key}>
              {i > 0 && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1.5 pl-3 text-xs whitespace-nowrap sm:pl-[calc(13rem+0.75rem)]">
                  <ArrowDown className={cn("size-3.5", isWorst ? "text-destructive" : "text-muted-foreground/70")} />
                  <span className="text-muted-foreground tabular-nums">
                    <span className="font-medium text-foreground">{fmtPct(r.stepConversion)}</span> continued
                  </span>
                  <span className="text-muted-foreground/60">·</span>
                  <span className={cn("tabular-nums", isWorst ? "font-semibold text-destructive" : "text-muted-foreground")}>{fmtPct(r.dropOff)} dropped off</span>
                  {isWorst && (
                    <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                      <TriangleAlert className="size-3" /> Biggest drop
                    </span>
                  )}
                </div>
              )}
              <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[13rem_1fr_7.5rem]">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-primary tabular-nums">{i + 1}</span>
                  <span className="truncate text-sm font-medium">{r.label}</span>
                </div>
                <div className="text-right sm:order-last">
                  <div className="text-sm font-semibold tabular-nums">{formatNumber(r.value)}</div>
                  <div className="text-[11px] text-muted-foreground tabular-nums">{i === 0 ? "100% of visitors" : `${r.ofTop < 10 ? r.ofTop.toFixed(2) : r.ofTop.toFixed(1)}% of visitors`}</div>
                </div>
                <div className="relative col-span-2 h-8 overflow-hidden rounded-lg bg-muted sm:col-span-1" role="img" aria-label={`${r.label}: ${formatNumber(r.value)}`}>
                  {i > 0 && (
                    <div className="absolute inset-y-0 left-0 rounded-lg" style={{ width: `${prevOfTop}%`, backgroundColor: "var(--chart-5)", opacity: isWorst ? 0.3 : 0.16 }} />
                  )}
                  <div className="absolute inset-y-0 left-0 rounded-lg" style={{ width: `${Math.max(r.ofTop, 0.6)}%`, backgroundColor: "var(--chart-1)" }} />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
