"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, CalendarPlus, Clock, Laptop, PlayCircle, Users, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { getCohort, getCourse, getMentor, getMentorOffer } from "@/data";
import { formatDate, formatDuration, formatTime, relativeDay } from "@/lib/format";
import type { Booking } from "@/lib/types";
import { Rating } from "@/components/shared/cards";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { FormatBadge, StatusPill } from "@/components/shared/badges";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { CALENDAR_TOAST, endTime } from "./engagement-utils";
import { audienceLabel, SeatsMeter, SessionTypeBadge } from "./session-bits";
import { BookButton, JoinButton, type SessionActions } from "./session-card";
import type { SessionEntry } from "./use-sessions";

export type DetailTarget = { kind: "session"; entry: SessionEntry } | { kind: "mentoring"; booking: Booking };

function Fact({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        <Icon className="size-3.5" /> {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function MentorMini({ mentorId }: { mentorId: string }) {
  const mentor = getMentor(mentorId);
  if (!mentor) return null;
  return (
    <div className="rounded-xl border p-4">
      <p className="mb-3 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Your mentor</p>
      <div className="flex items-start gap-3">
        <Portrait avatar={mentor.avatar} name={mentor.name} className="size-12" rounded="xl" />
        <div className="min-w-0 flex-1">
          <p className="font-heading font-semibold">{mentor.name}</p>
          <p className="text-sm text-muted-foreground">{mentor.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <Rating value={mentor.rating} count={mentor.reviewCount} />
            <span>{mentor.experienceYears} yrs experience</span>
            <span>{mentor.languages.join(", ")}</span>
          </div>
        </div>
      </div>
      <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{mentor.bio}</p>
      <Button asChild variant="link" className="mt-1 h-auto px-0">
        <Link href={`/mentors/${mentor.id}`}>
          View full profile <ArrowRight />
        </Link>
      </Button>
    </div>
  );
}

function Hero({ courseId, children }: { courseId: string; children: React.ReactNode }) {
  const course = getCourse(courseId);
  const from = course?.thumbnail.from ?? "#312e81";
  const to = course?.thumbnail.to ?? "#0f766e";
  return (
    <div
      className="relative isolate overflow-hidden px-5 pt-5 pb-6 text-white"
      style={{ backgroundImage: `radial-gradient(120% 120% at 100% 0%, ${to} 0%, transparent 60%), linear-gradient(135deg, ${from}, oklch(0.22 0.07 268))` }}
    >
      <div className="absolute inset-0 -z-10 bg-grid opacity-20" />
      {children}
    </div>
  );
}

export function SessionDetailSheet({
  target,
  open,
  onOpenChange,
  actions,
  onCancel,
}: {
  target: DetailTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: SessionActions;
  onCancel: (booking: Booking, label: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} className="gap-0 overflow-y-auto p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        {target?.kind === "session" && <SessionBody entry={target.entry} actions={actions} onCancel={onCancel} close={() => onOpenChange(false)} />}
        {target?.kind === "mentoring" && <MentoringBody booking={target.booking} onCancel={onCancel} close={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}

function CloseButton({ close }: { close: () => void }) {
  return (
    <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Close details" className="absolute top-3 right-3 text-white hover:bg-white/15 hover:text-white">
      <X />
    </Button>
  );
}

function SessionBody({ entry, actions, onCancel, close }: { entry: SessionEntry; actions: SessionActions; onCancel: (b: Booking, label: string) => void; close: () => void }) {
  const s = entry.session;
  const course = getCourse(s.courseId);
  const cohort = s.cohortId ? getCohort(s.cohortId) : undefined;
  return (
    <>
      <Hero courseId={s.courseId}>
        <CloseButton close={close} />
        <div className="flex flex-wrap items-center gap-1.5 pr-8">
          <SessionTypeBadge type={s.type} className="bg-white/90" />
          {entry.booking && <StatusPill tone="success">Booked</StatusPill>}
          {entry.inCohort && !entry.booking && (
            <StatusPill tone="primary" dot={false}>
              Your cohort
            </StatusPill>
          )}
        </div>
        <SheetTitle className="mt-3 text-xl leading-snug font-semibold text-white">{s.title}</SheetTitle>
        <SheetDescription className="mt-1 text-white/75">{course?.title}{cohort ? ` · ${cohort.name}` : ""}</SheetDescription>
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm ring-1 ring-white/15">
          <CalendarDays className="size-4" />
          {formatDate(s.date, "EEE, d MMM yyyy")} · {formatTime(s.time)} – {endTime(s.time, s.durationMin)} IST
          <span className="text-white/65">· {relativeDay(s.date)}</span>
        </div>
      </Hero>

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-2.5">
          <Fact icon={Clock} label="Duration" value={formatDuration(s.durationMin * 60)} />
          <Fact icon={Laptop} label="Format" value="Live online classroom" />
          <Fact icon={Users} label="For" value={audienceLabel(s.audience)} />
          <Fact
            icon={UserRound}
            label="Status"
            value={s.status === "completed" ? "Completed" : s.status === "cancelled" ? "Cancelled" : entry.isToday ? "Live today" : "Scheduled"}
          />
        </div>

        {s.type === "cohort-class" ? (
          <p className="rounded-xl bg-secondary/70 px-3.5 py-2.5 text-sm text-primary">
            {entry.inCohort
              ? `Your seat is reserved as part of your Live Cohort (${entry.seatsTaken}/${s.capacity} learners enrolled).`
              : "This class is for learners enrolled in this Live Cohort."}
          </p>
        ) : (
          !entry.isPast && <SeatsMeter taken={entry.seatsTaken} capacity={s.capacity} />
        )}

        <div>
          <h3 className="text-sm font-semibold">About this session</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
        </div>

        <MentorMini mentorId={s.mentorId} />

        {course && (
          <Link href={`/courses/${course.id}`} className="flex items-center gap-3 rounded-xl border p-3 transition hover:bg-muted/60">
            <CourseThumbnail course={course} size="sm" className="w-20 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Programme</p>
              <p className="truncate text-sm font-medium">{course.title}</p>
              {entry.inCohort && <FormatBadge format="live-cohort" short className="mt-1" />}
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Link>
        )}
      </div>

      <div className="sticky bottom-0 mt-auto flex flex-wrap items-center justify-end gap-2 border-t bg-background/95 p-4 backdrop-blur">
        {entry.isPast ? (
          s.recording ? (
            <Button className="w-full sm:w-auto" onClick={() => actions.watch(s.id)}>
              <PlayCircle /> Watch recording
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">Recording will be available within 24 hours.</span>
          )
        ) : (
          <>
            {entry.booking && (
              <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onCancel(entry.booking!, s.title)}>
                Cancel booking
              </Button>
            )}
            {entry.mine && (
              <Button variant="outline" onClick={() => toast.success(CALENDAR_TOAST.title, { description: CALENDAR_TOAST.description })}>
                <CalendarPlus /> Add to calendar
              </Button>
            )}
            {entry.mine && (entry.booking || !entry.open || entry.isToday) ? (
              <JoinButton entry={entry} actions={actions} />
            ) : entry.open ? (
              <BookButton entry={entry} actions={actions} />
            ) : (
              <Button asChild variant="outline">
                <Link href={`/courses/${s.courseId}`}>View Live Cohort</Link>
              </Button>
            )}
          </>
        )}
      </div>
    </>
  );
}

function MentoringBody({ booking, onCancel, close }: { booking: Booking; onCancel: (b: Booking, label: string) => void; close: () => void }) {
  const found = booking.offerId ? getMentorOffer(booking.offerId) : undefined;
  const mentor = getMentor(booking.mentorId);
  const title = found?.offer.title ?? "One-to-One Mentoring";
  const upcoming = booking.status === "confirmed";
  return (
    <>
      <div className="relative isolate overflow-hidden bg-navy px-5 pt-5 pb-6 text-navy-foreground">
        <div className="absolute inset-0 -z-10 bg-grid opacity-20" />
        <div className="absolute -top-16 -right-16 -z-10 size-48 rounded-full bg-brand/30 blur-3xl" />
        <CloseButton close={close} />
        <FormatBadge format="mentoring" showLevel className="bg-white/90" />
        <SheetTitle className="mt-3 text-xl leading-snug font-semibold text-white">{title}</SheetTitle>
        <SheetDescription className="mt-1 text-white/75">with {mentor?.name}</SheetDescription>
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm ring-1 ring-white/15">
          <CalendarDays className="size-4" />
          {formatDate(booking.date, "EEE, d MMM yyyy")} · {formatTime(booking.time)} – {endTime(booking.time, booking.durationMin)} IST
        </div>
      </div>
      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-2.5">
          <Fact icon={Clock} label="Duration" value={`${booking.durationMin} minutes`} />
          <Fact icon={Laptop} label="Format" value="Private video call" />
        </div>
        {booking.topic && (
          <div>
            <h3 className="text-sm font-semibold">Focus for this session</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{booking.topic}</p>
          </div>
        )}
        <MentorMini mentorId={booking.mentorId} />
      </div>
      <div className="sticky bottom-0 mt-auto flex flex-wrap items-center justify-end gap-2 border-t bg-background/95 p-4 backdrop-blur">
        {upcoming && (
          <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onCancel(booking, title)}>
            Cancel
          </Button>
        )}
        <Button asChild>
          <Link href="/dashboard/mentoring">
            Manage in One-to-One Mentoring <ArrowRight />
          </Link>
        </Button>
      </div>
    </>
  );
}
