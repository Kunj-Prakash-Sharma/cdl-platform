"use client";

import { getAssessment } from "@/data";
import type { AssessmentResult } from "@/lib/types";
import { cn } from "@/lib/utils";

const GROUP_LABEL = { interest: "Interests", trait: "Work style & personality", skill: "Skills" } as const;

/** Horizontal score bars per dimension group, with an optional marker for a previous attempt. */
export function DimensionBars({
  result,
  previous,
  groups = ["interest", "trait", "skill"],
  className,
  limit,
  compact,
}: {
  result: AssessmentResult;
  previous?: AssessmentResult;
  groups?: ("interest" | "trait" | "skill")[];
  className?: string;
  limit?: number;
  compact?: boolean;
}) {
  const assessment = getAssessment(result.assessmentId);
  if (!assessment) return null;
  const dims = Object.entries(assessment.dimensions);
  return (
    <div className={cn("space-y-5", className)}>
      {groups.map((g) => {
        const rows = dims
          .filter(([, d]) => d.group === g)
          .map(([key, d]) => ({ key, label: d.label, value: result.scores[key] ?? 0, prev: previous?.scores[key] }))
          .sort((a, b) => b.value - a.value)
          .slice(0, limit);
        if (!rows.length) return null;
        return (
          <div key={g}>
            {groups.length > 1 && <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{GROUP_LABEL[g]}</p>}
            <ul className="space-y-2">
              {rows.map((r, i) => {
                const delta = r.prev !== undefined ? r.value - r.prev : undefined;
                return (
                  <li key={r.key} className={cn("grid items-center gap-x-3", compact ? "grid-cols-[minmax(0,1fr)_auto] gap-y-1.5 [&>*:nth-child(2)]:col-span-2 [&>*:nth-child(2)]:row-start-2 [&>*:nth-child(3)]:col-start-2 [&>*:nth-child(3)]:row-start-1" : "grid-cols-[minmax(0,9rem)_minmax(0,1fr)_4.5rem] sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_5rem]")}>
                    <span className="truncate text-sm" title={r.label}>
                      {r.label}
                    </span>
                    <span className="relative h-2.5 rounded-full bg-muted">
                      <span
                        className={cn("absolute inset-y-0 left-0 rounded-full", i === 0 && g === "interest" ? "bg-primary" : "bg-brand")}
                        style={{ width: `${r.value}%` }}
                      />
                      {r.prev !== undefined && (
                        <span className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-foreground/45" style={{ left: `calc(${r.prev}% - 1px)` }} title={`Previous: ${r.prev}`} />
                      )}
                    </span>
                    <span className="flex items-baseline justify-end gap-1.5 text-sm tabular-nums">
                      <span className="font-semibold">{r.value}</span>
                      {delta !== undefined && delta !== 0 && (
                        <span className={cn("text-[11px] font-medium", delta > 0 ? "text-success" : "text-muted-foreground")}>
                          {delta > 0 ? "+" : "−"}
                          {Math.abs(delta)}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
