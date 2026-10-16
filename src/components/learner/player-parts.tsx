"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpenText,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileQuestion,
  Lightbulb,
  Lock,
  MessagesSquare,
  PlayCircle,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { assignments, getMentor, resources } from "@/data";
import { formatDate, formatDuration, relativeDay } from "@/lib/format";
import type { Chapter, Course, Lesson, Resource } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { AutoStatus } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mergeAssignment } from "./hooks";
import { DownloadButton, FileTypeIcon, ResourceCard, ResourcePreviewDialog } from "./resource-card";
import { LESSON_KIND_LABEL, transcriptFor } from "./utils";
import { TealProgress } from "./widgets";

const KIND_ICON = { video: PlayCircle, reading: BookOpenText, quiz: FileQuestion } as const;

/** Chapter & lesson list with completion state; used in the sidebar and the mobile sheet. */
export function Curriculum({
  course,
  currentId,
  completed,
  canAccess,
  onSelect,
}: {
  course: Course;
  currentId: string;
  completed: string[];
  canAccess: (l: Lesson) => boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {course.chapters.map((chapter, ci) => (
        <ChapterBlock key={chapter.id} chapter={chapter} index={ci} currentId={currentId} completed={completed} canAccess={canAccess} onSelect={onSelect} />
      ))}
    </div>
  );
}

