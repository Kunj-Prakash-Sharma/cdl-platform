"use client";

import { format, parseISO } from "date-fns";
import { CalendarPlus, CheckCircle2, Clock, PlayCircle, Send, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { getCohort, getCourse, getMentor } from "@/data";
import { DEMO_TODAY } from "@/data/constants";
import { formatClock, formatDate, formatTime, relativeDay } from "@/lib/format";
import type { LiveSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DemoBadge, StatusPill } from "@/components/shared/badges";
import { Portrait } from "@/components/shared/portrait";
import { VideoPlayer } from "@/components/shared/video-player";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AIT_STUDENTS, cohortShort, sessionAttendance, sessionNumber, sessionTopic, studentAttended } from "./college-data";

/** Compact date tile used in session lists. */
export function DateTile({ date, className, accent }: { date: string; className?: string; accent?: string }) {
  const d = parseISO(date);
  const today = date === DEMO_TODAY;
  return (
    <div
      className={cn(
        "flex size-12 shrink-0 flex-col items-center justify-center rounded-xl border bg-background leading-none",
        today && "border-transparent text-white",
        className,
      )}
      style={today ? { backgroundColor: accent ?? "var(--primary)" } : undefined}
    >
      <span className={cn("text-[10px] font-semibold tracking-wide uppercase", today ? "text-white/80" : "text-muted-foreground")}>{format(d, "MMM")}</span>
      <span className="mt-0.5 font-heading text-lg font-semibold">{format(d, "d")}</span>
    </div>
  );
}

export function SessionStatus({ session }: { session: LiveSession }) {
  if (session.date === DEMO_TODAY) return <StatusPill tone="brand">Today · {formatTime(session.time)}</StatusPill>;
  if (session.date < DEMO_TODAY) return <StatusPill tone="success">Completed</StatusPill>;
  return <StatusPill tone="info">{relativeDay(session.date)}</StatusPill>;
}

/** One row in a session list. */
export function SessionRow({
  session,
  onOpen,
  actions,
  showCohort = true,
  accent,
}: {
  session: LiveSession;
  onOpen?: () => void;
  actions?: React.ReactNode;
  showCohort?: boolean;
  accent?: string;
}) {
  const mentor = getMentor(session.mentorId);
  const n = sessionNumber(session.title);
  return (
    <div className="flex items-center gap-3 py-3">
      <DateTile date={session.date} accent={accent} />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onOpen}
          disabled={!onOpen}
          className="block max-w-full truncate text-left text-sm font-medium hover:text-primary hover:underline disabled:no-underline disabled:hover:text-foreground"
        >
          {sessionTopic(session.title)}
        </button>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {showCohort && <span>{cohortShort(session.cohortId)}</span>}
          {n && <span>Class {n}</span>}
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {format(parseISO(session.date), "EEE")} · {formatTime(session.time)}
          </span>
          {mentor && <span className="hidden sm:inline">{mentor.name}</span>}
        </p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  );
}

