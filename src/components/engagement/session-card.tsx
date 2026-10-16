"use client";

import { BookOpen, CalendarCheck, Clock, ListPlus, PlayCircle, Users, Video } from "lucide-react";
import { getCourse, getMentor } from "@/data";
import { formatDate, formatDuration, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Portrait } from "@/components/shared/portrait";
import { StatusPill } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { endTime, startsIn } from "./engagement-utils";
import { audienceLabel, DateTile, SeatsMeter, SessionTypeBadge } from "./session-bits";
import type { SessionEntry } from "./use-sessions";

export interface SessionActions {
  openDetails: (sessionId: string) => void;
  book: (sessionId: string) => void;
  join: (sessionId: string) => void;
  waitlist: (sessionId: string) => void;
  isWaitlisted: (sessionId: string) => boolean;
  watch: (sessionId: string) => void;
}

/** Join is only enabled on the day of the session (simulated live classroom). */
export function JoinButton({ entry, actions, className, size = "default" }: { entry: SessionEntry; actions: SessionActions; className?: string; size?: "default" | "sm" | "lg" }) {
  if (entry.isToday) {
    return (
      <Button size={size} className={cn("bg-brand text-brand-foreground hover:bg-brand/90", className)} onClick={() => actions.join(entry.session.id)}>
        <Video /> Join live class
      </Button>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="inline-flex rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
          <Button size={size} variant="outline" disabled className={className}>
            <Video /> Join
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>Join opens on {formatDate(entry.session.date, "EEE, d MMM")}</TooltipContent>
    </Tooltip>
  );
}

/** The primary call-to-action for a bookable session, reflecting booked / full / waitlist state. */
export function BookButton({ entry, actions, className, size = "default" }: { entry: SessionEntry; actions: SessionActions; className?: string; size?: "default" | "sm" | "lg" }) {
  const id = entry.session.id;
  if (entry.booking) {
    return (
      <Button size={size} variant="secondary" className={cn("text-success", className)} onClick={() => actions.openDetails(id)}>
        <CalendarCheck /> Booked
      </Button>
    );
  }
  if (entry.full) {
    const on = actions.isWaitlisted(id);
    return (
      <Button size={size} variant="outline" className={className} onClick={() => actions.waitlist(id)} disabled={on}>
        <ListPlus /> {on ? "On waitlist" : "Join waitlist"}
      </Button>
    );
  }
  return (
    <Button size={size} className={className} onClick={() => actions.book(id)}>
      {entry.inCohort ? "Reserve seat" : "Book seat"}
    </Button>
  );
}

function MetaLine({ entry }: { entry: SessionEntry }) {
  const s = entry.session;
  const mentor = getMentor(s.mentorId);
  const course = getCourse(s.courseId);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <Clock className="size-3.5" />
        {formatTime(s.time)} – {endTime(s.time, s.durationMin)} IST · {formatDuration(s.durationMin * 60)}
      </span>
      {mentor && (
        <span className="inline-flex items-center gap-1.5">
          <Portrait avatar={mentor.avatar} name={mentor.name} className="size-4" />
          {mentor.name}
        </span>
      )}
      {course && (
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="size-3.5" />
          {course.title}
        </span>
      )}
      <span className="inline-flex items-center gap-1.5">
        <Users className="size-3.5" />
        {audienceLabel(s.audience)}
      </span>
    </div>
  );
}

function StatePills({ entry }: { entry: SessionEntry }) {
  return (
    <>
      {entry.booking && <StatusPill tone="success">Booked</StatusPill>}
      {!entry.booking && entry.inCohort && (
        <StatusPill tone="primary" dot={false}>
          Your cohort
        </StatusPill>
      )}
      {entry.isToday && !entry.isPast && <StatusPill tone="brand">Today</StatusPill>}
      {entry.session.status === "completed" && <StatusPill tone="neutral">Completed</StatusPill>}
    </>
  );
}

/** Horizontal agenda row used in "Upcoming". */
export function SessionRow({ entry, actions }: { entry: SessionEntry; actions: SessionActions }) {
  const s = entry.session;
  const seatsText =
    s.type === "cohort-class" ? `${entry.seatsTaken}/${s.capacity} enrolled` : entry.full ? "Full" : `${entry.seatsLeft} seats left`;
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-xs transition hover:shadow-md md:flex-row md:items-center",
        entry.isToday && "border-brand/40 ring-1 ring-brand/15",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <DateTile date={s.date} highlight={entry.isToday} />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <SessionTypeBadge type={s.type} />
            <StatePills entry={entry} />
          </div>
          <button
            type="button"
            onClick={() => actions.openDetails(s.id)}
            className="block text-left font-heading leading-snug font-semibold hover:text-primary focus-visible:underline focus-visible:outline-none"
          >
            {s.title}
          </button>
          <MetaLine entry={entry} />
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 md:flex-col md:items-end">
        <span className="text-xs text-muted-foreground md:order-last">
          {entry.isToday ? <span className="font-medium text-brand">{startsIn(s.date, s.time)}</span> : seatsText}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="default" onClick={() => actions.openDetails(s.id)}>
            Details
          </Button>
          {entry.inCohort && entry.open && !entry.booking && !entry.isToday ? (
            <BookButton entry={entry} actions={actions} />
          ) : (
            <JoinButton entry={entry} actions={actions} />
          )}
        </div>
      </div>
    </div>
  );
}

