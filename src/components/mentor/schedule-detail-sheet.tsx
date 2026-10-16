"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarX2,
  CheckCircle2,
  Clapperboard,
  ClipboardCheck,
  Link2,
  MessageSquare,
  NotebookPen,
  Plus,
  Users,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getCohort, getCourse, getMentorOffer, getSession } from "@/data";
import { DEMO_LEARNER_ID, DEMO_TODAY, STAGE_META } from "@/data/constants";
import { formatClock, formatDate, formatINR, formatNumber, formatTime, pct, relativeDay } from "@/lib/format";
import type { Booking } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { AutoStatus, StatusPill } from "@/components/shared/badges";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { Portrait } from "@/components/shared/portrait";
import { VideoPlayer } from "@/components/shared/video-player";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "./confirm-dialog";
import {
  bookingTitle,
  bookingTypeLabel,
  endTime,
  learnerOf,
  MENTOR_NAME,
  recommendableCourses,
  SESSION_TYPE_LABEL,
  startsIn,
  useMentorBookings,
} from "./mentor-data";
import { DetailRow } from "./panel";

export type DetailTarget = { kind: "booking" | "session"; id: string };

/** Open/close state for the detail sheet that keeps content mounted during the close animation. */
export function useDetailSheet() {
  const [target, setTarget] = useState<DetailTarget | null>(null);
  const [open, setOpen] = useState(false);
  return {
    target,
    open,
    setOpen,
    show: (t: DetailTarget) => {
      setTarget(t);
      setOpen(true);
    },
  };
}

