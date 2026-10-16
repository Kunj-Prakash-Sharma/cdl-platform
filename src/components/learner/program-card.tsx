"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Award, CalendarClock, CheckCircle2, PlayCircle, Radio, Sparkles } from "lucide-react";
import { cohortsForCourse, courseLessons, findLesson, getCohort, getMentor } from "@/data";
import { DEMO_TODAY } from "@/data/constants";
import { formatDate, formatDuration, formatTime, relativeDay } from "@/lib/format";
import type { Course, Enrollment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useCourseProgress } from "@/store/hooks";
import { FormatBadge, StatusPill } from "@/components/shared/badges";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { nextCohortClass } from "./hooks";
import { CHILD_LAST_ACTIVE, CHILD_LESSONS_DONE, LESSON_KIND_LABEL } from "./utils";
import { OwnerTag, TealProgress } from "./widgets";

type EnrolledCourse = Enrollment & { course: Course };

/** An upcoming Live Cohort the learner could upgrade to from Self-Paced. */
export function upgradeCohortFor(e: EnrolledCourse) {
  if (e.format !== "self-paced" || !e.course.formats.includes("live-cohort")) return undefined;
  return cohortsForCourse(e.courseId).find((c) => c.status === "upcoming" && c.startDate > DEMO_TODAY);
}

