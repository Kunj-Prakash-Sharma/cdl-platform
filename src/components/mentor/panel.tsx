import { cn } from "@/lib/utils";

/** Card section used across the mentor portal: header with optional action + body. */
export function Panel({
  title,
  description,
  action,
  icon,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("flex flex-col rounded-2xl border bg-card shadow-xs", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="flex min-w-0 items-start gap-2.5">
            {icon}
            <div className="min-w-0">
              {title && <h2 className="font-heading text-[15px] font-semibold md:text-base">{title}</h2>}
              {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
            </div>
          </div>
          {action && <div className="flex shrink-0 items-center gap-1">{action}</div>}
        </div>
      )}
      <div className={cn("flex-1 p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Label/value row for detail drawers. */
export function DetailRow({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-[120px_1fr] items-start gap-3 py-2 text-sm", className)}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium text-foreground">{children}</dd>
    </div>
  );
}

/** Small coloured square used in legends. */
export function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("size-3 rounded-[4px] border", className)} aria-hidden="true" />
      {label}
    </span>
  );
}