export function ScheduleDetailSheet({
  target,
  open,
  onOpenChange,
}: {
  target: DetailTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto data-[side=right]:sm:max-w-md">
        {target?.kind === "booking" && <BookingDetail key={target.id} id={target.id} onClose={() => onOpenChange(false)} />}
        {target?.kind === "session" && <SessionDetail key={target.id} id={target.id} />}
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------------------------
// Booking detail
// ---------------------------------------------------------------------------------------------

function BookingDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const booking = useDemoStore((s) => s.bookings.find((b) => b.id === id));
  const cancelBooking = useDemoStore((s) => s.cancelBooking);
  const allMine = useMentorBookings();
  const [editing, setEditing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!booking) {
    return (
      <SheetHeader>
        <SheetTitle>Booking not found</SheetTitle>
        <SheetDescription>This booking may have been removed when the demo was reset.</SheetDescription>
      </SheetHeader>
    );
  }

  const learner = learnerOf(booking.userId);
  const offer = booking.offerId ? getMentorOffer(booking.offerId)?.offer : undefined;
  const session = booking.sessionId ? getSession(booking.sessionId) : undefined;
  const sessionsWithYou = allMine.filter((b) => b.userId === booking.userId && b.status !== "cancelled").length;
  const isToday = booking.date === DEMO_TODAY;
  const upcoming = booking.date >= DEMO_TODAY;
  const timing = isToday ? startsIn(booking.date, booking.time, booking.durationMin) : undefined;

  const message = () =>
    toast.success(`Message sent to ${learner.firstName}`, {
      description: "Delivered to the learner's CDL inbox (simulated — no email or SMS is sent).",
    });

  return (
    <>
      <SheetHeader className="border-b pr-12">
        <p className="text-xs font-medium tracking-wide text-brand uppercase">
          {bookingTypeLabel(booking)} · {booking.id}
        </p>
        <SheetTitle className="text-lg font-semibold">{bookingTitle(booking)}</SheetTitle>
        <SheetDescription>
          {formatDate(booking.date, "EEEE, d MMMM")} · {formatTime(booking.time)} – {formatTime(endTime(booking.time, booking.durationMin))} IST
        </SheetDescription>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <AutoStatus status={booking.status} />
          {upcoming && booking.status === "confirmed" && <StatusPill tone="info">{timing ?? relativeDay(booking.date)}</StatusPill>}
        </div>
      </SheetHeader>

      <div className="space-y-5 p-4">
        {/* Learner */}
        <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
          <Portrait avatar={learner.avatar} name={learner.name} className="size-12" />
          <div className="min-w-0">
            <p className="font-semibold">{learner.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {learner.user ? `${STAGE_META[learner.user.stage].label} · ${learner.user.education}` : "CDL learner"}
            </p>
            <p className="text-xs text-muted-foreground">
              {learner.user?.city ? `${learner.user.city} · ` : ""}
              {sessionsWithYou} {sessionsWithYou === 1 ? "session" : "sessions"} with you
            </p>
          </div>
        </div>

        <dl className="divide-y rounded-xl border px-3">
          <DetailRow label="Session type">{bookingTypeLabel(booking)}</DetailRow>
          {offer && (
            <DetailRow label="Offer">
              {offer.title}
              <span className="block text-xs font-normal text-muted-foreground">
                {formatINR(offer.price)} · {offer.sessions > 1 ? `${offer.sessions}-session pack` : "single session"} (simulated payment)
              </span>
            </DetailRow>
          )}
          {session && <DetailRow label="Live session">{session.title}</DetailRow>}
          <DetailRow label="Date">{formatDate(booking.date, "EEE, d MMM yyyy")}</DetailRow>
          <DetailRow label="Time">
            {formatTime(booking.time)} – {formatTime(endTime(booking.time, booking.durationMin))} IST
          </DetailRow>
          <DetailRow label="Duration">{booking.durationMin} min</DetailRow>
          <DetailRow label="Topic">{booking.topic ?? <span className="font-normal text-muted-foreground">No topic shared</span>}</DetailRow>
          <DetailRow label="Booking ID">
            <span className="font-mono text-xs">{booking.id}</span>
          </DetailRow>
          <DetailRow label="Booked on">{formatDate(booking.createdAt, "d MMM yyyy, h:mm a")}</DetailRow>
        </dl>

        {booking.status === "cancelled" && (
          <div className="flex gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm">
            <CalendarX2 className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p className="text-muted-foreground">This session was cancelled. The slot has been released and any payment is refunded (simulated).</p>
          </div>
        )}

        {/* Notes & follow-ups */}
        {booking.kind === "mentoring" && editing ? (
          <CompleteForm booking={booking} onDone={() => setEditing(false)} />
        ) : (
          booking.notes && (
            <div className="space-y-3 rounded-xl border bg-brand-soft/40 p-4">
              <div className="flex items-center gap-2">
                <NotebookPen className="size-4 text-brand" />
                <p className="text-sm font-semibold">Session notes</p>
                <span className="ml-auto text-[11px] text-muted-foreground">Shared with {learner.firstName}</span>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">{booking.notes}</p>
              {booking.followUps && booking.followUps.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase">Follow-ups</p>
                  <ul className="space-y-1.5">
                    {booking.followUps.map((f) => (
                      <li key={f} className="flex gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {booking.recommendedCourseIds && booking.recommendedCourseIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {booking.recommendedCourseIds.map((cid) => (
                    <StatusPill key={cid} tone="primary" dot={false}>
                      <BookOpen className="size-3" /> {getCourse(cid)?.title ?? cid}
                    </StatusPill>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Actions */}
      {!editing && (
        <div className="mt-auto space-y-2 border-t bg-muted/30 p-4">
          {booking.status === "confirmed" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {isToday ? (
                  <Button
                    className="h-10 bg-brand text-brand-foreground hover:bg-brand/90"
                    onClick={() =>
                      toast.success(`Opening session room with ${learner.firstName}`, {
                        description: "Simulated video room — no call is started in this prototype.",
                      })
                    }
                  >
                    <Video /> Join (simulated)
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="h-10"
                    onClick={() => toast.success("Joining link copied", { description: "A simulated meeting link was copied for your calendar." })}
                  >
                    <Link2 /> Copy joining link
                  </Button>
                )}
                {booking.kind === "mentoring" ? (
                  <Button className="h-10" onClick={() => setEditing(true)}>
                    <ClipboardCheck /> Mark completed
                  </Button>
                ) : (
                  <Button variant="outline" className="h-10" onClick={message}>
                    <MessageSquare /> Message learner
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {booking.kind === "mentoring" && (
                  <Button variant="outline" className="h-10" onClick={message}>
                    <MessageSquare /> Message learner
                  </Button>
                )}
                <Button variant="destructive" className={cn("h-10", booking.kind !== "mentoring" && "col-span-2")} onClick={() => setConfirmCancel(true)}>
                  <CalendarX2 /> Cancel {booking.kind === "mentoring" ? "session" : "seat"}
                </Button>
              </div>
            </>
          )}
          {booking.status === "completed" && (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-10" onClick={() => setEditing(true)}>
                <NotebookPen /> {booking.notes ? "Edit notes" : "Add notes"}
              </Button>
              <Button variant="outline" className="h-10" onClick={message}>
                <MessageSquare /> Message learner
              </Button>
            </div>
          )}
          {booking.status === "cancelled" && (
            <Button variant="outline" className="h-10 w-full" onClick={message}>
              <MessageSquare /> Message learner
            </Button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={`Cancel ${learner.firstName}'s session?`}
        description={`${bookingTitle(booking)} on ${formatDate(booking.date, "EEE, d MMM")} at ${formatTime(booking.time)}. The learner is notified, the slot reopens and the payment is refunded (all simulated).`}
        confirmLabel="Cancel session"
        onConfirm={() => {
          cancelBooking(booking.id);
          toast.success("Session cancelled", { description: `${learner.firstName} has been notified (simulated).` });
          onClose();
        }}
      />
    </>
  );
}

function CompleteForm({ booking, onDone }: { booking: Booking; onDone: () => void }) {
  const updateBooking = useDemoStore((s) => s.updateBooking);
  const addNotification = useDemoStore((s) => s.addNotification);
  const learner = learnerOf(booking.userId);
  const wasCompleted = booking.status === "completed";
  const [notes, setNotes] = useState(booking.notes ?? "");
  const [followUps, setFollowUps] = useState<string[]>(booking.followUps?.length ? booking.followUps : [""]);
  const [recommended, setRecommended] = useState<string[]>(booking.recommendedCourseIds ?? []);
  const [touched, setTouched] = useState(false);

  const notesError = notes.trim().length < 20 ? "Add at least a couple of sentences (20+ characters) so the learner has useful notes." : undefined;

  const save = () => {
    setTouched(true);
    if (notesError) return;
    const cleanFollowUps = followUps.map((f) => f.trim()).filter(Boolean);
    updateBooking(booking.id, {
      status: "completed",
      notes: notes.trim(),
      followUps: cleanFollowUps,
      recommendedCourseIds: recommended.length ? recommended : undefined,
    });
    if (booking.userId === DEMO_LEARNER_ID) {
      addNotification({
        kind: "mentoring",
        title: `Session notes from ${MENTOR_NAME}`,
        body: `${MENTOR_NAME} shared notes and ${cleanFollowUps.length} follow-up${cleanFollowUps.length === 1 ? "" : "s"} from your session.`,
        href: "/dashboard/mentoring",
      });
    }
    toast.success(wasCompleted ? "Notes updated" : "Session marked completed", {
      description: `Notes and follow-ups now appear on ${learner.firstName}'s mentoring page.`,
    });
    onDone();
  };

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div>
        <p className="font-heading text-sm font-semibold">{wasCompleted ? "Edit session notes" : "Complete session"}</p>
        <p className="text-xs text-muted-foreground">Shared with {learner.firstName} on their mentoring page.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="session-notes">Session notes</Label>
        <Textarea
          id="session-notes"
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What you covered, what went well and what to practise next…"
          aria-invalid={touched && Boolean(notesError)}
        />
        {touched && notesError && <p className="text-xs text-destructive">{notesError}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Follow-ups</Label>
        <div className="space-y-2">
          {followUps.map((f, i) => (
            <div key={i} className="flex gap-2">
              <Input
                aria-label={`Follow-up ${i + 1}`}
                value={f}
                placeholder="e.g. Record a 2-minute update using PREP"
                onChange={(e) => setFollowUps((list) => list.map((x, j) => (j === i ? e.target.value : x)))}
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove follow-up ${i + 1}`}
                onClick={() => setFollowUps((list) => (list.length === 1 ? [""] : list.filter((_, j) => j !== i)))}
              >
                <X />
              </Button>
            </div>
          ))}
        </div>
        {followUps.length < 5 && (
          <Button variant="ghost" size="sm" className="text-brand" onClick={() => setFollowUps((l) => [...l, ""])}>
            <Plus /> Add follow-up
          </Button>
        )}
      </div>
      <div className="space-y-2">
        <Label>Recommend a programme (optional)</Label>
        <div className="grid gap-2">
          {recommendableCourses.map((c) => {
            const checked = recommended.includes(c.id);
            return (
              <label key={c.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm hover:bg-muted/50">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => setRecommended((r) => (v ? [...r, c.id] : r.filter((x) => x !== c.id)))}
                />
                {c.title}
              </label>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onDone}>
          Back
        </Button>
        <Button className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={save}>
          <CheckCircle2 /> {wasCompleted ? "Save notes" : "Mark completed & share notes"}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Live session detail
// ---------------------------------------------------------------------------------------------

function SessionDetail({ id }: { id: string }) {
  const session = getSession(id);
  const [showRecording, setShowRecording] = useState(false);
  if (!session) {
    return (
      <SheetHeader>
        <SheetTitle>Session not found</SheetTitle>
      </SheetHeader>
    );
  }
  const course = getCourse(session.courseId);
  const cohort = session.cohortId ? getCohort(session.cohortId) : undefined;
  const isToday = session.date === DEMO_TODAY;
  const upcoming = session.date >= DEMO_TODAY && session.status === "scheduled";
  const timing = isToday ? startsIn(session.date, session.time, session.durationMin) : undefined;
  const fill = pct(session.booked, session.capacity);

  return (
    <>
      <SheetHeader className="border-b pr-12">
        <p className="text-xs font-medium tracking-wide text-brand uppercase">{SESSION_TYPE_LABEL[session.type]}</p>
        <SheetTitle className="text-lg font-semibold">{session.title}</SheetTitle>
        <SheetDescription>
          {formatDate(session.date, "EEEE, d MMMM")} · {formatTime(session.time)} – {formatTime(endTime(session.time, session.durationMin))} IST
        </SheetDescription>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <AutoStatus status={session.status} />
          {upcoming && <StatusPill tone="info">{timing ?? relativeDay(session.date)}</StatusPill>}
          {session.booked >= session.capacity && <StatusPill tone="warning">Full · waitlist open</StatusPill>}
        </div>
      </SheetHeader>

      <div className="space-y-5 p-4">
        {course && (
          <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
            <CourseThumbnail course={course} size="sm" className="w-20 shrink-0" />
            <div className="min-w-0">
              <p className="truncate font-semibold">{course.title}</p>
              <p className="truncate text-xs text-muted-foreground">{cohort ? `${cohort.name} · ${cohort.scheduleLabel}` : "Open session"}</p>
            </div>
          </div>
        )}

        <div className="rounded-xl border p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-4" /> {session.type === "cohort-class" ? "Enrolled learners" : "Seats booked"}
            </span>
            <span className="font-semibold tabular-nums">
              {formatNumber(session.booked)} / {formatNumber(session.capacity)}
            </span>
          </div>
          <Progress value={fill} className="mt-2 h-1.5 [&>[data-slot=progress-indicator]]:bg-brand" />
        </div>

        <dl className="divide-y rounded-xl border px-3">
          <DetailRow label="Date">{formatDate(session.date, "EEE, d MMM yyyy")}</DetailRow>
          <DetailRow label="Time">
            {formatTime(session.time)} – {formatTime(endTime(session.time, session.durationMin))} IST
          </DetailRow>
          <DetailRow label="Duration">{session.durationMin} min</DetailRow>
          <DetailRow label="Audience">{session.audience.map((a) => STAGE_META[a].plural).join(", ")}</DetailRow>
          <DetailRow label="Session ID">
            <span className="font-mono text-xs">{session.id}</span>
          </DetailRow>
        </dl>

        <p className="text-sm leading-relaxed text-muted-foreground">{session.description}</p>

        {session.recording && course && (
          <div className="space-y-3 rounded-xl border p-3">
            <div className="flex items-center gap-2 text-sm">
              <Clapperboard className="size-4 text-brand" />
              <span className="font-medium">Recording</span>
              <span className="text-muted-foreground">
                {formatClock(session.recording.durationSec)} · {session.recording.views} views
              </span>
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setShowRecording((v) => !v)}>
                {showRecording ? "Hide" : "Preview"}
              </Button>
            </div>
            {showRecording && (
              <VideoPlayer
                course={course}
                lesson={{ id: `rec-${session.id}`, title: session.title, durationSec: session.recording.durationSec }}
                contextLabel="Session recording"
              />
            )}
          </div>
        )}
      </div>

      <div className="mt-auto space-y-2 border-t bg-muted/30 p-4">
        {upcoming && (
          <div className="grid grid-cols-2 gap-2">
            {isToday ? (
              <Button
                className="h-10 bg-brand text-brand-foreground hover:bg-brand/90"
                onClick={() => toast.success("Starting live class (simulated)", { description: `${session.booked} learners will be admitted from the waiting room.` })}
              >
                <Video /> Start class
              </Button>
            ) : (
              <Button
                variant="outline"
                className="h-10"
                onClick={() => toast.success("Joining link copied", { description: "A simulated host link was copied for your calendar." })}
              >
                <Link2 /> Copy host link
              </Button>
            )}
            <Button
              variant="outline"
              className="h-10"
              onClick={() => toast.success("Announcement sent", { description: `Sent to ${session.booked} learners (simulated).` })}
            >
              <MessageSquare /> Message learners
            </Button>
          </div>
        )}
        <Button variant="outline" className="h-10 w-full" asChild>
          <Link href={`/mentor/courses/${session.courseId}`}>
            <BookOpen /> Open course workspace
          </Link>
        </Button>
      </div>
    </>
  );
}
