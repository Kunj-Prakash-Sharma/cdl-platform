"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Building2, Clock, Eye, PlayCircle, Plus, Users, UsersRound } from "lucide-react";
import { courseDurationSec, courseVideoLessons, getCourse, getMentor } from "@/data";
import { FORMAT_META } from "@/data/constants";
import { formatDate, formatDuration } from "@/lib/format";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { FormatBadge, StatusPill } from "@/components/shared/badges";
import { PageHeader, SectionHeader } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CollegeOnlyChip, ProviderBadge, useAitCollege, useCollegePrograms } from "@/components/college/brand";
import { programStats } from "@/components/college/college-data";
import { RequestProgramDialog, type ProgramRequest } from "@/components/college/request-program-dialog";

export default function CollegeProgramsPage() {
  const college = useAitCollege();
  const programs = useCollegePrograms();
  const [requestOpen, setRequestOpen] = useState(false);
  const [requests, setRequests] = useState<ProgramRequest[]>([]);

  const cdl = programs.filter((p) => !p.collegeId);
  const own = programs.filter((p) => p.collegeId);
  const totalAssigned = programs.reduce((s, p) => s + programStats(p.id).assigned, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow={college.name}
        title="Assigned programs"
        description={`Programs included in ${college.shortName}'s ${college.plan} licence — CDL programs plus courses your institution provides on the platform.`}
        actions={
          <Button className="h-10 px-4" onClick={() => setRequestOpen(true)}>
            <Plus /> Request another program
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-xs">
          <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
            <BookOpen className="size-5" />
          </span>
          <div>
            <p className="font-heading text-xl font-semibold">{cdl.length}</p>
            <p className="text-xs text-muted-foreground">CDL programs licensed</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-xs">
          <span className="flex size-10 items-center justify-center rounded-lg text-white" style={{ backgroundColor: college.brandColor }}>
            <Building2 className="size-5" />
          </span>
          <div>
            <p className="font-heading text-xl font-semibold">{own.length}</p>
            <p className="text-xs text-muted-foreground">Provided by {college.shortName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-xs">
          <span className="flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <Users className="size-5" />
          </span>
          <div>
            <p className="font-heading text-xl font-semibold">{totalAssigned.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground">Program seats assigned to students</p>
          </div>
        </div>
      </div>

      {requests.length > 0 && (
        <section className="rounded-2xl border border-dashed bg-card p-5">
          <SectionHeader title="Pending requests" description="Awaiting confirmation from your CDL partner manager." />
          <ul className="mt-3 divide-y">
            {requests.map((r) => {
              const c = getCourse(r.courseId);
              if (!c) return null;
              return (
                <li key={r.courseId} className="flex flex-wrap items-center gap-3 py-3">
                  <CourseThumbnail course={c} size="sm" className="w-16" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {FORMAT_META[r.format].label} · {r.seats} students
                    </p>
                  </div>
                  <StatusPill tone="warning">Requested</StatusPill>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="space-y-4">
        {programs.map((course) => {
          const stats = programStats(course.id);
          const mentor = getMentor(course.instructorId);
          const previewHref = course.collegeId ? "/college/content" : `/courses/${course.id}`;
          return (
            <article key={course.id} className="grid overflow-hidden rounded-2xl border bg-card shadow-xs md:grid-cols-[280px_1fr]">
              <div className="p-3 md:pr-0">
                <CourseThumbnail course={course} />
              </div>
              <div className="flex min-w-0 flex-col gap-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <ProviderBadge course={course} college={college} />
                      {course.collegeId && <CollegeOnlyChip college={college} />}
                    </div>
                    <h2 className="font-heading text-lg font-semibold">{course.title}</h2>
                    <p className="max-w-2xl text-sm text-muted-foreground">{course.subtitle}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button asChild variant="outline">
                      <Link href={`/college/students?program=${course.id}`}>
                        <UsersRound /> Students
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href={previewHref}>
                        <Eye /> {course.collegeId ? "Manage content" : "Preview"}
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-xs text-muted-foreground">Levels</span>
                  {course.formats.map((f) => (
                    <FormatBadge key={f} format={f} showLevel />
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Students assigned</p>
                    <p className="mt-1 font-heading text-lg font-semibold tabular-nums">{stats.assigned || "—"}</p>
                    <p className="text-[11px] text-muted-foreground">{stats.assignedOn ? `since ${formatDate(stats.assignedOn)}` : "Rollout pending"}</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Average completion</p>
                    <p className="mt-1 font-heading text-lg font-semibold tabular-nums">{stats.avgProgress}%</p>
                    <Progress value={stats.avgProgress} className="mt-1.5 h-1.5 [&>[data-slot=progress-indicator]]:bg-brand" />
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Cohorts</p>
                    {stats.cohorts.length ? (
                      <ul className="mt-1 space-y-0.5 text-sm font-medium">
                        {stats.cohorts.map((c) => (
                          <li key={c.id} className="truncate">
                            {c.name.split("·")[1]?.trim()} <span className="font-normal text-muted-foreground">· {c.scheduleLabel.split("·")[0]}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-sm font-medium">Self-paced access</p>
                    )}
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Content</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                      <PlayCircle className="size-3.5 text-muted-foreground" /> {courseVideoLessons(course).length} video lessons
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3.5" /> {formatDuration(courseDurationSec(course))} · {course.durationLabel}
                    </p>
                  </div>
                </div>

                {mentor && (
                  <div className="flex items-center gap-2 border-t pt-3 text-sm">
                    <Portrait avatar={mentor.avatar} name={mentor.name} className="size-7" />
                    <span className="text-muted-foreground">
                      {course.collegeId ? "Delivered with" : "Lead mentor"} <span className="font-medium text-foreground">{mentor.name}</span>
                      {course.collegeId && ` · content by ${college.shortName} T&P cell`}
                    </span>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>

      <RequestProgramDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        college={college}
        requestedIds={requests.map((r) => r.courseId)}
        onRequested={(r) => setRequests((list) => [r, ...list])}
      />
    </div>
  );
}
