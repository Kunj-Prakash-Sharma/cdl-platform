import { format, parseISO } from "date-fns";
import { STAGE_META } from "@/data/constants";
import type { LearnerStage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SESSION_TYPE_META, type SessionType } from "./engagement-utils";

export function SessionTypeBadge({ type, className }: { type: SessionType; className?: string }) {
  const meta = SESSION_TYPE_META[type];
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        meta.className,
        className,
      )}
    >
      <meta.icon className="size-3.5" />
      {meta.label}
    </span>
  );
}

/** Calendar-style date tile: THU / 15 / OCT */
export function DateTile({ date, highlight, className }: { date: string; highlight?: boolean; className?: string }) {
  const d = parseISO(date);
  return (
    <div
      className={cn(
        "flex w-14 shrink-0 flex-col items-center justify-center rounded-xl border py-2 text-center",
        highlight ? "border-brand/40 bg-brand text-brand-foreground" : "bg-muted/60",
        className,
      )}
    >
      <span className={cn("text-[10px] font-semibold tracking-wider uppercase", highlight ? "text-brand-foreground/85" : "text-muted-foreground")}>
        {format(d, "EEE")}
      </span>
      <span className="font-heading text-xl leading-none font-semibold">{format(d, "d")}</span>
      <span className={cn("text-[10px] font-medium uppercase", highlight ? "text-brand-foreground/85" : "text-muted-foreground")}>{format(d, "MMM")}</span>
    </div>
  );
}

export function audienceLabel(audience: LearnerStage[]) {
  return audience.map((a) => STAGE_META[a].plural).join(" · ");
}

/** Seats bar: "12 of 25 seats left" with a thin meter. */
export function SeatsMeter({ taken, capacity, className }: { taken: number; capacity: number; className?: string }) {
  const left = capacity - taken;
  const ratio = Math.min(1, taken / capacity);
  const tone = left <= 0 ? "bg-destructive" : ratio >= 0.85 ? "bg-warning" : "bg-brand";
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className={cn("font-medium", left <= 0 ? "text-destructive" : ratio >= 0.85 ? "text-warning" : "text-foreground")}>
          {left <= 0 ? "Full — waitlist open" : `${left} of ${capacity} seats left`}
        </span>
        <span className="text-muted-foreground tabular-nums">{Math.round(ratio * 100)}% booked</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}
