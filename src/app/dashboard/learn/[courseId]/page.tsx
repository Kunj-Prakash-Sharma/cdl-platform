"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { ArrowLeft, Award, CalendarClock, Check, ChevronLeft, ChevronRight, Circle, Clock, ListVideo, Lock, PartyPopper, Radio } from "lucide-react";
import { toast } from "sonner";
import { courseDurationSec, courseLessons, findLesson, getCohort, getCourse, getMentor } from "@/data";
import { formatDuration, formatTime, relativeDay } from "@/lib/format";
import type { Course, Lesson } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useCourseProgress, useEnrollment } from "@/store/hooks";
import { FormatBadge } from "@/components/shared/badges";
import { Portrait } from "@/components/shared/portrait";
import { VideoPlayer } from "@/components/shared/video-player";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { nextCohortClass, useTouchLesson } from "@/components/learner/hooks";
import { Curriculum, DiscussionPanel, LockedLesson, QuizLessonView, ReadingView, ResourcesPanel, TranscriptPanel } from "@/components/learner/player-parts";
import { LESSON_KIND_LABEL, lessonContextLabel } from "@/components/learner/utils";
import { ProgressRing, TealProgress } from "@/components/learner/widgets";

export default function CoursePlayerPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const course = getCourse(courseId);
  if (!course) notFound();
  return <Player key={course.id} course={course} />;
}