/** Enrolled programme card for the current user, with progress and a resume action. */
export function ProgramCard({ enrollment, owner, className }: { enrollment: EnrolledCourse; owner?: string; className?: string }) {
  const { course } = enrollment;
  const router = useRouter();
  const setCheckout = useDemoStore((s) => s.setCheckout);
  const progress = useCourseProgress(course);
  const mentor = getMentor(course.instructorId);
  const cohort = enrollment.cohortId ? getCohort(enrollment.cohortId) : undefined;
  const nextClass = nextCohortClass(enrollment.cohortId);
  const next = progress.nextLessonId ? findLesson(course, progress.nextLessonId) : undefined;
  const upgrade = !progress.isComplete ? upgradeCohortFor(enrollment) : undefined;

  return (
    <article className={cn("flex flex-col overflow-hidden rounded-2xl border bg-card shadow-xs md:flex-row", className)}>
      <Link href={`/dashboard/learn/${course.id}`} className="block shrink-0 p-2 md:w-60 md:pr-0" aria-label={`Open ${course.title}`}>
        <CourseThumbnail course={course} showCategory={false} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {owner && <OwnerTag>{owner}</OwnerTag>}
          <FormatBadge format={enrollment.format} />
          {progress.isComplete ? (
            <StatusPill tone="success">Completed</StatusPill>
          ) : progress.done === 0 ? (
            <StatusPill tone="neutral">Not started</StatusPill>
          ) : (
            <StatusPill tone="brand">In progress</StatusPill>
          )}
        </div>
        <div>
          <h3 className="font-heading text-[17px] leading-snug font-semibold">
            <Link href={`/dashboard/learn/${course.id}`} className="hover:text-primary">
              {course.title}
            </Link>
          </h3>
          {mentor && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Portrait avatar={mentor.avatar} name={mentor.name} className="size-5" />
              {mentor.name} · {mentor.title}
            </p>
          )}
        </div>

        {cohort && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-brand-soft/60 px-3 py-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-brand">
              <Radio className="size-3.5" />
              {cohort.name}
            </span>
            <span className="text-muted-foreground">{cohort.scheduleLabel}</span>
            {nextClass && (
              <span className="inline-flex items-center gap-1 text-foreground">
                <CalendarClock className="size-3.5 text-brand" />
                Next class {relativeDay(nextClass.date).toLowerCase()}, {formatTime(nextClass.time)}
              </span>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {progress.done} of {progress.total} lessons
            </span>
            <span className="font-semibold tabular-nums">{progress.percent}%</span>
          </div>
          <TealProgress value={progress.percent} />
        </div>

        <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {progress.isComplete ? (
            <p className="flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2 className="size-4" /> All lessons complete
            </p>
          ) : next ? (
            <p className="min-w-0 text-sm">
              <span className="text-muted-foreground">Up next: </span>
              <span className="font-medium">{next.lesson.title}</span>
              <span className="text-muted-foreground">
                {" "}
                · {LESSON_KIND_LABEL[next.lesson.kind]} · {formatDuration(next.lesson.durationSec)}
              </span>
            </p>
          ) : (
            <span />
          )}
          <div className="flex shrink-0 flex-wrap gap-2">
            {progress.isComplete ? (
              <>
                <Button asChild variant="outline" className="h-9">
                  <Link href={`/dashboard/learn/${course.id}`}>Revisit lessons</Link>
                </Button>
                <Button asChild className="h-9 bg-brand text-brand-foreground hover:bg-brand/90">
                  <Link href="/dashboard/certificates">
                    <Award /> View certificate
                  </Link>
                </Button>
              </>
            ) : (
              <Button asChild className="h-9 bg-brand px-4 text-brand-foreground hover:bg-brand/90">
                <Link href={`/dashboard/learn/${course.id}`}>
                  <PlayCircle /> {progress.done === 0 ? "Start learning" : "Continue"}
                </Link>
              </Button>
            )}
          </div>
        </div>

        {upgrade && (
          <div className="flex flex-col gap-3 rounded-xl border border-primary/15 bg-secondary/60 p-3 sm:flex-row sm:items-center">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium">Join the {formatDate(upgrade.startDate, "MMMM")} Live Cohort</p>
              <p className="text-xs text-muted-foreground">
                {upgrade.scheduleLabel} · starts {formatDate(upgrade.startDate, "d MMM")} with {getMentor(upgrade.mentorId)?.name}. Your progress carries over.
              </p>
            </div>
            <Button
              variant="outline"
              className="h-8 shrink-0 border-primary/25 bg-background"
              onClick={() => {
                setCheckout({ kind: "course", refId: course.id, format: "live-cohort" });
                router.push("/checkout");
              }}
            >
              Upgrade <ArrowRight />
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

/** Read-only card for the child's programme in parent mode (illustrative progress). */
export function ChildProgramCard({ enrollment, childName, className }: { enrollment: EnrolledCourse; childName: string; className?: string }) {
  const { course } = enrollment;
  const total = courseLessons(course).length;
  const done = Math.min(total, CHILD_LESSONS_DONE[course.id] ?? 0);
  const percent = total ? Math.round((done / total) * 100) : 0;
  const complete = done === total;
  const mentor = getMentor(course.instructorId);
  const lastActive = CHILD_LAST_ACTIVE[course.id];
  return (
    <article className={cn("flex flex-col overflow-hidden rounded-2xl border bg-card shadow-xs md:flex-row", className)}>
      <div className="shrink-0 p-2 md:w-60 md:pr-0">
        <CourseThumbnail course={course} showCategory={false} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <OwnerTag tone="brand">{childName}&apos;s programme</OwnerTag>
          <FormatBadge format={enrollment.format} />
          <StatusPill tone={complete ? "success" : "brand"}>{complete ? "Completed" : "In progress"}</StatusPill>
        </div>
        <div>
          <h3 className="font-heading text-[17px] leading-snug font-semibold">{course.title}</h3>
          {mentor && <p className="mt-1 text-xs text-muted-foreground">With {mentor.name} · enrolled {formatDate(enrollment.enrolledOn)}</p>}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {done} of {total} lessons{lastActive ? ` · last active ${formatDate(lastActive, "d MMM")}` : ""}
            </span>
            <span className="font-semibold tabular-nums">{percent}%</span>
          </div>
          <TealProgress value={percent} />
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Progress shared from {childName}&apos;s learner account (illustrative).</p>
          <Button asChild variant="outline" className="h-8">
            <Link href={`/courses/${course.id}`}>
              View course <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
