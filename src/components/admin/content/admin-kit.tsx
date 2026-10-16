"use client";

/**
 * Small building blocks shared by the admin console's content, commerce and engagement screens:
 * search + filter controls, table shells, confirm dialogs, form fields and notes.
 */

import { Info, Search, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/** Deterministic hash for synthetic-but-stable demo numbers (never use Math.random during render). */
export function hashNum(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function SearchField({
  value,
  onChange,
  placeholder = "Search…",
  label = "Search",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full sm:w-64", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 bg-background pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export interface FilterOption {
  value: string;
  label: string;
}

/** Select with an "All …" option whose value is "all". */
export function FilterSelect({
  value,
  onValueChange,
  options,
  allLabel,
  label,
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: FilterOption[];
  allLabel?: string;
  /** Accessible name */
  label: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger aria-label={label} className={cn("h-9! w-full bg-background sm:w-44", className)}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-80">
        {allLabel && <SelectItem value="all">{allLabel}</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Wrapping row of search + filters with an optional right-aligned slot. */
export function FilterBar({ children, right, className }: { children: React.ReactNode; right?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center", className)}>
      {children}
      {right && <div className="flex items-center gap-2 sm:ml-auto">{right}</div>}
    </div>
  );
}

/** "Showing 8 of 24 · Clear filters" */
export function ResultsMeta({ shown, total, noun = "items", onReset }: { shown: number; total: number; noun?: string; onReset?: () => void }) {
  return (
    <p className="text-xs text-muted-foreground">
      Showing <span className="font-medium text-foreground tabular-nums">{shown}</span> of <span className="tabular-nums">{total}</span> {noun}
      {onReset && shown !== total && (
        <>
          {" · "}
          <button type="button" onClick={onReset} className="font-medium text-primary hover:underline">
            Clear filters
          </button>
        </>
      )}
    </p>
  );
}

/** Bordered card wrapper for shadcn tables. */
export function TableCard({ children, className, footer }: { children: React.ReactNode; className?: string; footer?: React.ReactNode }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card shadow-xs", className)}>
      <div className="overflow-x-auto [&_th]:h-10 [&_th]:bg-muted/50 [&_th]:text-xs [&_th]:font-semibold [&_th]:tracking-wide [&_th]:text-muted-foreground [&_th]:uppercase [&_th:first-child]:pl-4 [&_td:first-child]:pl-4 [&_th:last-child]:pr-4 [&_td:last-child]:pr-4">
        {children}
      </div>
      {footer && <div className="border-t bg-muted/30 px-4 py-2.5">{footer}</div>}
    </div>
  );
}

export function TableEmptyRow({
  colSpan,
  title = "Nothing matches these filters",
  description = "Try a different search term or clear the filters.",
  icon: Icon = Search,
  action,
}: {
  colSpan: number;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="py-14 text-center">
        <div className="mx-auto flex max-w-sm flex-col items-center">
          <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted ring-1 ring-border">
            <Icon className="size-4.5 text-muted-foreground" />
          </span>
          <p className="font-heading text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm whitespace-normal text-muted-foreground">{description}</p>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </TableCell>
    </TableRow>
  );
}

/** Controlled confirm dialog for destructive or important actions. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            onClick={() => {
              onConfirm();
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Label + control + hint/error, with ids wired for accessibility. */
export function Field({
  id,
  label,
  error,
  hint,
  required,
  children,
  className,
}: {
  id: string;
  label: React.ReactNode;
  error?: string;
  hint?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-[13px]">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Subtle explanatory callout (e.g. "Transcoding is Phase 2"). */
export function InfoNote({
  icon: Icon = Info,
  children,
  tone = "info",
  className,
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
  tone?: "info" | "warning" | "brand" | "muted";
  className?: string;
}) {
  const toneClass = {
    info: "border-info/20 bg-info-soft/60 text-foreground [&>svg]:text-info",
    warning: "border-warning/25 bg-warning-soft/70 text-foreground [&>svg]:text-warning",
    brand: "border-brand/20 bg-brand-soft/70 text-foreground [&>svg]:text-brand",
    muted: "border-border bg-muted/50 text-muted-foreground [&>svg]:text-muted-foreground",
  }[tone];
  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13px] leading-relaxed", toneClass, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Thin usage bar: uses / max. Turns amber above 80% and red at 100%. */
export function UsageBar({ value, max, className, showLabel = true }: { value: number; max: number; className?: string; showLabel?: boolean }) {
  const p = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={cn("min-w-28", className)}>
      {showLabel && (
        <div className="mb-1 flex items-center justify-between text-xs tabular-nums">
          <span className="font-medium">
            {value.toLocaleString("en-IN")} / {max.toLocaleString("en-IN")}
          </span>
          <span className="text-muted-foreground">{p}%</span>
        </div>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", p >= 100 ? "bg-destructive" : p >= 80 ? "bg-warning" : "bg-brand")}
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  );
}

/** Label/value row for detail panels and receipts. */
export function DetailRow({ label, children, className }: { label: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-2 text-sm", className)}>
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium">{children}</span>
    </div>
  );
}

/** Section card used inside forms and detail pages. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  id,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("rounded-2xl border bg-card shadow-xs", className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="font-heading text-[15px] font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Icon-only "clear" helper used by some filter bars. */
export function ClearFiltersButton({ onClick, visible }: { onClick: () => void; visible: boolean }) {
  if (!visible) return null;
  return (
    <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={onClick}>
      <X className="size-3.5" />
      Clear
    </Button>
  );
}