/** Plays a past session's recording in the simulated player. */
export function RecordingDialog({ session, onOpenChange }: { session: LiveSession | null; onOpenChange: (open: boolean) => void }) {
  const course = session ? getCourse(session.courseId) : undefined;
  const cohort = session?.cohortId ? getCohort(session.cohortId) : undefined;
  return (
    <Dialog open={Boolean(session)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        {session && course && (
          <>
            <DialogHeader>
              <DialogTitle>{session.title}</DialogTitle>
              <DialogDescription>
                {cohort?.name ?? course.title} · Recorded {formatDate(session.date)}
                {session.recording && ` · ${formatClock(session.recording.durationSec)}`}
              </DialogDescription>
            </DialogHeader>
            <VideoPlayer
              course={{ ...course, instructorId: session.mentorId }}
              lesson={{ id: session.id, title: sessionTopic(session.title), durationSec: session.recording?.durationSec ?? session.durationMin * 60 }}
              contextLabel={`Live class recording · ${formatDate(session.date)}`}
            />
            <p className="text-xs text-muted-foreground">
              Recordings are shared within 24 hours of each class and stay available to the cohort until the licence ends.
              {session.recording && ` ${session.recording.views} views so far.`}
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** College-admin view of a session: details, attendance (synthetic) and actions. */
export function SessionDetailSheet({
  session,
  onOpenChange,
  onWatch,
}: {
  session: LiveSession | null;
  onOpenChange: (open: boolean) => void;
  onWatch: (s: LiveSession) => void;
}) {
  const mentor = session ? getMentor(session.mentorId) : undefined;
  const cohort = session?.cohortId ? getCohort(session.cohortId) : undefined;
  const attendance = session ? sessionAttendance(session) : null;
  const roster = session ? AIT_STUDENTS.filter((s) => s.cohortId === session.cohortId) : [];
  const past = session ? session.date < DEMO_TODAY : false;

  return (
    <Sheet open={Boolean(session)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {session && (
          <>
            <SheetHeader className="border-b pr-12">
              <div className="flex flex-wrap items-center gap-2">
                <SessionStatus session={session} />
                <span className="text-xs text-muted-foreground">{cohortShort(session.cohortId)}</span>
              </div>
              <SheetTitle className="mt-2 font-heading text-lg">{session.title}</SheetTitle>
              <SheetDescription>
                {formatDate(session.date, "EEEE, d MMMM yyyy")} · {formatTime(session.time)} IST · {session.durationMin} min
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 p-4">
              {mentor && (
                <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
                  <Portrait avatar={mentor.avatar} name={mentor.name} className="size-10" />
                  <div className="min-w-0 text-sm">
                    <p className="font-medium">{mentor.name}</p>
                    <p className="truncate text-xs text-muted-foreground">CDL mentor · {mentor.title}</p>
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground">{session.description}</p>

              {past && attendance ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-heading text-sm font-semibold">Attendance</h3>
                    <DemoBadge>Synthetic</DemoBadge>
                  </div>
                  <div className="rounded-xl border p-4">
                    <div className="flex items-end justify-between">
                      <p className="font-heading text-2xl font-semibold tabular-nums">{attendance.rate}%</p>
                      <p className="text-sm text-muted-foreground">
                        {attendance.attended} of {attendance.enrolled} attended
                      </p>
                    </div>
                    <Progress value={attendance.rate} className="mt-2 h-2 [&>[data-slot=progress-indicator]]:bg-brand" />
                  </div>
                  {roster.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Sample roster ({roster.length} of {cohort?.enrolled ?? roster.length} students)</p>
                      <ul className="divide-y rounded-xl border">
                        {roster.map((st) => {
                          const present = studentAttended(st, session);
                          return (
                            <li key={st.id} className="flex items-center gap-3 px-3 py-2">
                              <Portrait avatar={st.avatar} name={st.name} className="size-7" />
                              <span className="min-w-0 flex-1 truncate text-sm">{st.name}</span>
                              {present ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                                  <CheckCircle2 className="size-3.5" /> Present
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                                  <XCircle className="size-3.5" /> Absent
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  {session.recording && (
                    <Button className="h-10 w-full" onClick={() => onWatch(session)}>
                      <PlayCircle /> Watch recording
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border p-3">
                      <p className="text-xs text-muted-foreground">Registered</p>
                      <p className="mt-1 flex items-center gap-1.5 font-heading text-lg font-semibold">
                        <Users className="size-4 text-muted-foreground" />
                        {session.booked}/{session.capacity}
                      </p>
                    </div>
                    <div className="rounded-xl border p-3">
                      <p className="text-xs text-muted-foreground">Starts</p>
                      <p className="mt-1 font-heading text-lg font-semibold">{relativeDay(session.date)}</p>
                    </div>
                  </div>
                  <Button
                    className="h-10 w-full"
                    onClick={() =>
                      toast.success("Reminder scheduled", {
                        description: `${session.booked} students in ${cohortShort(session.cohortId)} will get an email + WhatsApp reminder 2 hours before class (simulated).`,
                      })
                    }
                  >
                    <Send /> Send reminder to cohort
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 w-full"
                    onClick={() => toast.success("Added to the T&P calendar", { description: `${sessionTopic(session.title)} · ${formatDate(session.date)} (simulated)` })}
                  >
                    <CalendarPlus /> Add to T&amp;P calendar
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