function Player({ course }: { course: Course }) {
  const enrollment = useEnrollment(course.id);
  const enrolled = Boolean(enrollment);
  const progress = useCourseProgress(course);
  const setLessonComplete = useDemoStore((s) => s.setLessonComplete);
  const contentItems = useDemoStore((s) => s.contentItems);
  const touch = useTouchLesson();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState("overview");
  const [sheetOpen, setSheetOpen] = useState(false);

  const lessons = useMemo(() => courseLessons(course), [course]);
  const canAccess = (l: Lesson) => enrolled || Boolean(l.preview);
  const playable = enrolled ? lessons : lessons.filter((l) => l.preview);
  const defaultId = enrolled ? (progress.nextLessonId ?? lessons[0].id) : (playable[0]?.id ?? lessons[0].id);
  const currentId = selectedId ?? defaultId;
  const found = findLesson(course, currentId) ?? findLesson(course, lessons[0].id)!;
  const { lesson, chapter } = found;
  const isDone = progress.completed.includes(lesson.id);
  const accessible = canAccess(lesson);

  const idx = playable.findIndex((l) => l.id === lesson.id);
  const prevLesson = idx > 0 ? playable[idx - 1] : undefined;
  const nextLesson = idx >= 0 && idx < playable.length - 1 ? playable[idx + 1] : undefined;

  const mentor = getMentor(course.instructorId);
  const cohort = enrollment?.cohortId ? getCohort(enrollment.cohortId) : undefined;
  const nextClass = enrollment?.format === "live-cohort" ? nextCohortClass(enrollment.cohortId) : undefined;
  const quality = contentItems.find((c) => c.id === `ci-${lesson.id}`)?.resolution;

  const select = (id: string) => {
    const target = lessons.find((l) => l.id === id);
    if (!target) return;
    if (!canAccess(target)) {
      toast("This lesson is locked", { description: "Enrol in the programme to unlock every lesson.", action: { label: "View options", onClick: () => router.push(`/courses/${course.id}`) } });
      return;
    }
    setSelectedId(id);
    setSheetOpen(false);
    if (enrolled) touch(course.id, id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const markComplete = (done: boolean, quiet = false) => {
    if (!enrolled) return;
    setSelectedId(lesson.id);
    setLessonComplete(course.id, lesson.id, done);
    const willFinish = done && progress.done + 1 === progress.total && !isDone;
    if (willFinish) {
      toast.success("Course complete!", { description: `You've finished ${course.title}. Your certificate is ready.` });
    } else if (!quiet) {
      toast.success(done ? "Lesson marked complete" : "Marked as not complete", {
        description: done ? lesson.title : undefined,
        action: done && nextLesson ? { label: "Next lesson", onClick: () => select(nextLesson.id) } : undefined,
      });
    }
  };

  const onEnded = () => {
    if (!enrolled || isDone) {
      toast("Lesson finished", { description: enrolled ? "Already marked complete." : "Enrol to track your progress." });
      return;
    }
    markComplete(true, true);
    if (progress.done + 1 < progress.total) {
      toast.success("Nice work — lesson complete", {
        description: lesson.title,
        action: nextLesson ? { label: "Next lesson", onClick: () => select(nextLesson.id) } : undefined,
      });
    }
  };

  const curriculum = <Curriculum course={course} currentId={lesson.id} completed={progress.completed} canAccess={canAccess} onSelect={select} />;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 space-y-2">
          <Link href="/dashboard/learning" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> My Learning
          </Link>
          <h1 className="font-heading text-2xl font-semibold md:text-[26px]">{course.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {enrollment ? <FormatBadge format={enrollment.format} /> : <span className="inline-flex h-6 items-center gap-1 rounded-full bg-muted px-2.5 text-xs font-medium"><Lock className="size-3" /> Preview mode</span>}
            {mentor && (
              <span className="inline-flex items-center gap-1.5">
                <Portrait avatar={mentor.avatar} name={mentor.name} className="size-5" />
                {mentor.name}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {lessons.length} lessons · {formatDuration(courseDurationSec(course))}
            </span>
            {nextClass && (
              <Link href="/dashboard/sessions" className="inline-flex h-6 items-center gap-1.5 rounded-full bg-brand-soft px-2.5 text-xs font-medium text-brand ring-1 ring-brand/25 ring-inset hover:bg-brand-soft/70">
                <Radio className="size-3.5" />
                Next live class: {relativeDay(nextClass.date)}, {formatTime(nextClass.time)}
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {enrolled && (
            <div className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2 shadow-xs">
              <ProgressRing value={progress.percent} size={44} stroke={5}>
                <span className="text-[11px] font-semibold tabular-nums">{progress.percent}%</span>
              </ProgressRing>
              <div className="text-xs leading-tight">
                <p className="font-semibold">Course progress</p>
                <p className="text-muted-foreground">
                  {progress.done} of {progress.total} lessons
                </p>
              </div>
            </div>
          )}
          <Button variant="outline" className="h-11 lg:hidden" onClick={() => setSheetOpen(true)}>
            <ListVideo /> Course content
          </Button>
        </div>
      </div>

      {progress.isComplete && enrolled && (
        <div className="flex flex-col gap-3 rounded-2xl border border-success/25 bg-success-soft p-4 sm:flex-row sm:items-center">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success text-white">
            <PartyPopper className="size-5" />
          </span>
          <div className="flex-1">
            <p className="font-semibold">You&apos;ve completed {course.title}!</p>
            <p className="text-sm text-muted-foreground">All {progress.total} lessons done. Your illustrative certificate is ready to view and print.</p>
          </div>
          <Button asChild className="h-9 bg-success text-white hover:bg-success/90">
            <Link href="/dashboard/certificates">
              <Award /> View certificate
            </Link>
          </Button>
        </div>
      )}

      {!enrolled && (
        <div className="flex flex-col gap-3 rounded-2xl border border-primary/15 bg-secondary/70 p-4 sm:flex-row sm:items-center">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Lock className="size-5" />
          </span>
          <div className="flex-1">
            <p className="font-semibold">You&apos;re previewing this programme</p>
            <p className="text-sm text-muted-foreground">
              {playable.length} free preview {playable.length === 1 ? "lesson" : "lessons"} available. Enrol to unlock all {lessons.length} lessons, resources and your certificate.
            </p>
          </div>
          <Button asChild className="h-9">
            <Link href={`/courses/${course.id}`}>See enrolment options</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          {!accessible ? (
            <LockedLesson course={course} lesson={lesson} />
          ) : lesson.kind === "video" ? (
            <VideoPlayer
              course={course}
              lesson={lesson}
              contextLabel={lessonContextLabel(course, lesson.id)}
              originalQuality={quality}
              onEnded={onEnded}
              onPrev={prevLesson ? () => select(prevLesson.id) : undefined}
              onNext={nextLesson ? () => select(nextLesson.id) : undefined}
              className="max-sm:aspect-[4/3]"
            />
          ) : lesson.kind === "reading" ? (
            <ReadingView course={course} chapter={chapter} lesson={lesson} />
          ) : (
            <QuizLessonView course={course} lesson={lesson} done={isDone} onComplete={() => markComplete(true)} />
          )}

          {/* Lesson bar */}
          <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-xs md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                {lessonContextLabel(course, lesson.id)} · {chapter.title}
              </p>
              <h2 className="mt-0.5 font-heading text-lg leading-snug font-semibold">{lesson.title}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {LESSON_KIND_LABEL[lesson.kind]} · {formatDuration(lesson.durationSec)}
                {quality && lesson.kind === "video" ? ` · recorded in ${quality}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button variant="outline" size="icon-lg" disabled={!prevLesson} onClick={() => prevLesson && select(prevLesson.id)} aria-label="Previous lesson">
                <ChevronLeft />
              </Button>
              {enrolled && (
                <Button
                  variant={isDone ? "secondary" : "outline"}
                  className={cn("h-9 px-3", isDone && "text-brand")}
                  onClick={() => markComplete(!isDone)}
                  aria-pressed={isDone}
                >
                  {isDone ? <Check /> : <Circle />}
                  {isDone ? "Completed" : "Mark as complete"}
                </Button>
              )}
              <Button className="h-9 bg-brand px-3 text-brand-foreground hover:bg-brand/90" disabled={!nextLesson} onClick={() => nextLesson && select(nextLesson.id)}>
                <span className="hidden sm:inline">Next lesson</span>
                <span className="sm:hidden">Next</span> <ChevronRight />
              </Button>
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="gap-4">
            <TabsList variant="line" className="w-full justify-start overflow-x-auto border-b px-0 scrollbar-none">
              <TabsTrigger value="overview" className="flex-none px-3">Overview</TabsTrigger>
              <TabsTrigger value="transcript" className="flex-none px-3">Transcript</TabsTrigger>
              <TabsTrigger value="resources" className="flex-none px-3">Resources</TabsTrigger>
              <TabsTrigger value="discussion" className="flex-none px-3">Discussion</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <OverviewPanel course={course} lesson={lesson} cohortName={cohort?.name} cohortSchedule={cohort?.scheduleLabel} />
            </TabsContent>
            <TabsContent value="transcript">
              <TranscriptPanel course={course} lesson={lesson} />
            </TabsContent>
            <TabsContent value="resources">
              <ResourcesPanel course={course} chapterId={chapter.id} locked={!enrolled} />
            </TabsContent>
            <TabsContent value="discussion">
              <DiscussionPanel course={course} lessonId={lesson.id} />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] space-y-3 overflow-y-auto pr-1 pb-4">
            <div className="rounded-xl border bg-card p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Course content</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {progress.done}/{progress.total} done
                </span>
              </div>
              <TealProgress value={enrolled ? progress.percent : 0} className="mt-2" />
            </div>
            {curriculum}
          </div>
        </aside>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[92vw] gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>Course content</SheetTitle>
            <SheetDescription>
              {progress.done} of {progress.total} lessons complete
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-3">{curriculum}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function OverviewPanel({ course, lesson, cohortName, cohortSchedule }: { course: Course; lesson: Lesson; cohortName?: string; cohortSchedule?: string }) {
  const mentor = getMentor(course.instructorId);
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-5">
        <div>
          <h3 className="font-heading font-semibold">About this lesson</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {lesson.summary ?? `${lesson.title} is part of ${course.title}. Watch or read it end-to-end, then try the practice prompt before moving on — short, regular sessions work better than long ones.`}
          </p>
        </div>
        <div>
          <h3 className="font-heading font-semibold">What you&apos;ll be able to do</h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {course.outcomes.map((o) => (
              <li key={o} className="flex gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                {o}
              </li>
            ))}
          </ul>
        </div>
        {cohortName && (
          <div className="flex items-start gap-3 rounded-xl bg-brand-soft/60 p-3 text-sm">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-brand" />
            <p>
              <span className="font-medium">{cohortName}</span> meets {cohortSchedule}. Recordings appear in Live Sessions within 24 hours.
            </p>
          </div>
        )}
      </div>
      {mentor && (
        <div className="h-fit rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Your mentor</p>
          <div className="mt-3 flex items-center gap-3">
            <Portrait avatar={mentor.avatar} name={mentor.name} className="size-12" rounded="xl" />
            <div className="min-w-0">
              <p className="font-semibold">{mentor.name}</p>
              <p className="text-xs text-muted-foreground">{mentor.title}</p>
            </div>
          </div>
          <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{mentor.headline}</p>
          <Button asChild variant="outline" size="sm" className="mt-3 w-full">
            <Link href={`/mentors/${mentor.id}`}>View profile</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