function ChapterBlock({
  chapter,
  index,
  currentId,
  completed,
  canAccess,
  onSelect,
}: {
  chapter: Chapter;
  index: number;
  currentId: string;
  completed: string[];
  canAccess: (l: Lesson) => boolean;
  onSelect: (id: string) => void;
}) {
  const done = chapter.lessons.filter((l) => completed.includes(l.id)).length;
  const pct = Math.round((done / chapter.lessons.length) * 100);
  const duration = chapter.lessons.reduce((s, l) => s + l.durationSec, 0);
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b bg-muted/40 px-3.5 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Chapter {index + 1}</p>
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {done}/{chapter.lessons.length} · {formatDuration(duration)}
          </p>
        </div>
        <p className="mt-0.5 text-sm font-semibold">{chapter.title}</p>
        <TealProgress value={pct} className="mt-2 h-1" />
      </div>
      <ul className="divide-y">
        {chapter.lessons.map((lesson, li) => {
          const isCurrent = lesson.id === currentId;
          const isDone = completed.includes(lesson.id);
          const locked = !canAccess(lesson);
          const KindIcon = KIND_ICON[lesson.kind];
          return (
            <li key={lesson.id}>
              <button
                type="button"
                onClick={() => onSelect(lesson.id)}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "relative flex w-full items-start gap-3 px-3.5 py-2.5 text-left transition hover:bg-muted/60 focus-visible:bg-muted focus-visible:outline-none",
                  isCurrent && "bg-brand-soft/70 hover:bg-brand-soft",
                )}
              >
                {isCurrent && <span className="absolute inset-y-0 left-0 w-[3px] bg-brand" />}
                <span className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="size-[18px] fill-brand text-white" aria-label="Completed" />
                  ) : locked ? (
                    <Lock className="size-4 text-muted-foreground" aria-label="Locked" />
                  ) : (
                    <span className={cn("block size-[18px] rounded-full border-2", isCurrent ? "border-brand" : "border-border")} aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm leading-snug", isCurrent ? "font-semibold text-foreground" : "text-foreground/90", locked && "text-muted-foreground")}>
                    {li + 1}. {lesson.title}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <KindIcon className="size-3.5" />
                    {LESSON_KIND_LABEL[lesson.kind]} · {formatDuration(lesson.durationSec)}
                    {lesson.preview && !isDone && <span className="rounded bg-info-soft px-1 text-[10px] font-medium text-info">Preview</span>}
                    {isCurrent && <span className="font-medium text-brand">· Now playing</span>}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Designed article view for reading lessons. */
export function ReadingView({ course, chapter, lesson }: { course: Course; chapter: Chapter; lesson: Lesson }) {
  const resource = resources.find((r) => r.courseId === course.id && r.chapterId === chapter.id);
  const [preview, setPreview] = useState<Resource | null>(null);
  const mentor = getMentor(course.instructorId);
  const points = resource?.previewLines ?? course.outcomes;
  return (
    <article className="overflow-hidden rounded-2xl border bg-card shadow-xs">
      <div className="relative overflow-hidden px-6 py-7 text-white sm:px-10" style={{ backgroundImage: `linear-gradient(135deg, ${course.thumbnail.from}, ${course.thumbnail.to})` }}>
        <div className="absolute inset-0 bg-grid opacity-20" aria-hidden="true" />
        <p className="relative flex items-center gap-2 text-xs font-semibold tracking-wider text-white/75 uppercase">
          <BookOpenText className="size-4" /> Reading · {Math.round(lesson.durationSec / 60)} min read
        </p>
        <h2 className="relative mt-2 font-heading text-2xl font-semibold text-balance sm:text-3xl">{lesson.title}</h2>
        {mentor && (
          <p className="relative mt-3 flex items-center gap-2 text-sm text-white/80">
            <Portrait avatar={mentor.avatar} name={mentor.name} className="size-6 ring-1 ring-white/40" />
            By {mentor.name} · {chapter.title}
          </p>
        )}
      </div>
      <div className="mx-auto max-w-2xl space-y-5 px-6 py-7 text-[15px] leading-relaxed sm:px-8">
        <p className="text-foreground/90">
          {resource?.description ?? course.description} This reading brings together the key ideas from <span className="font-medium">{chapter.title}</span> so you can
          revisit them quickly before a live class, assignment or real interview.
        </p>
        <div>
          <h3 className="font-heading text-lg font-semibold">Key points</h3>
          <ul className="mt-3 space-y-2.5">
            {points.map((p) => (
              <li key={p} className="flex gap-3">
                <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Check className="size-3" />
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-3 rounded-xl border border-warning/25 bg-warning-soft/70 p-4 text-sm">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-warning" />
          <div>
            <p className="font-semibold">Try this</p>
            <p className="mt-0.5 text-muted-foreground">
              Pick one point above and apply it to a real situation this week — a class discussion, a mock round or a conversation with a mentor. Note what changed.
            </p>
          </div>
        </div>
        {resource && (
          <div className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4 sm:flex-row sm:items-center">
            <FileTypeIcon type={resource.fileType} />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{resource.title}</p>
              <p className="text-xs text-muted-foreground">Companion resource for this reading</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPreview(resource)}>
                Preview
              </Button>
              <DownloadButton resource={resource} />
            </div>
          </div>
        )}
      </div>
      <ResourcePreviewDialog resource={preview} onOpenChange={(o) => !o && setPreview(null)} />
    </article>
  );
}

/** Quiz lessons link to the matching quiz on the Assignments & Quizzes page. */
export function QuizLessonView({ course, lesson, onComplete, done }: { course: Course; lesson: Lesson; onComplete: () => void; done: boolean }) {
  const submissions = useDemoStore((s) => s.submissions);
  const quiz = useMemo(() => {
    const a = assignments.find((x) => x.courseId === course.id && x.kind === "quiz");
    return a ? mergeAssignment(a, submissions[a.id]) : undefined;
  }, [course.id, submissions]);
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-xs sm:p-8">
      <div className="absolute -top-16 -right-16 size-56 rounded-full bg-brand-soft" aria-hidden="true" />
      <div className="relative max-w-xl">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-sm">
          <ClipboardCheck className="size-6" />
        </span>
        <p className="mt-4 text-xs font-semibold tracking-wider text-brand uppercase">Checkpoint quiz</p>
        <h2 className="mt-1 font-heading text-2xl font-semibold">{quiz?.title ?? lesson.title}</h2>
        {quiz ? (
          <>
            <p className="mt-2 text-muted-foreground">{quiz.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-lg bg-muted px-2.5 py-1">{quiz.questions?.length ?? 10} questions</span>
              <span className="rounded-lg bg-muted px-2.5 py-1">{quiz.points} points</span>
              <span className="rounded-lg bg-muted px-2.5 py-1">~{quiz.estimatedMin} min</span>
              <span className="rounded-lg bg-muted px-2.5 py-1">Due {formatDate(quiz.dueDate, "d MMM")}</span>
              <AutoStatus status={quiz.status} />
            </div>
            {quiz.status === "graded" && quiz.score !== undefined && (
              <p className="mt-4 rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
                You scored <span className="font-semibold">{quiz.score}/{quiz.points}</span>. {quiz.feedback}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild className="h-10 bg-brand px-5 text-brand-foreground hover:bg-brand/90">
                <Link href={`/dashboard/assignments/${quiz.id}`}>{quiz.status === "graded" ? "Review answers" : quiz.status === "in-progress" ? "Continue quiz" : "Start quiz"}</Link>
              </Button>
              <Button asChild variant="outline" className="h-10">
                <Link href="/dashboard/assignments">All assignments</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-muted-foreground">
              A short self-check on this course. Reflect on the questions from each chapter, then mark this checkpoint complete. Graded quizzes for this programme appear in Assignments &amp; Quizzes.
            </p>
            <div className="mt-6">
              <Button className="h-10 bg-brand px-5 text-brand-foreground hover:bg-brand/90" onClick={onComplete} disabled={done}>
                {done ? <Check /> : <ClipboardCheck />} {done ? "Checkpoint complete" : "Mark checkpoint complete"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function TranscriptPanel({ course, lesson }: { course: Course; lesson: Lesson }) {
  const [q, setQ] = useState("");
  const lines = transcriptFor(course, lesson);
  const filtered = q.trim() ? lines.filter((l) => l.text.toLowerCase().includes(q.toLowerCase())) : lines;
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search transcript" className="h-9 pl-8" aria-label="Search transcript" />
        </div>
        <Button
          variant="outline"
          className="h-9"
          onClick={() => toast.success("Transcript downloaded", { description: `${lesson.title}.txt (simulated)` })}
        >
          <Download /> Download .txt
        </Button>
      </div>
      {lesson.kind !== "video" ? (
        <p className="text-sm text-muted-foreground">Transcripts are available for video lessons.</p>
      ) : filtered.length ? (
        <ol className="space-y-1">
          {filtered.map((l) => (
            <li key={l.at} className="flex gap-4 rounded-lg px-2 py-2 hover:bg-muted/60">
              <span className="w-12 shrink-0 font-mono text-xs leading-6 text-brand tabular-nums">{l.at}</span>
              <p className="text-sm leading-6">{l.text}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">No lines match “{q}”.</p>
      )}
      <p className="text-xs text-muted-foreground">Auto-generated sample transcript for the prototype.</p>
    </div>
  );
}

export function ResourcesPanel({ course, chapterId, locked }: { course: Course; chapterId: string; locked: boolean }) {
  const [preview, setPreview] = useState<Resource | null>(null);
  const list = resources.filter((r) => r.courseId === course.id).sort((a, b) => Number(b.chapterId === chapterId) - Number(a.chapterId === chapterId));
  if (!list.length) return <EmptyState icon={Download} title="No downloadable resources" description="This programme's materials are inside the lessons." />;
  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((r) => (
          <div key={r.id} className="relative">
            {r.chapterId === chapterId && (
              <span className="absolute -top-2 right-3 z-10 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground shadow-xs">This chapter</span>
            )}
            <ResourceCard resource={r} locked={locked} onPreview={setPreview} className="h-full" />
          </div>
        ))}
      </div>
      <ResourcePreviewDialog resource={preview} onOpenChange={(o) => !o && setPreview(null)} />
    </>
  );
}

export function DiscussionPanel({ course, lessonId }: { course: Course; lessonId: string }) {
  const threads = useDemoStore((s) => s.threads);
  const list = useMemo(
    () =>
      threads
        .filter((t) => t.courseId === course.id)
        .sort((a, b) => Number(b.lessonId === lessonId) - Number(a.lessonId === lessonId) || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [threads, course.id, lessonId],
  );
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-muted-foreground">Stuck on something in this lesson? Mentors usually reply within a day.</p>
        <Button asChild size="sm" className="h-8">
          <Link href="/dashboard/discussions">
            <MessagesSquare /> Ask a doubt
          </Link>
        </Button>
      </div>
      {list.length ? (
        <ul className="divide-y rounded-xl border">
          {list.map((t) => (
            <li key={t.id}>
              <Link href="/dashboard/discussions" className="flex items-start gap-3 p-3 transition hover:bg-muted/50">
                <Portrait name={t.authorName} className="size-8" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{t.title}</p>
                    {t.lessonId === lessonId && <span className="rounded bg-brand-soft px-1.5 text-[10px] font-semibold text-brand">This lesson</span>}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{t.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.authorName} · {relativeDay(t.createdAt)} · {t.replies.length} {t.replies.length === 1 ? "reply" : "replies"} · {t.channel === "doubt" ? "Doubt" : "Community"}
                  </p>
                </div>
                <AutoStatus status={t.status} className="hidden sm:inline-flex" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={MessagesSquare} title="No discussions yet" description="Be the first to ask a question about this course." />
      )}
      <Button asChild variant="link" className="px-0">
        <Link href="/dashboard/discussions">Open Discussions &amp; Doubts →</Link>
      </Button>
    </div>
  );
}

export function LockedLesson({ course, lesson }: { course: Course; lesson: Lesson }) {
  return (
    <div className="relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-2xl px-6 text-center text-white" style={{ backgroundImage: `linear-gradient(135deg, ${course.thumbnail.from}, ${course.thumbnail.to})` }}>
      <div className="absolute inset-0 bg-black/35" aria-hidden="true" />
      <div className="relative">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30 backdrop-blur-sm">
          <Lock className="size-6" />
        </span>
        <p className="mt-4 font-heading text-xl font-semibold sm:text-2xl">{lesson.title}</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/80">This lesson unlocks when you enrol. Preview lessons are free to watch.</p>
        <Button asChild className="mt-5 h-10 bg-white px-5 text-navy hover:bg-white/90">
          <Link href={`/courses/${course.id}`}>View enrolment options</Link>
        </Button>
      </div>
    </div>
  );
}
