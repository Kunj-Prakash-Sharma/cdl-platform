"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, CalendarDays, CloudUpload, ExternalLink, Layers, PlayCircle, Settings2, Star, Users } from "lucide-react";
import { courseDurationSec, courseLessons, courseVideoLessons } from "@/data";
import { formatDate, formatDuration, formatNumber } from "@/lib/format";
import { ContentThumb, UploadVideoDialog } from "@/components/mentor/content-dialogs";
import { CONTENT_STATUS_LABEL, myCohorts, myCourses, useMentorContent } from "@/components/mentor/mentor-data";
import { AutoStatus, FormatBadge } from "@/components/shared/badges";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { PageHeader, StatCard } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useCourses } from "@/store/hooks";

export default function MentorCoursesPage() {
  const content = useMentorContent();
  const allCourses = useCourses();
  const [upload, setUpload] = useState<{ open: boolean; courseId?: string }>({ open: false });

  const totalLearners = myCourses.reduce((s, c) => s + c.learners, 0);
  const activeCohorts = myCohorts.filter((c) => c.status === "running").length;
  const published = content.filter((c) => c.status === "published").length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="My Courses"
        description="Programmes assigned to you. Open one to manage chapters, lessons and resources — changes go to the CDL team for review before learners see them."
        actions={
          <Button className="h-10 bg-brand px-4 text-brand-foreground hover:bg-brand/90" onClick={() => setUpload({ open: true })}>
            <CloudUpload /> Upload lesson
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Assigned courses" value={myCourses.length} icon={BookOpen} accent="primary" />
        <StatCard label="Learners" value={formatNumber(totalLearners)} icon={Users} accent="brand" hint="all formats" />
        <StatCard label="Running cohorts" value={activeCohorts} icon={CalendarDays} accent="info" hint={`${myCohorts.length - activeCohorts} upcoming`} />
        <StatCard label="Published videos" value={published} icon={PlayCircle} accent="success" hint={`${content.length - published} pending`} />
      </div>

      <div className="space-y-5">
        {myCourses.map((base) => {
          const course = allCourses.find((c) => c.id === base.id) ?? base;
          const cohorts = myCohorts.filter((c) => c.courseId === course.id);
          const items = content.filter((c) => c.courseId === course.id);
          const pending = items.filter((c) => c.status !== "published");
          return (
            <article key={course.id} className="grid grid-cols-1 gap-5 rounded-2xl border bg-card p-4 shadow-xs md:grid-cols-[280px_1fr] md:p-5">
              <div className="space-y-3">
                <CourseThumbnail course={course} />
                <div className="flex flex-wrap gap-1.5">
                  {course.formats.map((f) => (
                    <FormatBadge key={f} format={f} short />
                  ))}
                </div>
              </div>
              <div className="flex min-w-0 flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-lg font-semibold">{course.title}</h2>
                      <AutoStatus status={course.status} />
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{course.subtitle}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/courses/${course.id}`}>
                        <ExternalLink /> Public page
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/mentor/courses/${course.id}`}>
                        <Settings2 /> Manage curriculum
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Learners</p>
                    <p className="font-semibold tabular-nums">{formatNumber(course.learners)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rating</p>
                    <p className="flex items-center gap-1 font-semibold">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" /> {course.rating.toFixed(1)}
                      <span className="text-xs font-normal text-muted-foreground">({formatNumber(course.reviewCount)})</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Curriculum</p>
                    <p className="font-semibold">
                      {course.chapters.length} ch · {courseLessons(course).length} lessons
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Runtime</p>
                    <p className="font-semibold">{formatDuration(courseDurationSec(course))}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      <Layers className="size-3.5" /> Cohorts
                    </p>
                    <ul className="space-y-2">
                      {cohorts.map((co) => (
                        <li key={co.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{co.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {co.scheduleLabel} · {co.enrolled}/{co.seats} seats · from {formatDate(co.startDate, "d MMM")}
                            </p>
                          </div>
                          <AutoStatus status={co.status} />
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      <PlayCircle className="size-3.5" /> Content · {courseVideoLessons(course).length} published videos
                    </p>
                    {pending.length ? (
                      <ul className="space-y-2">
                        {pending.map((c) => (
                          <li key={c.id} className="flex items-center gap-3 rounded-lg border px-2 py-1.5">
                            <ContentThumb courseId={c.courseId} durationSec={c.durationSec} className="w-14" />
                            <p className="min-w-0 flex-1 truncate text-sm">{c.title}</p>
                            <AutoStatus status={c.status} label={CONTENT_STATUS_LABEL[c.status]} />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="rounded-lg border border-dashed px-3 py-3 text-xs text-muted-foreground">Everything is published — no uploads waiting.</p>
                    )}
                    <div className="mt-2 flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="text-brand" onClick={() => setUpload({ open: true, courseId: course.id })}>
                        <CloudUpload /> Upload a lesson to this course
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <UploadVideoDialog open={upload.open} onOpenChange={(open) => setUpload((u) => ({ ...u, open }))} defaultCourseId={upload.courseId} />
    </div>
  );
}
