"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  MonitorPlay,
  TrendingUp,
  TriangleAlert,
  UserPlus,
  Users,
} from "lucide-react";
import { getMentor } from "@/data";
import { DEMO_TODAY } from "@/data/constants";
import { formatDate, formatDayShort, formatTime, relativeDay } from "@/lib/format";
import type { LiveSession } from "@/lib/types";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { DemoBadge } from "@/components/shared/badges";
import { SectionHeader, StatCard } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { brandGradient, CollegeMark, ProviderBadge, useAitCollege, useCollegePrograms } from "@/components/college/brand";
import {
  AIT_COHORTS,
  AIT_SESSIONS,
  AIT_STUDENTS,
  attentionReasons,
  departmentComparison,
  overallProgress,
  programShort,
  programStats,
  SAMPLE_ASSESSMENT_RATE,
  SESSIONS_THIS_MONTH,
  sessionsForCohort,
  sessionTopic,
  weeksFor,
} from "@/components/college/college-data";
import { DepartmentChart, ProgramProgressChart, WeeklyActiveChart } from "@/components/college/charts";
import { RecordingDialog, SessionDetailSheet, SessionRow } from "@/components/college/sessions";

export default function CollegeDashboardPage() {
  const college = useAitCollege();
  const programs = useCollegePrograms();
  const [progressView, setProgressView] = useState("program");
  const [openSession, setOpenSession] = useState<LiveSession | null>(null);
  const [watching, setWatching] = useState<LiveSession | null>(null);

  const seatPct = Math.round((college.activeStudents / college.seats) * 100);
  const avgProgress = Math.round(AIT_STUDENTS.reduce((s, x) => s + overallProgress(x), 0) / AIT_STUDENTS.length);
  const cdlCount = programs.filter((p) => !p.collegeId).length;
  const ownCount = programs.length - cdlCount;

  const programRows = useMemo(
    () => programs.map((c) => ({ name: programShort(c), value: programStats(c.id).avgProgress, provided: Boolean(c.collegeId) })),
    [programs],
  );
  const deptRows = useMemo(() => departmentComparison(college.departments, 4), [college.departments]);
  const attention = useMemo(
    () =>
      AIT_STUDENTS.map((s) => ({ student: s, reasons: attentionReasons(s) }))
        .filter((x) => x.reasons.length)
        .sort((a, b) => overallProgress(a.student) - overallProgress(b.student)),
    [],
  );
  const upcoming = AIT_SESSIONS.filter((s) => s.date >= DEMO_TODAY).slice(0, 4);
  const weekly = weeksFor(8);
  const thisWeek = weekly[weekly.length - 1];
  const lastWeek = weekly[weekly.length - 2];
  const weekDelta = Math.round(((thisWeek.active - lastWeek.active) / lastWeek.active) * 100);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Co-branded institution header */}
      <section className="relative overflow-hidden rounded-2xl text-white shadow-sm" style={{ backgroundImage: brandGradient(college.brandColor) }}>
        <div className="absolute inset-0 bg-grid opacity-[0.08]" aria-hidden="true" />
        <div className="relative grid grid-cols-1 gap-6 p-5 md:p-7 lg:grid-cols-[1fr_minmax(280px,340px)] lg:items-center">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wider text-white/70 uppercase">College Portal · Welcome back, {college.contactName}</p>
            <div className="mt-3 flex items-center gap-3.5">
              <CollegeMark college={college} inverted className="size-14 rounded-2xl text-lg shadow-sm" />
              <div className="min-w-0">
                <h1 className="font-heading text-2xl leading-tight font-semibold md:text-[28px]">{college.name}</h1>
                <p className="mt-0.5 text-sm text-white/75">
                  {college.city}, {college.state} · {college.type} · {college.departments.length} departments
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/15 px-3 py-1 font-medium ring-1 ring-white/20">{college.plan} plan</span>
              <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
                Licence {formatDate(college.onboardedOn)} – {formatDate(college.licenceEnds)}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">Delivered on Career Design Lab</span>
            </div>
          </div>
          <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur-sm">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-white/70">Seats used</p>
                <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
                  {college.activeStudents}
                  <span className="text-base font-medium text-white/60"> / {college.seats}</span>
                </p>
              </div>
              <span className="text-sm font-medium text-white/80">{seatPct}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white" style={{ width: `${seatPct}%` }} />
            </div>
            <p className="mt-2 text-xs text-white/70">{college.seats - college.activeStudents} seats available on your licence</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm" className="h-8 bg-white text-foreground hover:bg-white/90">
                <Link href="/college/students">
                  <UserPlus /> Invite students
                </Link>
              </Button>
              <Button asChild size="sm" variant="ghost" className="h-8 text-white hover:bg-white/15 hover:text-white">
                <Link href="/campus">
                  <MonitorPlay /> Student portal
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Enrolled students" value={college.activeStudents} icon={Users} hint={`of ${college.seats} licensed seats`} />
        <StatCard label="Active programs" value={programs.length} icon={BookOpen} accent="info" hint={`${cdlCount} CDL · ${ownCount} by ${college.shortName}`} />
        <StatCard label="Average progress" value={`${avgProgress}%`} icon={TrendingUp} accent="brand" trend="+6 pts" hint="vs. last 4 weeks" />
        <StatCard label="Assessment completion" value={`${SAMPLE_ASSESSMENT_RATE}%`} icon={ClipboardCheck} accent="success" hint="career assessment taken" />
        <StatCard label="Sessions this month" value={SESSIONS_THIS_MONTH} icon={CalendarDays} accent="warning" hint="live classes · Oct 2026" className="col-span-2 md:col-span-1" />
      </section>

      {/* Assigned catalog */}
      <section className="space-y-4">
        <SectionHeader
          title="Assigned course catalog"
          description={`Programs available to ${college.shortName} students under the ${college.plan} licence.`}
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/college/programs">
                Manage programs <ArrowRight />
              </Link>
            </Button>
          }
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {programs.map((course) => {
            const stats = programStats(course.id);
            return (
              <Link
                key={course.id}
                href={course.collegeId ? "/college/content" : "/college/programs"}
                className="group flex gap-3 rounded-xl border bg-card p-3 shadow-xs transition hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <CourseThumbnail course={course} size="sm" className="w-24 shrink-0 self-start" />
                <div className="min-w-0 flex-1">
                  <ProviderBadge course={course} college={college} size="sm" />
                  <p className="mt-1.5 truncate text-sm font-semibold group-hover:text-primary">{course.title}</p>
                  <p className="text-xs text-muted-foreground">{stats.assigned ? `${stats.assigned} students assigned` : "Rollout pending"}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={stats.avgProgress} className="h-1.5 [&>[data-slot=progress-indicator]]:bg-brand" />
                    <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums">{stats.avgProgress}%</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Progress + attention */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-xs lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-base font-semibold md:text-lg">Student learning progress</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Average completion across enrolled students.</p>
            </div>
            <div className="flex items-center gap-2">
              <DemoBadge className="hidden sm:inline-flex" />
              <Tabs value={progressView} onValueChange={setProgressView}>
                <TabsList>
                  <TabsTrigger value="program" className="px-2.5">By program</TabsTrigger>
                  <TabsTrigger value="department" className="px-2.5">By department</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          <div className="mt-4">
            {progressView === "program" ? (
              <ProgramProgressChart rows={programRows} brandColor={college.brandColor} />
            ) : (
              <DepartmentChart rows={deptRows} className="h-64" />
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border bg-card p-5 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-heading text-base font-semibold md:text-lg">Needs attention</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Low progress or inactive for over 7 days.</p>
            </div>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning-soft text-warning">
              <TriangleAlert className="size-4" />
            </span>
          </div>
          <ul className="mt-4 flex-1 divide-y">
            {attention.map(({ student, reasons }) => (
              <li key={student.id}>
                <Link href={`/college/students?student=${student.id}`} className="group flex items-center gap-3 py-3">
                  <Portrait avatar={student.avatar} name={student.name} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium group-hover:text-primary">{student.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {student.department} · last active {relativeDay(student.lastActive).toLowerCase()}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {reasons.map((r) => (
                        <span key={r} className="rounded-md bg-warning-soft px-1.5 py-0.5 text-[11px] font-medium text-warning">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" size="sm" className="mt-2 w-full">
            <Link href="/college/students">View all students</Link>
          </Button>
        </div>
      </section>

      {/* Cohorts + upcoming sessions */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <SectionHeader
            title="Cohort overview"
            description="Live Cohort batches run by CDL mentors for your students."
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/college/cohorts">
                  Cohorts &amp; sessions <ArrowRight />
                </Link>
              </Button>
            }
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {AIT_COHORTS.map((cohort) => {
              const mentor = getMentor(cohort.mentorId);
              const members = AIT_STUDENTS.filter((s) => s.cohortId === cohort.id);
              const avg = members.length ? Math.round(members.reduce((s, x) => s + overallProgress(x), 0) / members.length) : 0;
              const next = sessionsForCohort(cohort.id).find((s) => s.date >= DEMO_TODAY);
              return (
                <div key={cohort.id} className="rounded-xl border bg-card p-4 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: college.brandColor }}>
                        {cohort.name.split("·")[1]?.trim()}
                      </p>
                      <p className="mt-0.5 text-sm font-medium">{cohort.scheduleLabel}</p>
                    </div>
                    <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success capitalize">{cohort.status}</span>
                  </div>
                  {mentor && (
                    <div className="mt-3 flex items-center gap-2">
                      <Portrait avatar={mentor.avatar} name={mentor.name} className="size-7" />
                      <span className="text-sm">{mentor.name}</span>
                    </div>
                  )}
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-muted/60 p-2">
                      <dt className="text-muted-foreground">Enrolled</dt>
                      <dd className="mt-0.5 text-sm font-semibold tabular-nums">
                        {cohort.enrolled}/{cohort.seats}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-2">
                      <dt className="text-muted-foreground">Avg progress</dt>
                      <dd className="mt-0.5 text-sm font-semibold tabular-nums">{avg}%</dd>
                    </div>
                  </dl>
                  {next && (
                    <button
                      type="button"
                      onClick={() => setOpenSession(next)}
                      className="mt-3 w-full rounded-lg border border-dashed px-3 py-2 text-left text-xs transition hover:bg-muted/60"
                    >
                      <span className="text-muted-foreground">Next class · </span>
                      <span className="font-medium">
                        {relativeDay(next.date) === "Today" ? "Today" : formatDayShort(next.date)}, {formatTime(next.time)}
                      </span>
                      <span className="mt-0.5 block truncate text-muted-foreground">{sessionTopic(next.title)}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs lg:col-span-2">
          <SectionHeader title="Upcoming live sessions" description="Next classes across both batches." />
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
        </div>
      </section>

      {/* Engagement */}
      <section className="rounded-2xl border bg-card p-5 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-semibold md:text-lg">Weekly active students</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{thisWeek.active}</span> active this week ({thisWeek.activeRate}% of enrolled) ·{" "}
              <span className={weekDelta >= 0 ? "font-medium text-success" : "font-medium text-destructive"}>
                {weekDelta >= 0 ? "+" : ""}
                {weekDelta}%
              </span>{" "}
              vs last week
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DemoBadge />
            <Button asChild variant="outline" size="sm">
              <Link href="/college/reports">
                <GraduationCap /> Engagement reports
              </Link>
            </Button>
          </div>
        </div>
        <WeeklyActiveChart data={weekly} className="mt-4" />
      </section>

      <SessionDetailSheet session={openSession} onOpenChange={(o) => !o && setOpenSession(null)} onWatch={(s) => { setOpenSession(null); setWatching(s); }} />
      <RecordingDialog session={watching} onOpenChange={(o) => !o && setWatching(null)} />
    </div>
  );
}
