import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Standard header for portal pages: title, description and right-aligned actions. */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0 space-y-1.5">
        {eyebrow && <div className="text-xs font-semibold tracking-wide text-brand uppercase">{eyebrow}</div>}
        <h1 className="font-heading text-2xl font-semibold text-foreground md:text-[28px]">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-muted-foreground md:text-[15px]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Heading for a section inside a page. */
export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="font-heading text-base font-semibold md:text-lg">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** KPI tile. `trend` is a signed percentage string like "+12%" shown in green/red. */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  className,
  accent = "primary",
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: React.ReactNode;
  trend?: string;
  className?: string;
  accent?: "primary" | "brand" | "info" | "warning" | "success";
}) {
  const accentClass = {
    primary: "bg-secondary text-primary",
    brand: "bg-brand-soft text-brand",
    info: "bg-info-soft text-info",
    warning: "bg-warning-soft text-warning",
    success: "bg-success-soft text-success",
  }[accent];
  const positive = trend?.trim().startsWith("+");
  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-xs", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span className={cn("flex size-8 items-center justify-center rounded-lg", accentClass)}>
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <div className="mt-2 font-heading text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {(hint || trend) && (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          {trend && <span className={cn("font-semibold", positive ? "text-success" : "text-destructive")}>{trend}</span>}
          {hint}
        </p>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/40 px-6 py-12 text-center", className)}>
      {Icon && (
        <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-background shadow-xs ring-1 ring-border">
          <Icon className="size-5 text-muted-foreground" />
        </span>
      )}
      <p className="font-heading font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
