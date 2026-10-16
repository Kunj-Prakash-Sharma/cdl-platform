"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpenText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardCheck,
  ExternalLink,
  Lock,
  PlayCircle,
  Send,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { courseLessons, getCourse, getMentor } from "@/data";
import { formatDuration } from "@/lib/format";
import type { Course, Lesson } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { FormatBadge } from "@/components/shared/badges";
import { Portrait } from "@/components/shared/portrait";
import { VideoPlayer } from "@/components/shared/video-player";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CollegeMark, ProviderBadge, useAitCollege } from "@/components/college/brand";
import { STUDENT, studentFormat } from "@/components/campus/campus-data";

export default function CampusLearnPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const course = getCourse(courseId);
  if (!course) notFound();
  if (!STUDENT.assignedCourseIds.includes(course.id)) return <RestrictedAccess course={course} />;
  return <CoursePlayer key={course.id} course={course} />;
}

// ---------- Restricted access (institution-specific access control, simulated) ----------

function RestrictedAccess({ course }: { course: Course }) {
  const college = useAitCollege();
  const inCollegePlan = college.assignedCourseIds.includes(course.id);
  const otherInstitution = Boolean(course.collegeId && course.collegeId !== college.id);
  const title = otherInstitution
    ? "This program belongs to another institution"
    : inCollegePlan
      ? "This program hasn't been assigned to you yet"
      : `This program isn't part of ${college.name}'s plan`;
  const body = otherInstitution
    ? "Institution-provided programs are only visible to students of the college that created them."
    : inCollegePlan
      ? `${course.title} is included in ${college.shortName}'s licence, but your T&P cell hasn't assigned it to your batch. Ask them to add it to your programs.`
      : `Your student account gives you access to the programs ${college.shortName} has licensed for you. ${course.title} is available to individual learners in the CDL public catalog.`;

  return (
    <div className="mx-auto max-w-3xl py-4 md:py-10">
      <Link href="/campus/courses" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> My programs
      </Link>
      <div className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-xs">
        <div className="relative">
          <CourseThumbnail course={course} size="lg" className="aspect-auto h-44 rounded-none opacity-40 grayscale md:h-52" />
          <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[2px]">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-background shadow-md ring-1 ring-border">
              <Lock className="size-7 text-foreground" />
            </span>
          </div>
        </div>
        <div className="space-y-4 p-6 text-center md:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1 text-xs font-medium text-warning">
            <ShieldAlert className="size-3.5" /> Restricted · {college.shortName} student access
          </span>
          <h1 className="font-heading text-xl font-semibold text-balance md:text-2xl">{title}</h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">{body}</p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button asChild className="h-10 px-4">
              <Link href="/campus/courses">
                <ArrowLeft /> Back to my programs
              </Link>
            </Button>
            {!otherInstitution && (
              <Button
                variant="outline"
                className="h-10 px-4"
                onClick={() =>
                  toast.success("Request sent to your T&P cell", {
                    description: `${college.contactName} will review adding ${course.title} to your programs (simulated).`,
                  })
                }
              >
                <Send /> Ask T&amp;P cell to add it
              </Button>
            )}
            {!course.collegeId && (
              <Button asChild variant="ghost" className="h-10 px-4">
                <Link href={`/courses/${course.id}`}>
                  View in public catalog <ExternalLink />
                </Link>
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 border-t bg-muted/40 px-6 py-3 text-xs text-muted-foreground">
          <CollegeMark college={college} className="size-6 rounded-md text-[9px]" />
          Access is managed by {college.name} · Signed in as {STUDENT.name}
        </div>
      </div>
    </div>
  );
}

// ---------- Player ----------

function CoursePlayer({ course }: { course: Course }) {
  const college = useAitCollege();
  const lessons = useMemo(() => courseLessons(course), [course]);
  const seededDone = Math.round(((STUDENT.progress[course.id] ?? 0) / 100) * lessons.length);
  const [completed, setCompleted] = useState<Set<string>>(() => new Set(lessons.slice(0, seededDone).map((l) => l.id)));
  const [currentId, setCurrentId] = useState(() => (lessons[seededDone] ?? lessons[0]).id);

  const index = lessons.findIndex((l) => l.id === currentId);
  const lesson = lessons[index];
  const chapterIndex = course.chapters.findIndex((c) => c.lessons.some((l) => l.id === currentId));
  const chapter = course.chapters[chapterIndex];
  const lessonInChapter = chapter.lessons.findIndex((l) => l.id === currentId);
  const percent = Math.round((completed.size / lessons.length) * 100);
  const isDone = completed.has(currentId);
  const mentor = getMentor(course.instructorId);
  const prev = lessons[index - 1];
  const next = lessons[index + 1];

  const setDone = (id: string, done: boolean) =>
    setCompleted((s) => {
      const nextSet = new Set(s);
      if (done) nextSet.add(id);
      else nextSet.delete(id);
      return nextSet;
    });

  const markComplete = () => {
    if (isDone) {
      setDone(currentId, false);
      return;
    }
    setDone(currentId, true);
    const allDone = completed.size + 1 === lessons.length;
    toast.success(allDone ? "Program complete!" : "Lesson completed", {
      description: allDone ? `You've finished ${course.title}. Your T&P cell can now see 100% progress.` : next ? `Up next: ${next.title}` : undefined,
    });
    if (next && !allDone) setCurrentId(next.id);
  };

  const contextLabel = `Chapter ${chapterIndex + 1} · Lesson ${lessonInChapter + 1}`;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 space-y-2">
          <Link href="/campus/courses" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> My programs
          </Link>
          <div className="flex flex-wrap items-center gap-1.5">
            <ProviderBadge course={course} college={college} size="sm" />
            <FormatBadge format={studentFormat(course.id)} short className="h-5 px-2 text-[11px]" />
          </div>
          <h1 className="font-heading text-xl font-semibold md:text-2xl">{course.title}</h1>
        </div>
        <div className="w-full max-w-xs space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {completed.size} of {lessons.length} lessons
            </span>
            <span className="font-semibold tabular-nums">{percent}%</span>
          </div>
          <Progress value={percent} className="h-2 [&>[data-slot=progress-indicator]]:bg-brand" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          {lesson.kind === "video" ? (
            <VideoPlayer
              course={course}
              lesson={lesson}
              contextLabel={contextLabel}
              onEnded={() => {
                if (!completed.has(lesson.id)) {
                  setDone(lesson.id, true);
                  toast.success("Lesson completed", { description: "Marked complete automatically when the video finished." });
                }
              }}
              onPrev={prev ? () => setCurrentId(prev.id) : undefined}
              onNext={next ? () => setCurrentId(next.id) : undefined}
            />
          ) : (
            <NonVideoLesson lesson={lesson} course={course} brandColor={college.brandColor} collegeShort={college.shortName} />
          )}

          <div className="rounded-2xl border bg-card p-5 shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  {contextLabel} · {chapter.title}
                </p>
                <h2 className="mt-1 font-heading text-lg font-semibold">{lesson.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {lesson.summary ??
                    (lesson.kind === "video"
                      ? `A recorded lesson from ${course.title}. Watch it end to end, then mark it complete to update your progress for the ${college.shortName} T&P cell.`
                      : lesson.kind === "quiz"
                        ? "A short knowledge check to confirm what you've learned in this chapter."
                        : "A short reading to go with this chapter.")}
                </p>
              </div>
              <Button onClick={markComplete} variant={isDone ? "outline" : "default"} className={cn("h-10 shrink-0 px-4", !isDone && "bg-brand text-brand-foreground hover:bg-brand/90")}>
                {isDone ? (
                  <>
                    <CheckCircle2 className="text-success" /> Completed
                  </>
                ) : (
                  <>
                    <CheckCircle2 /> Mark complete
                  </>
                )}
              </Button>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 border-t pt-4">
              <Button variant="outline" disabled={!prev} onClick={() => prev && setCurrentId(prev.id)}>
                <ChevronLeft /> <span className="hidden sm:inline">Previous</span>
              </Button>
              {mentor && (
                <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
                  <Portrait avatar={mentor.avatar} name={mentor.name} className="size-7" />
                  {mentor.name}
                </div>
              )}
              <Button variant="outline" disabled={!next} onClick={() => next && setCurrentId(next.id)}>
                <span className="hidden sm:inline">Next lesson</span> <ChevronRight />
              </Button>
            </div>
          </div>
        </div>

        <aside className="h-fit overflow-hidden rounded-2xl border bg-card shadow-xs lg:sticky lg:top-20">
          <div className="border-b px-4 py-3">
            <h2 className="font-heading text-sm font-semibold">Course content</h2>
            <p className="text-xs text-muted-foreground">
              {course.chapters.length} chapters · {lessons.length} lessons
            </p>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {course.chapters.map((ch, ci) => (
              <div key={ch.id} className="border-b last:border-b-0">
                <p className="bg-muted/40 px-4 py-2 text-xs font-semibold">
                  {ci + 1}. {ch.title}
                </p>
                <ul>
                  {ch.lessons.map((l) => {
                    const active = l.id === currentId;
                    const done = completed.has(l.id);
                    return (
                      <li key={l.id}>
                        <button
                          type="button"
                          onClick={() => setCurrentId(l.id)}
                          aria-current={active ? "true" : undefined}
                          className={cn("flex w-full items-start gap-2.5 px-4 py-2.5 text-left transition hover:bg-muted/60", active && "bg-secondary hover:bg-secondary")}
                        >
                          {done ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />}
                          <span className="min-w-0 flex-1">
                            <span className={cn("block text-sm leading-snug", active && "font-medium text-primary")}>{l.title}</span>
                            <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <LessonIcon kind={l.kind} /> {formatDuration(l.durationSec)}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function LessonIcon({ kind }: { kind: Lesson["kind"] }) {
  if (kind === "video") return <PlayCircle className="size-3" />;
  if (kind === "quiz") return <ClipboardCheck className="size-3" />;
  return <BookOpenText className="size-3" />;
}

function NonVideoLesson({ lesson, course, brandColor, collegeShort }: { lesson: Lesson; course: Course; brandColor: string; collegeShort: string }) {
  if (lesson.kind === "quiz") {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-6 text-center shadow-xs">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <ClipboardCheck className="size-7" />
        </span>
        <h2 className="font-heading text-xl font-semibold">{lesson.title}</h2>
        <p className="max-w-md text-sm text-muted-foreground">Knowledge check · about {formatDuration(lesson.durationSec)}. Quizzes for your programs live under Assignments &amp; Quizzes.</p>
        <Button asChild className="mt-1">
          <Link href="/campus/assignments">Open Assignments &amp; Quizzes</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-xs md:p-8">
      <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: course.collegeId ? brandColor : undefined }}>
        {course.collegeId ? `${collegeShort} Training & Placement Cell` : "Reading"}
      </p>
      <h2 className="mt-1 font-heading text-xl font-semibold">{lesson.title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm">
        {(course.collegeId ? DRIVE_CALENDAR : course.outcomes).map((l) => (
          <li key={l} className="flex gap-2.5">
            <span className="mt-2 size-1.5 shrink-0 rounded-full" style={{ backgroundColor: brandColor }} />
            {l}
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs text-muted-foreground">Reading · {formatDuration(lesson.durationSec)}{course.collegeId ? " · dates are illustrative" : ""}</p>
    </div>
  );
}

const DRIVE_CALENDAR = [
  "Phase 1 · 27 Oct – 7 Nov: Pre-placement talks (Infosys, L&T, Tata Motors, Persistent)",
  "Phase 2 · 10 Nov – 28 Nov: Aptitude tests and group discussions on campus",
  "Phase 3 · 1 Dec onwards: Technical and HR interviews, offer roll-out",
  "Eligibility: 6.5 CGPA, no active backlogs, resume approved by the T&P cell",
  "One-offer policy: students accepting a dream-company offer exit the drive",
];
