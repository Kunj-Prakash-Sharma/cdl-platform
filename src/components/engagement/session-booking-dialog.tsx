"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ArrowLeft, BookOpen, CalendarCheck, CalendarDays, CalendarPlus, Check, Clock, IndianRupee, ListPlus, PartyPopper, Users } from "lucide-react";
import { toast } from "sonner";
import { getCourse, getMentor } from "@/data";
import { formatDate, formatDuration, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useCurrentUser } from "@/store/hooks";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CALENDAR_TOAST, endTime, SESSION_TYPE_META, type SessionType } from "./engagement-utils";
import { audienceLabel } from "./session-bits";
import type { SessionEntry } from "./use-sessions";

const STEPS = ["Topic", "Date", "Time", "Review", "Confirmed"] as const;
const BOOKABLE_TYPES: SessionType[] = ["doubt-clearing", "workshop", "webinar"];

/**
 * Stepper to book a seat in an open live session (doubt-clearing hour, workshop or webinar):
 * topic → date → time slot → review → confirmation. Remount (via `key`) to reset.
 */
export function SessionBookingDialog({
  open,
  onOpenChange,
  bookable,
  initialSessionId,
  onViewUpcoming,
  onWaitlist,
  isWaitlisted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookable: SessionEntry[];
  initialSessionId?: string;
  onViewUpcoming?: () => void;
  onWaitlist: (sessionId: string) => void;
  isWaitlisted: (sessionId: string) => boolean;
}) {
  const { userId } = useCurrentUser();
  const addBooking = useDemoStore((s) => s.addBooking);
  const addNotification = useDemoStore((s) => s.addNotification);

  const initial = bookable.find((e) => e.session.id === initialSessionId);
  const [step, setStep] = useState(initial ? 3 : 0);
  const [type, setType] = useState<SessionType | undefined>(initial?.session.type);
  const [courseId, setCourseId] = useState<string>("all");
  const [date, setDate] = useState<string | undefined>(initial?.session.date);
  const [sessionId, setSessionId] = useState<string | undefined>(initial?.session.id);
  const [note, setNote] = useState("");
  const [bookedId, setBookedId] = useState<string>();

  const courses = useMemo(() => {
    const ids = Array.from(new Set(bookable.map((e) => e.session.courseId)));
    return ids.map((id) => getCourse(id)).filter((c) => Boolean(c)) as NonNullable<ReturnType<typeof getCourse>>[];
  }, [bookable]);

  const pool = useMemo(() => bookable.filter((e) => courseId === "all" || e.session.courseId === courseId), [bookable, courseId]);
  const ofType = useMemo(() => pool.filter((e) => e.session.type === type), [pool, type]);
  const dates = useMemo(() => {
    const map = new Map<string, SessionEntry[]>();
    for (const e of ofType) map.set(e.session.date, [...(map.get(e.session.date) ?? []), e]);
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [ofType]);
  const slots = useMemo(() => ofType.filter((e) => e.session.date === date).sort((a, b) => a.session.time.localeCompare(b.session.time)), [ofType, date]);
  const selected = bookable.find((e) => e.session.id === sessionId);
  const done = step === 4;

  const confirm = () => {
    if (!selected) return;
    const s = selected.session;
    const booking = addBooking({
      userId,
      kind: "live-session",
      mentorId: s.mentorId,
      sessionId: s.id,
      date: s.date,
      time: s.time,
      durationMin: s.durationMin,
      topic: note.trim() || undefined,
    });
    addNotification({
      kind: "session",
      title: "Live session booked",
      body: `${s.title} · ${formatDate(s.date, "EEE, d MMM")} at ${formatTime(s.time)} IST.`,
      href: "/dashboard/sessions",
    });
    toast.success("Seat booked", { description: `${s.title} — ${formatDate(s.date, "EEE, d MMM")} at ${formatTime(s.time)}.` });
    setBookedId(booking.id);
    setStep(4);
  };

  const canContinue = (step === 0 && type) || (step === 1 && date) || (step === 2 && selected && !selected.full && !selected.booking);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Book a live session</DialogTitle>
          <DialogDescription>Doubt-clearing hours, workshops and webinars · all times in IST</DialogDescription>
        </DialogHeader>

        <ol className="flex items-center gap-2 text-xs" aria-label="Booking steps">
          {STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                  (i < step || done) && "border-brand bg-brand text-brand-foreground",
                  i === step && !done && "border-primary bg-primary text-primary-foreground",
                  i > step && "text-muted-foreground",
                )}
                aria-current={i === step ? "step" : undefined}
              >
                {i < step || done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={cn("hidden font-medium md:inline", i > step && "text-muted-foreground")}>{label}</span>
              {i < STEPS.length - 1 && <span className="h-px min-w-2 flex-1 bg-border" />}
            </li>
          ))}
        </ol>

        <div className="min-h-64">
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="booking-programme" className="text-sm text-muted-foreground">
                  What would you like to join?
                </Label>
                <Select value={courseId} onValueChange={(v) => setCourseId(v)}>
                  <SelectTrigger id="booking-programme" className="w-56" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any programme</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                {BOOKABLE_TYPES.map((t) => {
                  const meta = SESSION_TYPE_META[t];
                  const list = pool.filter((e) => e.session.type === t);
                  const next = list[0];
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={!list.length}
                      onClick={() => {
                        setType(t);
                        setDate(undefined);
                        setSessionId(undefined);
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
                        type === t && "border-primary bg-accent/60 ring-1 ring-primary/30",
                      )}
                    >
                      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset", meta.className)}>
                        <meta.icon className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-medium">{meta.plural}</span>
                          <span className="text-xs whitespace-nowrap text-muted-foreground">{list.length} upcoming</span>
                        </span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">{meta.blurb}</span>
                        {next && (
                          <span className="mt-1.5 block text-xs text-muted-foreground">
                            Next: <span className="font-medium text-foreground">{next.session.title}</span> · {formatDate(next.session.date, "EEE d MMM")}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 1 && type && (
            <div>
              <p className="mb-3 text-sm text-muted-foreground">
                Dates with upcoming {SESSION_TYPE_META[type].plural.toLowerCase()}
                {courseId !== "all" && <> for {getCourse(courseId)?.title}</>}
              </p>
              {dates.length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No upcoming dates for this topic yet.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {dates.map(([d, list]) => {
                    const available = list.filter((e) => !e.full).length;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setDate(d);
                          setSessionId(list.length === 1 ? list[0].session.id : undefined);
                        }}
                        className={cn(
                          "rounded-xl border px-2 py-2.5 text-center transition hover:border-primary/40",
                          date === d && "border-primary bg-accent ring-1 ring-primary/30",
                        )}
                      >
                        <span className="block text-[11px] text-muted-foreground uppercase">{format(parseISO(d), "EEE")}</span>
                        <span className="block font-heading text-lg leading-tight font-semibold">{format(parseISO(d), "d")}</span>
                        <span className="block text-[11px] text-muted-foreground">{format(parseISO(d), "MMM")}</span>
                        <span className={cn("mt-1 block text-[10px] font-medium", available ? "text-brand" : "text-destructive")}>
                          {available ? `${list.length} session${list.length > 1 ? "s" : ""}` : "Full"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 2 && date && (
            <div>
              <p className="mb-3 text-sm text-muted-foreground">{formatDate(date, "EEEE, d MMMM")} · choose a time slot</p>
              <div className="space-y-2">
                {slots.map((e) => {
                  const s = e.session;
                  const mentor = getMentor(s.mentorId);
                  const unavailable = e.full || Boolean(e.booking);
                  const waitlisted = isWaitlisted(s.id);
                  return (
                    <div
                      key={s.id}
                      className={cn(
                        "flex flex-col gap-3 rounded-xl border p-3 transition sm:flex-row sm:items-center",
                        sessionId === s.id && "border-primary bg-accent/60 ring-1 ring-primary/30",
                        unavailable && "bg-muted/40",
                      )}
                    >
                      <button
                        type="button"
                        disabled={unavailable}
                        onClick={() => setSessionId(s.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-not-allowed"
                      >
                        <span
                          className={cn(
                            "flex h-12 w-20 shrink-0 flex-col items-center justify-center rounded-lg border text-sm font-semibold",
                            sessionId === s.id ? "border-primary bg-primary text-primary-foreground" : "bg-background",
                            unavailable && "line-through opacity-60",
                          )}
                        >
                          {formatTime(s.time)}
                          <span className="text-[10px] font-normal opacity-75">{s.durationMin} min</span>
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{s.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {mentor?.name} · {e.booking ? "Already booked" : e.full ? "Full" : `${e.seatsLeft} seats left`}
                          </span>
                        </span>
                      </button>
                      {e.full && !e.booking && (
                        <Button size="sm" variant="outline" disabled={waitlisted} onClick={() => onWaitlist(s.id)}>
                          <ListPlus /> {waitlisted ? "On waitlist" : "Join waitlist"}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Full sessions offer a waitlist — you&apos;ll be notified if a seat opens up.</p>
            </div>
          )}

          {step === 3 && selected && (
            <div className="space-y-4">
              <div className="divide-y rounded-xl border">
                <Row icon={CalendarCheck} label="Session" value={selected.session.title} />
                <Row icon={BookOpen} label="Programme" value={getCourse(selected.session.courseId)?.title ?? ""} />
                <Row
                  icon={CalendarDays}
                  label="When"
                  value={`${formatDate(selected.session.date, "EEE, d MMM yyyy")} · ${formatTime(selected.session.time)} – ${endTime(selected.session.time, selected.session.durationMin)} IST`}
                />
                <Row icon={Clock} label="Duration" value={`${formatDuration(selected.session.durationMin * 60)} · live online`} />
                <Row icon={Users} label="For" value={audienceLabel(selected.session.audience)} />
                <Row icon={IndianRupee} label="Price" value="Included · no charge" strong />
              </div>
              {(() => {
                const mentor = getMentor(selected.session.mentorId);
                return mentor ? (
                  <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                    <Portrait avatar={mentor.avatar} name={mentor.name} className="size-9" />
                    <div className="min-w-0 text-sm leading-tight">
                      <p className="font-medium">Hosted by {mentor.name}</p>
                      <p className="text-xs text-muted-foreground">{mentor.title}</p>
                    </div>
                    <span className="ml-auto text-xs font-medium text-brand">{selected.seatsLeft} seats left</span>
                  </div>
                ) : null;
              })()}
              <div className="space-y-1.5">
                <Label htmlFor="session-note">
                  {selected.session.type === "doubt-clearing" ? "Which doubt would you like covered?" : "Anything the host should know?"}{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="session-note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={selected.session.type === "doubt-clearing" ? "e.g. How do I re-enter a GD after being interrupted?" : "e.g. I'd like feedback on my opening line"}
                />
              </div>
              <p className="text-xs text-muted-foreground">Prototype: no joining link or calendar invite is actually sent.</p>
            </div>
          )}

          {done && selected && (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
                <PartyPopper className="size-7" />
              </span>
              <h3 className="mt-4 font-heading text-lg font-semibold">Your seat is booked!</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {selected.session.title} on {formatDate(selected.session.date, "EEEE, d MMMM")} at {formatTime(selected.session.time)} IST. It now appears in
                your Upcoming sessions and calendar.
              </p>
              {bookedId && <p className="mt-2 font-mono text-xs text-muted-foreground">Booking ref · {bookedId.toUpperCase()}</p>}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {done ? (
            <>
              <Button variant="outline" onClick={() => toast.success(CALENDAR_TOAST.title, { description: CALENDAR_TOAST.description })}>
                <CalendarPlus /> Add to calendar
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onViewUpcoming?.();
                }}
              >
                View in Upcoming
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                <ArrowLeft /> Back
              </Button>
              {step < 3 ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>
                  Continue
                </Button>
              ) : (
                <Button onClick={confirm} disabled={!selected || selected.full || Boolean(selected.booking)} className="bg-brand text-brand-foreground hover:bg-brand/90">
                  Confirm booking
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ icon: Icon, label, value, strong }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 text-sm">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <span className={cn("ml-auto text-right", strong && "font-heading text-base font-semibold")}>{value}</span>
    </div>
  );
}
