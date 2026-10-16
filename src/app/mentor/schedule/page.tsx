"use client";

import { useMemo, useState } from "react";
import { CalendarCog, CalendarPlus, CalendarRange, Repeat } from "lucide-react";
import { DEMO_TODAY } from "@/data/constants";
import { formatDate, formatTime, relativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  AddSlotDialog,
  AvailabilityGrid,
  describePattern,
  WeeklyPatternDialog,
  type WeeklyPattern,
} from "@/components/mentor/availability";
import { baseMentor, endTime, learnerOf, useScheduleItems, type ScheduleItem } from "@/components/mentor/mentor-data";
import { LegendSwatch, Panel } from "@/components/mentor/panel";
import { ScheduleDetailSheet, useDetailSheet } from "@/components/mentor/schedule-detail-sheet";
import { AutoStatus } from "@/components/shared/badges";
import { MonthCalendar, type CalendarEvent } from "@/components/shared/month-calendar";
import { PageHeader } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";

function toneFor(item: ScheduleItem): CalendarEvent["tone"] {
  if (item.kind === "booking") return item.status === "completed" ? "success" : "brand";
  if (item.session?.type === "cohort-class") return item.status === "completed" ? "muted" : "primary";
  return "warning";
}

export default function MentorSchedulePage() {
  const items = useScheduleItems();
  const detail = useDetailSheet();
  const [selectedDate, setSelectedDate] = useState(DEMO_TODAY);
  const [slotOpen, setSlotOpen] = useState(false);
  const [slotDate, setSlotDate] = useState<string>();
  const [patternOpen, setPatternOpen] = useState(false);
  const [pattern, setPattern] = useState<WeeklyPattern>(baseMentor.availability);

  const events: CalendarEvent[] = useMemo(
    () =>
      items.map((i) => ({
        id: i.id,
        date: i.date,
        time: i.time,
        title: i.kind === "booking" ? `${learnerOf(i.booking!.userId).firstName} · 1:1` : i.title.replace(/^Class (\d+): /, "Class $1 · "),
        tone: toneFor(i),
      })),
    [items],
  );

  const dayItems = items.filter((i) => i.date === selectedDate);
  const summary = describePattern(pattern);

  const openSlot = (date?: string) => {
    setSlotDate(date);
    setSlotOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Schedule & Availability"
        description="Your cohort classes, open sessions and 1:1 bookings in one place. Control exactly when learners can book you."
        actions={
          <>
            <Button variant="outline" className="h-10 px-4" onClick={() => setPatternOpen(true)}>
              <Repeat /> Edit weekly pattern
            </Button>
            <Button className="h-10 bg-brand px-4 text-brand-foreground hover:bg-brand/90" onClick={() => openSlot()}>
              <CalendarPlus /> Add extra slot
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-xs sm:flex-row sm:items-center">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <CalendarCog className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Weekly 1:1 pattern</p>
          <p className="text-sm text-muted-foreground">
            {summary.days} · {summary.times} IST
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setPatternOpen(true)}>
          Change
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3">
          <MonthCalendar
            events={events}
            selectedDate={selectedDate}
            onDayClick={setSelectedDate}
            onEventClick={(id) => {
              const item = items.find((i) => i.id === id);
              if (item) {
                setSelectedDate(item.date);
                detail.show({ kind: item.kind, id: item.id });
              }
            }}
          />
          <div className="flex flex-wrap gap-x-4 gap-y-2 px-1">
            <LegendSwatch className="border-primary/30 bg-secondary" label="Cohort class" />
            <LegendSwatch className="border-warning/30 bg-warning-soft" label="Workshop / doubt-clearing" />
            <LegendSwatch className="border-brand/30 bg-brand-soft" label="1:1 mentoring" />
            <LegendSwatch className="border-success/30 bg-success-soft" label="1:1 completed" />
            <LegendSwatch className="bg-muted" label="Past class" />
          </div>
        </div>

        <Panel
          title={formatDate(selectedDate, "EEEE, d MMMM")}
          description={`${relativeDay(selectedDate)} · ${dayItems.length} item${dayItems.length === 1 ? "" : "s"}`}
          icon={<CalendarRange className="mt-0.5 size-5 text-brand" />}
          bodyClassName="pt-3"
          className="self-start"
        >
          {dayItems.length === 0 ? (
            <div className="rounded-xl border border-dashed p-5 text-center">
              <p className="text-sm text-muted-foreground">Nothing scheduled on this day.</p>
              {selectedDate > DEMO_TODAY && (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => openSlot(selectedDate)}>
                  <CalendarPlus /> Open a slot
                </Button>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {dayItems.map((i) => {
                const learner = i.booking ? learnerOf(i.booking.userId) : undefined;
                return (
                  <li key={i.id}>
                    <button
                      type="button"
                      onClick={() => detail.show({ kind: i.kind, id: i.id })}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border border-l-4 p-3 text-left transition hover:shadow-md",
                        i.kind === "booking" ? "border-l-brand" : i.session?.type === "cohort-class" ? "border-l-primary" : "border-l-warning",
                      )}
                    >
                      {learner && <Portrait avatar={learner.avatar} name={learner.name} className="size-9" />}
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-muted-foreground tabular-nums">
                          {formatTime(i.time)} – {formatTime(endTime(i.time, i.durationMin))}
                        </span>
                        <span className="block text-sm font-medium">{i.kind === "booking" ? learner?.name : i.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{i.subtitle}</span>
                      </span>
                      <AutoStatus status={i.status} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="Availability — next 14 days"
        description="Click an open slot to block it, or a blocked slot to re-open it. Booked and teaching slots open their details."
        action={
          <Button variant="outline" size="sm" onClick={() => openSlot()} className="hidden sm:inline-flex">
            <CalendarPlus /> Add extra slot
          </Button>
        }
      >
        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2">
          <LegendSwatch className="border-brand/40 bg-brand-soft" label="Available" />
          <LegendSwatch className="border-primary/25 bg-secondary" label="Booked" />
          <LegendSwatch className="border-dashed border-primary/25 bg-secondary/50" label="Booked · pending checkout" />
          <LegendSwatch
            className="bg-muted bg-[repeating-linear-gradient(135deg,transparent_0_3px,var(--border)_3px_4px)]"
            label="Blocked by you"
          />
          <LegendSwatch className="border-warning/30 bg-warning-soft" label="Teaching" />
        </div>
        <AvailabilityGrid onOpenDetail={detail.show} onAddSlot={openSlot} />
      </Panel>

      <ScheduleDetailSheet target={detail.target} open={detail.open} onOpenChange={detail.setOpen} />
      <AddSlotDialog open={slotOpen} onOpenChange={setSlotOpen} defaultDate={slotDate} />
      <WeeklyPatternDialog open={patternOpen} onOpenChange={setPatternOpen} pattern={pattern} onApplied={setPattern} />
    </div>
  );
}
