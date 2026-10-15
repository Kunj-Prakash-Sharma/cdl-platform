"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DEMO_TODAY } from "@/data/constants";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  title: string;
  tone?: "primary" | "brand" | "info" | "warning" | "muted" | "success";
}

const TONE: Record<NonNullable<CalendarEvent["tone"]>, string> = {
  primary: "bg-secondary text-primary border-primary/30",
  brand: "bg-brand-soft text-brand border-brand/30",
  info: "bg-info-soft text-info border-info/30",
  warning: "bg-warning-soft text-warning border-warning/30",
  success: "bg-success-soft text-success border-success/30",
  muted: "bg-muted text-muted-foreground border-border",
};

/**
 * Month grid with events. Click an event → onEventClick; click a day → onDayClick.
 * Starts on the demo month (Oct 2026) unless `initialMonth` is given.
 */
export function MonthCalendar({
  events,
  onEventClick,
  onDayClick,
  selectedDate,
  initialMonth = DEMO_TODAY,
  maxPerDay = 3,
  className,
  headerExtra,
}: {
  events: CalendarEvent[];
  onEventClick?: (id: string) => void;
  onDayClick?: (date: string) => void;
  selectedDate?: string;
  initialMonth?: string;
  maxPerDay?: number;
  className?: string;
  headerExtra?: React.ReactNode;
}) {
  const [month, setMonth] = useState(() => startOfMonth(parseISO(initialMonth)));
  const days = useMemo(
    () => eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) }),
    [month],
  );
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of [...events].sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""))) {
      map.set(e.date, [...(map.get(e.date) ?? []), e]);
    }
    return map;
  }, [events]);

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card", className)}>
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2.5 sm:px-4">
        <h3 className="font-heading text-base font-semibold">{format(month, "MMMM yyyy")}</h3>
        <div className="ml-auto flex items-center gap-1">
          {headerExtra}
          <Button variant="outline" size="sm" onClick={() => setMonth(startOfMonth(parseISO(DEMO_TODAY)))}>
            Today
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Previous month" onClick={() => setMonth((m) => addMonths(m, -1))}>
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Next month" onClick={() => setMonth((m) => addMonths(m, 1))}>
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b bg-muted/50 text-center text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-2">
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d[0]}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const list = byDate.get(key) ?? [];
          const inMonth = isSameMonth(day, month);
          const isToday = key === DEMO_TODAY;
          const isSelected = key === selectedDate;
          return (
            <div
              key={key}
              role={onDayClick ? "button" : undefined}
              tabIndex={onDayClick ? 0 : undefined}
              onClick={() => onDayClick?.(key)}
              onKeyDown={(e) => {
                if (onDayClick && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onDayClick(key);
                }
              }}
              className={cn(
                "min-h-14 border-r border-b p-1 text-left last:border-r-0 sm:min-h-24 sm:p-1.5 [&:nth-child(7n)]:border-r-0",
                !inMonth && "bg-muted/30 text-muted-foreground/60",
                onDayClick && "cursor-pointer hover:bg-accent/60",
                isSelected && "bg-accent ring-2 ring-primary/40 ring-inset",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                    isToday && "bg-primary text-primary-foreground",
                  )}
                >
                  {format(day, "d")}
                </span>
                {list.length > 0 && <span className="size-1.5 rounded-full bg-brand sm:hidden" />}
              </div>
              <div className="mt-1 hidden flex-col gap-1 sm:flex">
                {list.slice(0, maxPerDay).map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onEventClick?.(e.id);
                    }}
                    className={cn(
                      "truncate rounded-md border-l-2 px-1.5 py-0.5 text-left text-[11px] leading-tight font-medium transition hover:brightness-95",
                      TONE[e.tone ?? "primary"],
                    )}
                    title={`${e.time ? formatTime(e.time) + " · " : ""}${e.title}`}
                  >
                    {e.time && <span className="opacity-75">{formatTime(e.time).replace(":00", "")} </span>}
                    {e.title}
                  </button>
                ))}
                {list.length > maxPerDay && <span className="px-1 text-[11px] text-muted-foreground">+{list.length - maxPerDay} more</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
