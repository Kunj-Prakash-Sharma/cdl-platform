"use client";

import { useMemo, useState } from "react";
import { CalendarRange, Download, PlayCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { getCourse, getMentor } from "@/data";
import { DEMO_TODAY } from "@/data/constants";
import { formatDate, formatDayShort, formatTime } from "@/lib/format";
import type { LiveSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DemoBadge, FormatBadge } from "@/components/shared/badges";
import { MonthCalendar, type CalendarEvent } from "@/components/shared/month-calendar";
import { EmptyState, PageHeader, SectionHeader } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAitCollege } from "@/components/college/brand";
import {
  AIT_COHORTS,
  AIT_SESSIONS,
  AIT_STUDENTS,
  cohortShort,
  overallProgress,
  sessionAttendance,
  sessionsForCohort,
  sessionTopic,
} from "@/components/college/college-data";
import { RecordingDialog, SessionDetailSheet, SessionRow } from "@/components/college/sessions";

const COHORT_TONE: Record<string, CalendarEvent["tone"]> = { "coh-ait-a": "primary", "coh-ait-b": "brand" };

export default function CollegeCohortsPage() {
  const college = useAitCollege();
  const [filter, setFilter] = useState("all");
  const [openSession, setOpenSession] = useState<LiveSession | null>(null);
  const [watching, setWatching] = useState<LiveSession | null>(null);

  const sessions = useMemo(() => (filter === "all" ? AIT_SESSIONS : AIT_SESSIONS.filter((s) => s.cohortId === filter)), [filter]);
  const upcoming = sessions.filter((s) => s.date >= DEMO_TODAY);
  const past = sessions.filter((s) => s.date < DEMO_TODAY).reverse();
  const events: CalendarEvent[] = sessions.map((s) => ({
    id: s.id,
    date: s.date,
    time: s.time,
    title: `${cohortShort(s.cohortId).replace("Batch ", "")} · ${sessionTopic(s.title)}`,
    tone: COHORT_TONE[s.cohortId ?? ""] ?? "muted",
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow={college.name}
        title="Cohorts & sessions"
        description="Live Cohort batches for your students, delivered by CDL mentors in the evening (IST). Recordings are available after every class."
        actions={
          <Button
            variant="outline"
            className="h-10 px-4"
            onClick={() => toast.success("Schedule exported", { description: `${AIT_SESSIONS.length} sessions saved as ${college.shortName}-cohort-schedule.ics (simulated).` })}
          >
            <Download /> Export schedule
          </Button>
        }
      />

      {/* Cohort cards */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {AIT_COHORTS.map((cohort) => {
          const mentor = getMentor(cohort.mentorId);
          const course = getCourse(cohort.courseId);
          const list = sessionsForCohort(cohort.id);
          const done = list.filter((s) => s.date < DEMO_TODAY);
          const next = list.find((s) => s.date >= DEMO_TODAY);
          const members = AIT_STUDENTS.filter((s) => s.cohortId === cohort.id);
          const avg = members.length ? Math.round(members.reduce((s, x) => s + overallProgress(x), 0) / members.length) : 0;
          const attendance = done.map(sessionAttendance).filter(Boolean) as NonNullable<ReturnType<typeof sessionAttendance>>[];
          const avgAttendance = attendance.length ? Math.round(attendance.reduce((s, a) => s + a.rate, 0) / attendance.length) : 0;
          return (
            <article key={cohort.id} className="overflow-hidden rounded-2xl border bg-card shadow-xs">
              <div className="h-1.5" style={{ backgroundColor: cohort.id === "coh-ait-a" ? "var(--chart-1)" : "var(--chart-2)" }} />
              <div className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-heading text-lg font-semibold">{cohort.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {course?.title} · {formatDate(cohort.startDate, "d MMM")} – {formatDate(cohort.endDate)}
                    </p>
                  </div>
                  <FormatBadge format="live-cohort" showLevel />
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  {mentor && (
                    <div className="flex items-center gap-2.5">
                      <Portrait avatar={mentor.avatar} name={mentor.name} className="size-10" />
                      <div>
                        <p className="text-sm font-medium">{mentor.name}</p>
                        <p className="text-xs text-muted-foreground">CDL mentor</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarRange className="size-4 text-muted-foreground" />
                    {cohort.scheduleLabel}
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Metric label="Enrolled" value={`${cohort.enrolled}/${cohort.seats}`}>
                    <Progress value={(cohort.enrolled / cohort.seats) * 100} className="mt-1.5 h-1" />
                  </Metric>
                  <Metric label="Classes held" value={`${done.length} of ${list.length}`} />
                  <Metric label="Avg attendance" value={`${avgAttendance}%`} />
                  <Metric label="Avg progress" value={`${avg}%`} warn={avg < 40} />
                </dl>
                {next && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2.5">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Next: </span>
                      <span className="font-medium">{sessionTopic(next.title)}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        · {next.date === DEMO_TODAY ? "Today" : formatDayShort(next.date)}, {formatTime(next.time)}
                      </span>
                    </p>
                    <Button size="sm" variant="outline" onClick={() => setOpenSession(next)}>
                      Details
                    </Button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {/* Calendar + lists */}
      <section className="space-y-4">
        <SectionHeader
          title="Session calendar"
          description="Click a class for details, attendance and recordings."
          action={
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList>
                <TabsTrigger value="all" className="px-2.5">All</TabsTrigger>
                <TabsTrigger value="coh-ait-a" className="px-2.5">Batch A</TabsTrigger>
                <TabsTrigger value="coh-ait-b" className="px-2.5">Batch B</TabsTrigger>
              </TabsList>
            </Tabs>
          }
        />
        <MonthCalendar
          events={events}
          onEventClick={(id) => setOpenSession(AIT_SESSIONS.find((s) => s.id === id) ?? null)}
          headerExtra={
            <span className="mr-2 hidden items-center gap-3 text-xs text-muted-foreground md:flex">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px] bg-chart-1" /> Batch A
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px] bg-chart-2" /> Batch B
              </span>
            </span>
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-card p-5 shadow-xs">
            <SectionHeader title={`Upcoming sessions (${upcoming.length})`} description="Send reminders or add classes to the T&P calendar." />
            {upcoming.length ? (
              <div className="mt-2 divide-y">
                {upcoming.map((s) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    accent={college.brandColor}
                    onOpen={() => setOpenSession(s)}
                    actions={
                      <Button variant="ghost" size="sm" onClick={() => setOpenSession(s)}>
                        Details
                      </Button>
                    }
                  />
                ))}
              </div>
            ) : (
              <EmptyState icon={CalendarRange} title="No upcoming classes" description="All classes for this batch have been held." className="mt-4" />
            )}
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-xs">
            <SectionHeader title={`Past sessions (${past.length})`} description="Attendance and recordings for classes already held." action={<DemoBadge>Synthetic attendance</DemoBadge>} />
            <div className="mt-2 divide-y">
              {past.map((s) => {
                const a = sessionAttendance(s);
                return (
                  <SessionRow
                    key={s.id}
                    session={s}
                    onOpen={() => setOpenSession(s)}
                    actions={
                      <>
                        {a && (
                          <span className={cn("hidden items-center gap-1 text-xs tabular-nums sm:inline-flex", a.rate < 80 ? "text-warning" : "text-muted-foreground")} title="Attendance">
                            <Users className="size-3" />
                            {a.rate}%
                          </span>
                        )}
                        {s.recording && (
                          <Button variant="outline" size="sm" onClick={() => setWatching(s)}>
                            <PlayCircle /> Watch
                          </Button>
                        )}
                      </>
                    }
                  />
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <SessionDetailSheet
        session={openSession}
        onOpenChange={(o) => !o && setOpenSession(null)}
        onWatch={(s) => {
          setOpenSession(null);
          setWatching(s);
        }}
      />
      <RecordingDialog session={watching} onOpenChange={(o) => !o && setWatching(null)} />
    </div>
  );
}

function Metric({ label, value, warn, children }: { label: string; value: string; warn?: boolean; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/60 p-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("mt-0.5 font-heading text-base font-semibold tabular-nums", warn && "text-warning")}>{value}</dd>
      {children}
    </div>
  );
}
