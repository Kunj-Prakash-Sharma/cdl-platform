"use client";

import { useState } from "react";
import { CalendarPlus, CheckCircle2, CircleAlert, Clock, PlayCircle, Radio, Users, Video } from "lucide-react";
import { toast } from "sonner";
import { getCohort, getMentor } from "@/data";
import { DEMO_TODAY } from "@/data/constants";
import { formatClock, formatDate, formatDayShort, formatTime, relativeDay } from "@/lib/format";
import type { LiveSession } from "@/lib/types";
import { DemoBadge } from "@/components/shared/badges";
import { MonthCalendar, type CalendarEvent } from "@/components/shared/month-calendar";
import { PageHeader, SectionHeader } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { tint, useAitCollege } from "@/components/college/brand";
import { cohortShort, sessionNumber, sessionTopic, studentAttended } from "@/components/college/college-data";
import { RecordingDialog, SessionRow } from "@/components/college/sessions";
import { ATTENDED, MAKEUP_TODAY, MY_PAST, MY_UPCOMING, STUDENT } from "@/components/campus/campus-data";
import { CampusEyebrow } from "@/components/campus/ui";

const addToCalendar = (s: LiveSession) =>
  toast.success("Added to your calendar", { description: `${sessionTopic(s.title)} · ${formatDayShort(s.date)}, ${formatTime(s.time)} IST (simulated)` });

