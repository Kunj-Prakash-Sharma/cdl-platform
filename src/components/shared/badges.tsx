import { FlaskConical, CirclePlay, Radio, UserRound } from "lucide-react";
import { FORMAT_META } from "@/data/constants";
import type { LearningFormat } from "@/lib/types";
import { cn } from "@/lib/utils";

const FORMAT_STYLE: Record<LearningFormat, string> = {
  "self-paced": "bg-info-soft text-info ring-info/20",
  "live-cohort": "bg-brand-soft text-brand ring-brand/25",
  mentoring: "bg-secondary text-primary ring-primary/20",
};

const FORMAT_ICON = {
  "self-paced": CirclePlay,
  "live-cohort": Radio,
  mentoring: UserRound,
} as const;

/** Learning-level badge. Always shows the descriptive label; `showLevel` appends "· Level n". */
export function FormatBadge({
  format,
  showLevel,
  short,
  className,
}: {
  format: LearningFormat;
  showLevel?: boolean;
  short?: boolean;
  className?: string;
}) {
  const meta = FORMAT_META[format];
  const Icon = FORMAT_ICON[format];
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        FORMAT_STYLE[format],
        className,
      )}
    >
      <Icon className="size-3.5" />
      {short ? meta.short : meta.label}
      {showLevel && <span className="opacity-70">· Level {meta.level}</span>}
    </span>
  );
}

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "brand" | "primary";

const TONE: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground ring-border",
  success: "bg-success-soft text-success ring-success/20",
  warning: "bg-warning-soft text-warning ring-warning/25",
  danger: "bg-destructive/10 text-destructive ring-destructive/20",
  info: "bg-info-soft text-info ring-info/20",
  brand: "bg-brand-soft text-brand ring-brand/25",
  primary: "bg-secondary text-primary ring-primary/15",
};

/** Small status pill for tables and cards. */
export function StatusPill({ tone = "neutral", children, dot = true, className }: { tone?: Tone; children: React.ReactNode; dot?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        TONE[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Maps common status strings to tones so every portal colours them the same way. */
export function statusTone(status: string): Tone {
  const s = status.toLowerCase();
  if (/(paid|active|published|resolved|completed|confirmed|graded|converted|approved|done|live)/.test(s)) return "success";
  if (/(pending|review|in-progress|in progress|draft|onboarding|scheduled|requested|answered|submitted|upcoming|running|nurture)/.test(s)) return "warning";
  if (/(failed|cancelled|expired|rejected|changes|flagged|inactive|unanswered|high|refunded|paused|dropped)/.test(s)) return "danger";
  return "neutral";
}

export function AutoStatus({ status, label, className }: { status: string; label?: string; className?: string }) {
  const text = label ?? status.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  return (
    <StatusPill tone={statusTone(status)} className={className}>
      {text}
    </StatusPill>
  );
}

/** Marks illustrative/synthetic content so stakeholders never mistake it for real results. */
export function DemoBadge({ children = "Illustrative demo data", className }: { children?: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border border-dashed border-warning/50 bg-warning-soft px-2.5 text-[11px] font-medium text-warning",
        className,
      )}
    >
      <FlaskConical className="size-3.5" />
      {children}
    </span>
  );
}
