"use client";

import { useMemo, useState } from "react";
import { addDays, format, getDay, parseISO } from "date-fns";
import { CalendarPlus, Lock, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { DEMO_TODAY } from "@/data/constants";
import { formatDate, formatTime, relativeDay } from "@/lib/format";
import type { Booking, LiveSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useMentorSlots } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { baseMentor, learnerOf, MENTOR_ID, mySessions, nextDates, overlaps } from "./mentor-data";
import type { DetailTarget } from "./schedule-detail-sheet";

export type SlotState = "available" | "booked" | "held" | "blocked" | "teaching";

export interface GridCell {
  key: string;
  time: string;
  state: SlotState;
  label: string;
  inPattern: boolean;
  booking?: Booking;
  session?: LiveSession;
}

export const WEEKDAYS = [
  { value: 1, short: "Mon", label: "Monday" },
  { value: 2, short: "Tue", label: "Tuesday" },
  { value: 3, short: "Wed", label: "Wednesday" },
  { value: 4, short: "Thu", label: "Thursday" },
  { value: 5, short: "Fri", label: "Friday" },
  { value: 6, short: "Sat", label: "Saturday" },
  { value: 0, short: "Sun", label: "Sunday" },
];

/** 30-minute options from 7:00 AM to 10:30 PM. */
export const TIME_OPTIONS = Array.from({ length: 32 }, (_, i) => {
  const mins = 7 * 60 + i * 30;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
});

const SLOT_MIN = 60;

export const SLOT_STYLE: Record<SlotState, string> = {
  available: "border-brand/40 bg-brand-soft/50 hover:border-brand hover:bg-brand-soft",
  booked: "border-primary/25 bg-secondary hover:border-primary/50",
  held: "border-dashed border-primary/25 bg-secondary/50 hover:border-primary/40",
  blocked:
    "border-border bg-muted text-muted-foreground bg-[repeating-linear-gradient(135deg,transparent_0_6px,color-mix(in_oklch,var(--border),transparent_30%)_6px_8px)] hover:border-foreground/30",
  teaching: "border-warning/30 bg-warning-soft hover:border-warning/60",
};

export const SLOT_LABEL_TONE: Record<SlotState, string> = {
  available: "text-brand",
  booked: "text-primary",
  held: "text-primary/80",
  blocked: "text-muted-foreground",
  teaching: "text-warning",
};

/** Builds the 14-day availability grid: pattern slots + extra slots + teaching blocks, each with a state. */
export function useAvailabilityGrid(days = 14) {
  const slotDays = useMentorSlots(baseMentor, days);
  const bookings = useDemoStore((s) => s.bookings);
  const blocked = useDemoStore((s) => s.blockedSlots[MENTOR_ID]);

  return useMemo(() => {
    return nextDates(days).map((date) => {
      const day = slotDays.find((d) => d.date === date);
      const inPatternDay = baseMentor.availability.weekdays.includes(getDay(parseISO(date)));
      const sessions = mySessions.filter((s) => s.date === date && s.status !== "cancelled");
      const cells: GridCell[] = (day?.slots ?? []).map((slot) => {
        const key = `${date}|${slot.time}`;
        const inPattern = inPatternDay && baseMentor.availability.times.includes(slot.time);
        const booking = bookings.find((b) => b.mentorId === MENTOR_ID && b.date === date && b.time === slot.time && b.status !== "cancelled");
        const session = sessions.find((s) => overlaps(s.time, s.durationMin, slot.time, SLOT_MIN));
        if (booking) return { key, time: slot.time, state: "booked", label: `Booked · ${learnerOf(booking.userId).firstName}`, inPattern, booking };
        if (session) return { key, time: slot.time, state: "teaching", label: teachLabel(session), inPattern, session };
        if (blocked?.includes(key)) return { key, time: slot.time, state: "blocked", label: "Blocked", inPattern };
        if (slot.available) return { key, time: slot.time, state: "available", label: "Available", inPattern };
        return { key, time: slot.time, state: "held", label: "Booked · pending", inPattern };
      });
      // Live sessions that don't overlap a bookable slot still belong in the day view.
      for (const s of sessions) {
        if (!cells.some((c) => c.session?.id === s.id)) {
          cells.push({ key: `ses|${s.id}`, time: s.time, state: "teaching", label: teachLabel(s), inPattern: false, session: s });
        }
      }
      cells.sort((a, b) => a.time.localeCompare(b.time));
      return { date, cells };
    });
  }, [slotDays, bookings, blocked, days]);
}

export function AvailabilityGrid({ onOpenDetail, onAddSlot }: { onOpenDetail: (t: DetailTarget) => void; onAddSlot: (date: string) => void }) {
  const grid = useAvailabilityGrid(14);
  const toggleMentorSlot = useDemoStore((s) => s.toggleMentorSlot);

  const counts = useMemo(() => {
    const c: Record<SlotState, number> = { available: 0, booked: 0, held: 0, blocked: 0, teaching: 0 };
    grid.forEach((d) => d.cells.forEach((cell) => c[cell.state]++));
    return c;
  }, [grid]);

  const onCell = (cell: GridCell, date: string) => {
    if (cell.state === "booked" && cell.booking) return onOpenDetail({ kind: "booking", id: cell.booking.id });
    if (cell.state === "teaching" && cell.session) return onOpenDetail({ kind: "session", id: cell.session.id });
    if (cell.state === "held")
      return toast.info("Held for a learner checkout", {
        description: "A learner is completing a booking for this slot (demo data). It confirms automatically.",
      });
    const when = `${formatDate(date, "EEE, d MMM")} · ${formatTime(cell.time)}`;
    if (cell.state === "available") {
      toggleMentorSlot(MENTOR_ID, cell.key, false);
      toast.success(cell.inPattern ? "Slot blocked" : "Extra slot removed", {
        description: `${when} is no longer bookable by learners.`,
        action: { label: "Undo", onClick: () => toggleMentorSlot(MENTOR_ID, cell.key, true) },
      });
    } else if (cell.state === "blocked") {
      toggleMentorSlot(MENTOR_ID, cell.key, true);
      toast.success("Slot re-opened", { description: `${when} is bookable again.` });
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{counts.available}</span> open ·{" "}
        <span className="font-semibold text-foreground">{counts.booked + counts.held}</span> booked ·{" "}
        <span className="font-semibold text-foreground">{counts.blocked}</span> blocked ·{" "}
        <span className="font-semibold text-foreground">{counts.teaching}</span> teaching blocks in the next 14 days
      </p>
      <div className="divide-y overflow-hidden rounded-xl border">
        {grid.map(({ date, cells }) => {
          const weekend = [0, 6].includes(getDay(parseISO(date)));
          return (
            <div key={date} className={cn("flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-4", weekend && "bg-muted/30")}>
              <div className="flex items-center justify-between sm:w-32 sm:shrink-0 sm:flex-col sm:items-start sm:justify-start">
                <div>
                  <p className="text-sm font-semibold">{formatDate(date, "EEE, d MMM")}</p>
                  <p className="text-[11px] text-muted-foreground">{relativeDay(date)}</p>
                </div>
                <Button variant="ghost" size="xs" className="text-muted-foreground sm:hidden" onClick={() => onAddSlot(date)}>
                  <Plus /> Add slot
                </Button>
              </div>
              <div className="flex flex-1 flex-wrap items-center gap-2">
                {cells.length === 0 && <span className="text-xs text-muted-foreground">Not available</span>}
                {cells.map((cell) => (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => onCell(cell, date)}
                    title={
                      cell.state === "available"
                        ? "Click to block this slot"
                        : cell.state === "blocked"
                          ? "Click to re-open this slot"
                          : cell.state === "held"
                            ? "Held for a learner checkout"
                            : "Click for details"
                    }
                    className={cn(
                      "group/slot flex min-w-[118px] flex-col rounded-lg border px-2.5 py-1.5 text-left transition focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                      SLOT_STYLE[cell.state],
                    )}
                  >
                    <span className={cn("text-sm font-semibold tabular-nums", cell.state === "blocked" && "line-through")}>{formatTime(cell.time)}</span>
                    <span className={cn("flex items-center gap-1 truncate text-[11px] font-medium", SLOT_LABEL_TONE[cell.state])}>
                      {cell.state === "blocked" && <Lock className="size-3" />}
                      <span className="truncate group-hover/slot:hidden">{cell.label}</span>
                      <span className="hidden truncate group-hover/slot:inline">
                        {cell.state === "available" ? "Block slot" : cell.state === "blocked" ? "Re-open" : cell.label}
                      </span>
                    </span>
                  </button>
                ))}
                <Button variant="ghost" size="sm" className="hidden text-muted-foreground sm:inline-flex" onClick={() => onAddSlot(date)}>
                  <Plus /> Add
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Add extra slot
// ---------------------------------------------------------------------------------------------

export function AddSlotDialog({ open, onOpenChange, defaultDate }: { open: boolean; onOpenChange: (o: boolean) => void; defaultDate?: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <AddSlotForm key={defaultDate ?? "none"} defaultDate={defaultDate} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function AddSlotForm({ defaultDate, onClose }: { defaultDate?: string; onClose: () => void }) {
  const dates = nextDates(14);
  const grid = useAvailabilityGrid(14);
  const toggleMentorSlot = useDemoStore((s) => s.toggleMentorSlot);
  const [date, setDate] = useState(defaultDate && dates.includes(defaultDate) ? defaultDate : dates[0]);
  const [time, setTime] = useState("19:30");

  const day = grid.find((d) => d.date === date);
  const existing = day?.cells.find((c) => c.time === time && c.state !== "blocked" && c.state !== "teaching");
  const clash = mySessions.find((s) => s.date === date && s.status !== "cancelled" && overlaps(s.time, s.durationMin, time, SLOT_MIN));
  const error = existing
    ? `You already have a slot at ${formatTime(time)} on this day.`
    : clash
      ? `Clashes with ${clash.title} (${formatTime(clash.time)}).`
      : undefined;

  const save = () => {
    if (error) return;
    toggleMentorSlot(MENTOR_ID, `${date}|${time}`, true);
    toast.success("Extra slot added", { description: `${formatDate(date, "EEE, d MMM")} at ${formatTime(time)} is now bookable on your public profile.` });
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add an extra slot</DialogTitle>
        <DialogDescription>Open a one-off 1:1 slot outside your weekly pattern. Learners can book it right away.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="slot-date">Date</Label>
          <Select value={date} onValueChange={setDate}>
            <SelectTrigger id="slot-date" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dates.map((d) => (
                <SelectItem key={d} value={d}>
                  {formatDate(d, "EEE, d MMM")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slot-time">Start time (IST)</Label>
          <Select value={time} onValueChange={setTime}>
            <SelectTrigger id="slot-time" className="w-full" aria-invalid={Boolean(error)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {TIME_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {formatTime(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Slots are 60 minutes. Session length depends on the offer the learner picks.</p>
      )}
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save} disabled={Boolean(error)} className="bg-brand text-brand-foreground hover:bg-brand/90">
          <CalendarPlus /> Add slot
        </Button>
      </DialogFooter>
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Weekly pattern
// ---------------------------------------------------------------------------------------------

export interface WeeklyPattern {
  weekdays: number[];
  times: string[];
}

export function describePattern(p: WeeklyPattern) {
  const days = WEEKDAYS.filter((d) => p.weekdays.includes(d.value)).map((d) => d.short);
  return { days: days.join(", ") || "No days", times: [...p.times].sort().map(formatTime).join(" · ") || "No times" };
}

export function WeeklyPatternDialog({
  open,
  onOpenChange,
  pattern,
  onApplied,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pattern: WeeklyPattern;
  onApplied: (p: WeeklyPattern) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && <PatternForm pattern={pattern} onApplied={onApplied} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function PatternForm({ pattern, onApplied, onClose }: { pattern: WeeklyPattern; onApplied: (p: WeeklyPattern) => void; onClose: () => void }) {
  const toggleMentorSlot = useDemoStore((s) => s.toggleMentorSlot);
  const [weekdays, setWeekdays] = useState<number[]>(pattern.weekdays);
  const [times, setTimes] = useState<string[]>(pattern.times);
  const [newTime, setNewTime] = useState("20:00");

  const error = !weekdays.length ? "Pick at least one weekday." : !times.length ? "Add at least one start time." : undefined;

  const apply = () => {
    if (error) return;
    const s = useDemoStore.getState();
    const extras = s.extraSlots[MENTOR_ID] ?? [];
    const blocked = s.blockedSlots[MENTOR_ID] ?? [];
    let opened = 0;
    let closed = 0;
    let kept = 0;
    for (let i = 1; i <= 21; i++) {
      const day = addDays(parseISO(DEMO_TODAY), i);
      const date = format(day, "yyyy-MM-dd");
      const wd = getDay(day);
      const original = baseMentor.availability.weekdays.includes(wd) ? baseMentor.availability.times : [];
      const desired = weekdays.includes(wd) ? times : [];
      const dayExtras = extras.filter((k) => k.startsWith(`${date}|`)).map((k) => k.split("|")[1]);
      for (const t of new Set([...original, ...desired, ...dayExtras])) {
        const key = `${date}|${t}`;
        const hasBooking = s.bookings.some((b) => b.mentorId === MENTOR_ID && b.date === date && b.time === t && b.status !== "cancelled");
        const want = desired.includes(t);
        const isOpen = (original.includes(t) && !blocked.includes(key)) || dayExtras.includes(t);
        if (hasBooking) {
          if (!want) kept++;
          continue;
        }
        if (want && !isOpen) {
          toggleMentorSlot(MENTOR_ID, key, true);
          opened++;
        } else if (!want && isOpen) {
          toggleMentorSlot(MENTOR_ID, key, false);
          closed++;
        }
      }
    }
    onApplied({ weekdays, times: [...times].sort() });
    toast.success("Weekly pattern applied to the next 3 weeks", {
      description: `${opened} slot${opened === 1 ? "" : "s"} opened · ${closed} closed${kept ? ` · ${kept} booked session${kept === 1 ? "" : "s"} kept` : ""}.`,
    });
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit weekly pattern</DialogTitle>
        <DialogDescription>Choose the days and start times you take 1:1 sessions. Applies to the next 3 weeks — booked sessions are never moved.</DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <Label>Weekdays</Label>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((d) => {
            const on = weekdays.includes(d.value);
            return (
              <button
                key={d.value}
                type="button"
                aria-pressed={on}
                aria-label={d.label}
                onClick={() => setWeekdays((w) => (on ? w.filter((x) => x !== d.value) : [...w, d.value]))}
                className={cn(
                  "h-10 rounded-lg border text-xs font-semibold transition focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  on ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                {d.short}
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pattern-time">Start times</Label>
        <div className="flex flex-wrap gap-1.5">
          {[...times].sort().map((t) => (
            <span key={t} className="inline-flex h-8 items-center gap-1 rounded-full border bg-brand-soft/50 pr-1 pl-3 text-sm font-medium">
              {formatTime(t)}
              <Button variant="ghost" size="icon-xs" aria-label={`Remove ${formatTime(t)}`} onClick={() => setTimes((list) => list.filter((x) => x !== t))}>
                <X />
              </Button>
            </span>
          ))}
          {!times.length && <span className="text-sm text-muted-foreground">No times yet</span>}
        </div>
        <div className="flex gap-2">
          <Select value={newTime} onValueChange={setNewTime}>
            <SelectTrigger id="pattern-time" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {TIME_OPTIONS.map((t) => (
                <SelectItem key={t} value={t} disabled={times.includes(t)}>
                  {formatTime(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => !times.includes(newTime) && setTimes((list) => [...list, newTime])} disabled={times.includes(newTime)}>
            <Plus /> Add time
          </Button>
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={apply} disabled={Boolean(error)}>
          Apply to next 3 weeks
        </Button>
      </DialogFooter>
    </>
  );
}

function teachLabel(s: LiveSession) {
  if (s.type === "cohort-class") return `Teaching · ${s.title.split(":")[0]}`;
  return s.type === "workshop" ? "Teaching · Workshop" : s.type === "webinar" ? "Teaching · Webinar" : "Teaching · Doubt hour";
}
