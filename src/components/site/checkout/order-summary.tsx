"use client";

import { CalendarDays, CircleCheck, Clock, Package, Tag, Trash2, X } from "lucide-react";
import { getCourse } from "@/data";
import { FORMAT_META } from "@/data/constants";
import { formatDate, formatINR, formatTime } from "@/lib/format";
import type { PromoCode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FormatBadge } from "@/components/shared/badges";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PACKAGE_FORMAT_LABEL, type CheckoutLine } from "../commerce";

export interface Totals {
  price: number;
  credit: number;
  creditLabel?: string;
  discount: number;
  total: number;
}

export function LineArtwork({ line, className }: { line: CheckoutLine; className?: string }) {
  if (line.course) return <CourseThumbnail course={line.course} className={className} />;
  if (line.mentor) {
    return (
      <div className={cn("flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-brand-soft", className)}>
        <Portrait avatar={line.mentor.avatar} name={line.mentor.name} className="size-20 shadow-md ring-4 ring-white" rounded="xl" />
      </div>
    );
  }
  const courses = (line.pkg?.courseIds ?? []).map((id) => getCourse(id)).filter((c) => c !== undefined);
  return (
    <div className={cn("relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-navy to-primary", className)}>
      <div className="flex -space-x-6">
        {courses.slice(0, 3).map((c, i) => (
          <CourseThumbnail key={c.id} course={c} size="sm" className={cn("w-24 shadow-lg ring-2 ring-white/20", i === 1 && "z-10 -translate-y-2")} />
        ))}
      </div>
      {courses.length > 3 && (
        <span className="absolute right-3 bottom-3 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white">+{courses.length - 3} more</span>
      )}
      {courses.length === 0 && <Package className="size-10 text-white/80" />}
    </div>
  );
}