/** Card used in "Browse & book". */
export function SessionTile({ entry, actions }: { entry: SessionEntry; actions: SessionActions }) {
  const s = entry.session;
  const mentor = getMentor(s.mentorId);
  const course = getCourse(s.courseId);
  return (
    <div className={cn("flex flex-col rounded-2xl border bg-card p-5 shadow-xs transition hover:shadow-md", entry.booking && "border-success/30")}>
      <div className="flex flex-wrap items-center gap-1.5">
        <SessionTypeBadge type={s.type} />
        <StatePills entry={entry} />
        {entry.forMyStage && !entry.mine && (
          <StatusPill tone="brand" dot={false}>
            Suits your stage
          </StatusPill>
        )}
      </div>
      <button
        type="button"
        onClick={() => actions.openDetails(s.id)}
        className="mt-3 text-left font-heading text-[17px] leading-snug font-semibold hover:text-primary focus-visible:underline focus-visible:outline-none"
      >
        {s.title}
      </button>
      {course && <p className="mt-0.5 text-xs font-medium text-muted-foreground">{course.title}</p>}
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>

      <div className="mt-4 flex items-center gap-3 rounded-xl bg-muted/50 p-3">
        <DateTile date={s.date} className="w-12 bg-background py-1.5" />
        <div className="min-w-0 text-sm">
          <p className="font-medium">
            {formatTime(s.time)} – {endTime(s.time, s.durationMin)} IST
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDuration(s.durationMin * 60)} · Live online · {audienceLabel(s.audience)}
          </p>
        </div>
      </div>

      {mentor && (
        <div className="mt-4 flex items-center gap-2.5">
          <Portrait avatar={mentor.avatar} name={mentor.name} className="size-8" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium">{mentor.name}</p>
            <p className="truncate text-xs text-muted-foreground">{mentor.title}</p>
          </div>
        </div>
      )}

      <SeatsMeter taken={entry.seatsTaken} capacity={s.capacity} className="mt-4" />

      <div className="mt-auto flex items-center justify-end gap-2 pt-4">
        <Button variant="ghost" onClick={() => actions.openDetails(s.id)}>
          Details
        </Button>
        <BookButton entry={entry} actions={actions} />
      </div>
    </div>
  );
}

/** Recording tile with a designed thumbnail. */
export function RecordingTile({ entry, onWatch }: { entry: SessionEntry; onWatch: () => void }) {
  const s = entry.session;
  const course = getCourse(s.courseId);
  const mentor = getMentor(s.mentorId);
  const from = course?.thumbnail.from ?? "#312e81";
  const to = course?.thumbnail.to ?? "#0f766e";
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-xs transition hover:shadow-md">
      <button
        type="button"
        onClick={onWatch}
        aria-label={`Watch recording: ${s.title}`}
        className="relative isolate m-2 mb-0 flex aspect-video items-center justify-center overflow-hidden rounded-xl text-white focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        style={{ backgroundImage: `radial-gradient(120% 100% at 90% 0%, ${to} 0%, transparent 60%), linear-gradient(135deg, ${from}, oklch(0.22 0.07 268))` }}
      >
        <span className="absolute inset-0 -z-10 bg-grid opacity-25" />
        <span className="absolute top-2.5 left-2.5 rounded-md bg-black/30 px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase backdrop-blur-sm">
          Recording
        </span>
        <span className="flex size-12 items-center justify-center rounded-full bg-white/95 text-navy shadow-lg transition group-hover:scale-105">
          <PlayCircle className="size-6" />
        </span>
        <span className="absolute right-2.5 bottom-2.5 rounded-md bg-black/45 px-1.5 py-0.5 text-[11px] font-medium tabular-nums">
          {s.recording ? formatDuration(s.recording.durationSec) : ""}
        </span>
      </button>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <SessionTypeBadge type={s.type} />
          {entry.inCohort && (
            <StatusPill tone="primary" dot={false}>
              Your cohort
            </StatusPill>
          )}
        </div>
        <h3 className="font-heading leading-snug font-semibold">{s.title}</h3>
        <p className="text-xs text-muted-foreground">
          {course?.title} · {formatDate(s.date, "EEE, d MMM")}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          {mentor && (
            <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <Portrait avatar={mentor.avatar} name={mentor.name} className="size-5" />
              <span className="truncate">{mentor.name}</span>
            </span>
          )}
          <span className="text-xs text-muted-foreground tabular-nums">{s.recording?.views ?? 0} views</span>
        </div>
      </div>
    </div>
  );
}
