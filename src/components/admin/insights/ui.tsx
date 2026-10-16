"use client";

import type { LucideIcon } from "lucide-react";
import { Lightbulb, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Card wrapper for a chart or analytics block. */
export function ChartCard({
  title,
  description,
  action,
  children,
  className,
  footer,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col rounded-2xl border bg-card p-5 shadow-xs", className)}>
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 className="font-heading text-[15px] font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </header>
      <div className="mt-4 min-w-0 flex-1">{children}</div>
      {footer && <div className="mt-4 border-t pt-3 text-xs text-muted-foreground">{footer}</div>}
    </section>
  );
}

/** Compact segmented control (single choice). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-lg bg-muted p-0.5 ring-1 ring-border/60 ring-inset", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-7 rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              active ? "bg-background text-foreground shadow-xs ring-1 ring-border" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Highlighted insight with an optional suggested fix and actions. */
export function InsightCallout({
  title,
  children,
  icon: Icon = Lightbulb,
  tone = "warning",
  actions,
  className,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  icon?: LucideIcon;
  tone?: "warning" | "brand" | "info" | "danger";
  actions?: React.ReactNode;
  className?: string;
}) {
  const toneClass = {
    warning: "border-warning/30 bg-warning-soft/60 [&_[data-icon]]:bg-warning-soft [&_[data-icon]]:text-warning",
    brand: "border-brand/25 bg-brand-soft/60 [&_[data-icon]]:bg-brand-soft [&_[data-icon]]:text-brand",
    info: "border-info/25 bg-info-soft/60 [&_[data-icon]]:bg-info-soft [&_[data-icon]]:text-info",
    danger: "border-destructive/25 bg-destructive/5 [&_[data-icon]]:bg-destructive/10 [&_[data-icon]]:text-destructive",
  }[tone];
  return (
    <div className={cn("rounded-xl border p-4", toneClass, className)}>
      <div className="flex gap-3">
        <span data-icon className="flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-current/10">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="font-heading text-sm font-semibold text-foreground">{title}</p>
          <div className="text-[13px] leading-relaxed text-foreground/80">{children}</div>
          {actions && <div className="flex flex-wrap gap-2 pt-1.5">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

/** Privacy banner shown on every anonymous-analytics screen. */
export function PrivacyNote({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border border-info/25 bg-info-soft/50 p-3.5 text-[13px]", className)}>
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-info" />
      <p className="text-foreground/80">
        <span className="font-semibold text-foreground">Privacy: anonymous sessions stay separate from learner profiles.</span>{" "}
        {compact
          ? "Session IDs are random and contact details are masked. No tracking scripts run in this prototype."
          : "Discovery sessions are identified only by a random session ID; phone numbers are masked and never joined to identified learner accounts. No cookies, pixels or third-party tracking scripts run in this prototype — every number here is synthetic."}
      </p>
    </div>
  );
}

/** Legend swatch + label used in custom chart legends. */
export function LegendKey({ color, label, kind = "box" }: { color: string; label: React.ReactNode; kind?: "box" | "line" }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("shrink-0", kind === "line" ? "h-0.5 w-3 rounded-full" : "size-2.5 rounded-[3px]")} style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

/** Tooltip row formatter for ChartTooltipContent that keeps the swatch + label and formats the value. */
export function tooltipRow(labels: Record<string, string>, fmt: (n: number) => string) {
  function renderRow(value: unknown, name: unknown, item: { color?: string; payload?: { fill?: string } }) {
    const key = String(name);
    const color = item.color ?? item.payload?.fill;
    return (
      <div className="flex w-full items-center gap-2">
        <span className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} />
        <span className="text-muted-foreground">{labels[key] ?? key}</span>
        <span className="ml-auto pl-3 font-mono font-medium text-foreground tabular-nums">{typeof value === "number" ? fmt(value) : String(value)}</span>
      </div>
    );
  }
  return renderRow;
}