export function OrderSummary({
  line,
  totals,
  promo,
  promoInput,
  setPromoInput,
  onApply,
  onRemovePromo,
  promoError,
  onRemoveItem,
  locked,
}: {
  line: CheckoutLine;
  totals: Totals;
  promo?: PromoCode;
  promoInput: string;
  setPromoInput: (v: string) => void;
  onApply: () => void;
  onRemovePromo: () => void;
  promoError?: string;
  onRemoveItem: () => void;
  locked?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
      <div className="p-5">
        <p className="font-heading font-semibold">Order summary</p>
        <LineArtwork line={line} className="mt-4" />
        <div className="mt-4">
          <div className="flex flex-wrap gap-1.5">
            {line.kind === "package" && line.pkg ? (
              line.pkg.format === "bundle" ? (
                <span className="inline-flex h-6 items-center gap-1 rounded-full bg-warning-soft px-2.5 text-xs font-medium text-warning ring-1 ring-warning/25 ring-inset">
                  <Package className="size-3.5" /> {PACKAGE_FORMAT_LABEL(line.pkg)}
                </span>
              ) : (
                <FormatBadge format={line.pkg.format} showLevel />
              )
            ) : (
              line.format && <FormatBadge format={line.format} showLevel />
            )}
          </div>
          <p className="mt-2 font-heading text-lg leading-snug font-semibold">{line.title}</p>
          {line.course && <p className="text-sm text-muted-foreground">{line.course.subtitle}</p>}
          {line.mentor && (
            <p className="text-sm text-muted-foreground">
              with {line.mentor.name} · {line.mentor.title}
            </p>
          )}
          {line.pkg && <p className="text-sm text-muted-foreground">{line.pkg.description}</p>}
        </div>

        <ul className="mt-4 space-y-2 text-sm">
          {line.cohort && (
            <li className="flex gap-2.5">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-brand" />
              <span>
                <span className="font-medium">{line.cohort.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {line.cohort.scheduleLabel} · {formatDate(line.cohort.startDate, "d MMM")} – {formatDate(line.cohort.endDate, "d MMM")}
                </span>
              </span>
            </li>
          )}
          {line.format === "self-paced" && line.kind === "course" && (
            <li className="flex gap-2.5 text-muted-foreground">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand" /> Instant access · 12 months
            </li>
          )}
          {line.offer && (
            <>
              <li className="flex gap-2.5">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-brand" />
                {line.slot ? `${formatDate(line.slot.date, "EEE, d MMM yyyy")} · ${formatTime(line.slot.time)} IST` : "Slot to be chosen"}
              </li>
              <li className="flex gap-2.5 text-muted-foreground">
                <Clock className="mt-0.5 size-4 shrink-0" /> {line.offer.durationMin} min{line.offer.sessions > 1 ? ` · ${line.offer.sessions} sessions` : ""}
              </li>
            </>
          )}
          {line.pkg && (
            <>
              <li className="flex gap-2.5 text-muted-foreground">
                <Clock className="mt-0.5 size-4 shrink-0" /> Valid for {line.pkg.validity}
              </li>
              {line.pkg.courseIds.length <= 4 &&
                line.pkg.courseIds.map((id) => (
                  <li key={id} className="flex gap-2.5 text-muted-foreground">
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand" /> {getCourse(id)?.title}
                  </li>
                ))}
              {line.pkg.courseIds.length > 4 && (
                <li className="flex gap-2.5 text-muted-foreground">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand" /> {line.pkg.courseIds.length} courses included
                </li>
              )}
            </>
          )}
        </ul>
      </div>

      <div className="border-t p-5">
        {promo ? (
          <div className="flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2.5 text-sm">
            <Tag className="size-4 text-success" />
            <span className="min-w-0 flex-1">
              <span className="font-semibold text-success">{promo.code}</span>
              <span className="block truncate text-xs text-muted-foreground">{promo.description}</span>
            </span>
            {!locked && (
              <Button variant="ghost" size="icon-sm" aria-label="Remove promo code" onClick={onRemovePromo}>
                <X />
              </Button>
            )}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onApply();
            }}
          >
            <label htmlFor={`promo-${line.refId}`} className="text-sm font-medium">
              Promo code
            </label>
            <div className="mt-1.5 flex gap-2">
              <Input
                id={`promo-${line.refId}`}
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder="Enter code"
                aria-invalid={!!promoError}
                className="h-9 font-medium tracking-wide uppercase"
                disabled={locked}
              />
              <Button type="submit" variant="outline" className="h-9" disabled={locked}>
                Apply
              </Button>
            </div>
            {promoError ? (
              <p className="mt-1.5 text-xs text-destructive">{promoError}</p>
            ) : (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Try <span className="font-semibold">CDLFIRST20</span> or <span className="font-semibold">LIVE15</span>
              </p>
            )}
          </form>
        )}
      </div>

      <dl className="space-y-2 border-t p-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{line.kind === "course" && line.format ? FORMAT_META[line.format].label : "Price"}</dt>
          <dd className="tabular-nums">{formatINR(totals.price)}</dd>
        </div>
        {line.pkg?.compareAt && line.pkg.compareAt > line.pkg.price && (
          <div className="flex justify-between text-xs">
            <dt className="text-muted-foreground">Bought separately</dt>
            <dd className="text-muted-foreground line-through tabular-nums">{formatINR(line.pkg.compareAt)}</dd>
          </div>
        )}
        {totals.credit > 0 && (
          <div className="flex justify-between text-success">
            <dt>{totals.creditLabel}</dt>
            <dd className="tabular-nums">−{formatINR(totals.credit)}</dd>
          </div>
        )}
        {totals.discount > 0 && promo && (
          <div className="flex justify-between text-success">
            <dt>Promo ({promo.code})</dt>
            <dd className="tabular-nums">−{formatINR(totals.discount)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t pt-3">
          <dt className="font-semibold">Total</dt>
          <dd className="font-heading text-2xl font-bold tabular-nums">{formatINR(totals.total)}</dd>
        </div>
        <p className="text-[11px] text-muted-foreground">Inclusive of GST (illustrative). Prototype — no payment will be processed.</p>
      </dl>
      {!locked && (
        <div className="border-t px-5 py-3">
          <button type="button" onClick={onRemoveItem} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive">
            <Trash2 className="size-3.5" /> Remove from checkout
          </button>
        </div>
      )}
    </div>
  );
}