export default function CampusSessionsPage() {
  const college = useAitCollege();
  const cohort = STUDENT.cohortId ? getCohort(STUDENT.cohortId) : undefined;
  const mentor = cohort ? getMentor(cohort.mentorId) : undefined;
  const [info, setInfo] = useState<LiveSession | null>(null);
  const [joining, setJoining] = useState<LiveSession | null>(null);
  const [watching, setWatching] = useState<LiveSession | null>(null);

  const all = [...MY_PAST, ...MY_UPCOMING, ...(MAKEUP_TODAY ? [MAKEUP_TODAY] : [])];
  const events: CalendarEvent[] = all.map((s) => ({
    id: s.id,
    date: s.date,
    time: s.time,
    title: s.cohortId === STUDENT.cohortId ? sessionTopic(s.title) : `Make-up · ${sessionTopic(s.title)}`,
    tone: s.cohortId !== STUDENT.cohortId ? "info" : s.date < DEMO_TODAY ? "muted" : "brand",
  }));
  const openEvent = (id: string) => {
    const s = all.find((x) => x.id === id);
    if (!s) return;
    if (s.date < DEMO_TODAY && s.recording) setWatching(s);
    else setInfo(s);
  };
  const recordings = [...MY_PAST].reverse();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow={<CampusEyebrow college={college} />}
        title="Live sessions"
        description={cohort ? `${cohort.name} · ${cohort.scheduleLabel} with ${mentor?.name ?? "your CDL mentor"}. Recordings appear within 24 hours.` : "Your live classes and recordings."}
      />

      {MAKEUP_TODAY && (
        <section
          className="flex flex-col gap-4 rounded-2xl border p-5 md:flex-row md:items-center"
          style={{ backgroundColor: tint(college.brandColor, 5), borderColor: tint(college.brandColor, 22) }}
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: college.brandColor }}>
            <Radio className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: college.brandColor }}>
              Today · {formatTime(MAKEUP_TODAY.time)} IST · open for make-up attendance
            </p>
            <h2 className="mt-0.5 font-heading text-lg font-semibold">{sessionTopic(MAKEUP_TODAY.title)}</h2>
            <p className="text-sm text-muted-foreground">
              {cohortShort(MAKEUP_TODAY.cohortId)}&apos;s class with {getMentor(MAKEUP_TODAY.mentorId)?.name}. Your T&amp;P cell allows Batch A students to join to catch up before Monday&apos;s mock interviews.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" className="h-10" onClick={() => MAKEUP_TODAY && addToCalendar(MAKEUP_TODAY)}>
              <CalendarPlus /> Remind me
            </Button>
            <Button className="h-10 px-5" onClick={() => setJoining(MAKEUP_TODAY ?? null)}>
              <Video /> Join
            </Button>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <MonthCalendar
          events={events}
          onEventClick={openEvent}
          headerExtra={
            <span className="mr-2 hidden items-center gap-3 text-xs text-muted-foreground md:flex">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px] bg-brand" /> My batch
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px] bg-info" /> Make-up
              </span>
            </span>
          }
        />
        <div className="h-fit rounded-2xl border bg-card p-5 shadow-xs">
          <SectionHeader title="Upcoming classes" description={`${MY_UPCOMING.length} remaining in ${cohortShort(STUDENT.cohortId)}`} />
          <div className="mt-2 divide-y">
            {MY_UPCOMING.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                showCohort={false}
                accent={college.brandColor}
                onOpen={() => setInfo(s)}
                actions={
                  s.date === DEMO_TODAY ? (
                    <Button size="sm" onClick={() => setJoining(s)}>
                      Join
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon-sm" aria-label={`Add ${sessionTopic(s.title)} to calendar`} onClick={() => addToCalendar(s)}>
                      <CalendarPlus />
                    </Button>
                  )
                }
              />
            ))}
          </div>
          {mentor && (
            <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-muted/50 p-3 text-sm">
              <Portrait avatar={mentor.avatar} name={mentor.name} className="size-8" />
              <span className="text-muted-foreground">
                Classes led by <span className="font-medium text-foreground">{mentor.name}</span>, CDL mentor
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Recordings"
          description={`You attended ${ATTENDED.length} of ${MY_PAST.length} classes so far. Missed one? Watch the recording.`}
          action={<DemoBadge>Attendance is synthetic</DemoBadge>}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recordings.map((s) => {
            const attended = studentAttended(STUDENT, s);
            return (
              <article key={s.id} className="flex flex-col rounded-xl border bg-card p-4 shadow-xs">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    Class {sessionNumber(s.title)} · {formatDate(s.date, "d MMM")}
                  </span>
                  {attended ? (
                    <span className="inline-flex items-center gap-1 font-medium text-success">
                      <CheckCircle2 className="size-3.5" /> Attended
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-medium text-warning">
                      <CircleAlert className="size-3.5" /> Missed
                    </span>
                  )}
                </div>
                <h3 className="mt-2 font-heading font-semibold">{sessionTopic(s.title)}</h3>
                <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" /> {s.recording ? formatClock(s.recording.durationSec) : `${s.durationMin} min`}
                  </span>
                  {s.recording && (
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3" /> {s.recording.views} views
                    </span>
                  )}
                </p>
                <Button variant={attended ? "outline" : "default"} size="sm" className="mt-4 h-8" disabled={!s.recording} onClick={() => setWatching(s)}>
                  <PlayCircle /> {attended ? "Rewatch" : "Watch recording"}
                </Button>
              </article>
            );
          })}
        </div>
      </section>

      {/* Upcoming session info */}
      <Dialog open={Boolean(info)} onOpenChange={(o) => !o && setInfo(null)}>
        <DialogContent className="sm:max-w-md">
          {info && (
            <>
              <DialogHeader>
                <DialogTitle>{info.title}</DialogTitle>
                <DialogDescription>
                  {formatDate(info.date, "EEEE, d MMMM")} · {formatTime(info.time)} IST · {info.durationMin} min · {relativeDay(info.date)}
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">{info.description}</p>
              <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">The join link activates 15 minutes before class. You&apos;ll also get a reminder from the {college.shortName} T&amp;P cell.</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => addToCalendar(info)}>
                  <CalendarPlus /> Add to calendar
                </Button>
                {info.date === DEMO_TODAY ? (
                  <Button
                    onClick={() => {
                      setJoining(info);
                      setInfo(null);
                    }}
                  >
                    <Video /> Join
                  </Button>
                ) : (
                  <Button onClick={() => setInfo(null)}>Done</Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Simulated join */}
      <Dialog open={Boolean(joining)} onOpenChange={(o) => !o && setJoining(null)}>
        <DialogContent className="sm:max-w-md">
          {joining && (
            <>
              <DialogHeader>
                <DialogTitle>You&apos;re in the waiting room</DialogTitle>
                <DialogDescription>
                  {sessionTopic(joining.title)} · starts {formatTime(joining.time)} IST
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-3 rounded-xl bg-navy p-6 text-center text-white">
                <span className="relative flex size-3">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-75" />
                  <span className="relative inline-flex size-3 rounded-full bg-brand" />
                </span>
                {getMentor(joining.mentorId) && <Portrait avatar={getMentor(joining.mentorId)!.avatar} name={getMentor(joining.mentorId)!.name} className="size-16" />}
                <p className="text-sm text-white/80">{getMentor(joining.mentorId)?.name} will admit you when class begins. Camera and mic are off by default.</p>
              </div>
              <p className="text-xs text-muted-foreground">Simulated classroom — no video call is started in this prototype.</p>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setJoining(null);
                    toast("You left the waiting room");
                  }}
                >
                  Leave
                </Button>
                <Button
                  onClick={() => {
                    toast.success("Attendance marked", { description: `${college.shortName} T&P cell will see you attended this make-up class (simulated).` });
                    setJoining(null);
                  }}
                >
                  Stay &amp; mark attendance
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <RecordingDialog session={watching} onOpenChange={(o) => !o && setWatching(null)} />
    </div>
  );
}
