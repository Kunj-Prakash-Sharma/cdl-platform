"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  CirclePlay,
  Clapperboard,
  FileText,
  GripVertical,
  ListChecks,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { formatClock, formatDuration } from "@/lib/format";
import type { Chapter, ContentItem, Lesson } from "@/lib/types";
import { cn } from "@/lib/utils";
import { newId, useDemoStore } from "@/store/demo-store";
import { AutoStatus } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "./admin-kit";

export const LESSON_KIND_META: Record<Lesson["kind"], { label: string; icon: typeof CirclePlay; tone: string }> = {
  video: { label: "Video", icon: CirclePlay, tone: "bg-info-soft text-info" },
  reading: { label: "Reading", icon: FileText, tone: "bg-brand-soft text-brand" },
  quiz: { label: "Quiz", icon: ListChecks, tone: "bg-warning-soft text-warning" },
};

export function formatSize(mb: number) {
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${Math.round(mb)} MB`;
}

function move<T>(list: T[], index: number, delta: number) {
  const next = [...list];
  const target = index + delta;
  if (target < 0 || target >= next.length) return list;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/**
 * Chapter & lesson editor: add / rename / remove / reorder, lesson type, duration and free-preview flag.
 * Video lessons show the metadata of the recording held in the central content library (`ci-<lessonId>`).
 */
export function CurriculumBuilder({
  courseId,
  chapters,
  onChange,
  errors,
}: {
  courseId: string;
  chapters: Chapter[];
  onChange: (chapters: Chapter[]) => void;
  errors: Record<string, string>;
}) {
  const contentItems = useDemoStore((s) => s.contentItems);
  const [chapterToRemove, setChapterToRemove] = useState<Chapter | null>(null);

  const byId = useMemo(() => new Map(contentItems.map((c) => [c.id, c])), [contentItems]);
  /** Mentor uploads for this course that aren't linked to a lesson yet, grouped by chapter. */
  const unplaced = useMemo(() => {
    const lessonIds = new Set(chapters.flatMap((c) => c.lessons.map((l) => `ci-${l.id}`)));
    const map = new Map<string, ContentItem[]>();
    for (const item of contentItems) {
      if (item.courseId !== courseId || lessonIds.has(item.id)) continue;
      map.set(item.chapterId, [...(map.get(item.chapterId) ?? []), item]);
    }
    return map;
  }, [contentItems, chapters, courseId]);

  const updateChapter = (id: string, patch: Partial<Chapter>) => onChange(chapters.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const updateLesson = (chapterId: string, lessonId: string, patch: Partial<Lesson>) =>
    onChange(
      chapters.map((c) => (c.id === chapterId ? { ...c, lessons: c.lessons.map((l) => (l.id === lessonId ? { ...l, ...patch } : l)) } : c)),
    );

  function addChapter() {
    const chapter: Chapter = { id: newId("ch"), title: `Chapter ${chapters.length + 1}`, lessons: [{ id: newId("ls"), title: "", durationSec: 600, kind: "video" }] };
    onChange([...chapters, chapter]);
  }

  function addLesson(chapterId: string, kind: Lesson["kind"] = "video") {
    const lesson: Lesson = { id: newId("ls"), title: "", durationSec: kind === "quiz" ? 480 : 600, kind };
    onChange(chapters.map((c) => (c.id === chapterId ? { ...c, lessons: [...c.lessons, lesson] } : c)));
  }

  function removeLesson(chapterId: string, lesson: Lesson) {
    onChange(chapters.map((c) => (c.id === chapterId ? { ...c, lessons: c.lessons.filter((l) => l.id !== lesson.id) } : c)));
    toast.success("Lesson removed", { description: lesson.title || "Untitled lesson" });
  }

  const totalLessons = chapters.reduce((n, c) => n + c.lessons.length, 0);
  const totalSec = chapters.reduce((n, c) => n + c.lessons.reduce((m, l) => m + l.durationSec, 0), 0);
  const videoCount = chapters.reduce((n, c) => n + c.lessons.filter((l) => l.kind === "video").length, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground tabular-nums">{chapters.length}</span> chapters
        </span>
        <span>
          <span className="font-semibold text-foreground tabular-nums">{totalLessons}</span> lessons
        </span>
        <span>
          <span className="font-semibold text-foreground tabular-nums">{videoCount}</span> video
        </span>
        <span>
          <span className="font-semibold text-foreground">{formatDuration(totalSec)}</span> total
        </span>
      </div>

      {chapters.length === 0 && (
        <div className="rounded-xl border border-dashed bg-muted/40 px-6 py-10 text-center">
          <p className="font-heading text-sm font-semibold">No chapters yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Group lessons into chapters so learners can follow a clear path.</p>
          <Button className="mt-4" size="sm" onClick={addChapter}>
            <Plus className="size-4" />
            Add first chapter
          </Button>
        </div>
      )}

      <ol className="space-y-4">
        {chapters.map((chapter, ci) => {
          const chapterSec = chapter.lessons.reduce((n, l) => n + l.durationSec, 0);
          const pending = unplaced.get(chapter.id) ?? [];
          const chapterError = errors[`ch-${chapter.id}`];
          return (
            <li key={chapter.id} className="overflow-hidden rounded-xl border bg-card">
              <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-3 py-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground tabular-nums">
                  {ci + 1}
                </span>
                <Input
                  value={chapter.title}
                  onChange={(e) => updateChapter(chapter.id, { title: e.target.value })}
                  aria-label={`Chapter ${ci + 1} title`}
                  aria-invalid={!!chapterError}
                  placeholder="Chapter title"
                  className="h-8 min-w-0 flex-1 basis-48 bg-background font-medium"
                />
                <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                  {chapter.lessons.length} lesson{chapter.lessons.length === 1 ? "" : "s"} · {formatDuration(chapterSec)}
                </span>
                <div className="ml-auto flex items-center">
                  <Button variant="ghost" size="icon-sm" aria-label="Move chapter up" disabled={ci === 0} onClick={() => onChange(move(chapters, ci, -1))}>
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move chapter down"
                    disabled={ci === chapters.length - 1}
                    onClick={() => onChange(move(chapters, ci, 1))}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove chapter"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (chapter.lessons.length) setChapterToRemove(chapter);
                      else {
                        onChange(chapters.filter((c) => c.id !== chapter.id));
                        toast.success("Chapter removed");
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                {chapterError && <p className="w-full pl-9 text-xs font-medium text-destructive">{chapterError}</p>}
              </div>

              <ul className="divide-y">
                {chapter.lessons.map((lesson, li) => (
                  <LessonRow
                    key={lesson.id}
                    index={li}
                    lesson={lesson}
                    count={chapter.lessons.length}
                    item={byId.get(`ci-${lesson.id}`)}
                    error={errors[`ls-${lesson.id}`]}
                    onPatch={(patch) => updateLesson(chapter.id, lesson.id, patch)}
                    onMove={(delta) => updateChapter(chapter.id, { lessons: move(chapter.lessons, li, delta) })}
                    onRemove={() => removeLesson(chapter.id, lesson)}
                  />
                ))}
                {chapter.lessons.length === 0 && <li className="px-4 py-4 text-sm text-muted-foreground">No lessons in this chapter yet.</li>}
              </ul>

              {pending.length > 0 && (
                <div className="border-t border-dashed bg-warning-soft/40 px-4 py-2.5 text-xs">
                  <p className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
                    <Upload className="size-3.5 text-warning" />
                    Mentor uploads for this chapter in the video library
                  </p>
                  <ul className="space-y-1">
                    {pending.map((p) => (
                      <li key={p.id} className="flex flex-wrap items-center gap-2 text-muted-foreground">
                        <span className="font-medium text-foreground">{p.title}</span>
                        <span>
                          {formatClock(p.durationSec)} · {p.resolution} · {formatSize(p.sizeMb)}
                        </span>
                        <AutoStatus status={p.status} className="h-5 text-[11px]" />
                        <Link href="/admin/content" className="font-medium text-primary hover:underline">
                          Review in library
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-1 border-t px-2 py-1.5">
                <Button variant="ghost" size="sm" onClick={() => addLesson(chapter.id, "video")}>
                  <Plus className="size-3.5" />
                  Video lesson
                </Button>
                <Button variant="ghost" size="sm" onClick={() => addLesson(chapter.id, "reading")}>
                  <Plus className="size-3.5" />
                  Reading
                </Button>
                <Button variant="ghost" size="sm" onClick={() => addLesson(chapter.id, "quiz")}>
                  <Plus className="size-3.5" />
                  Quiz
                </Button>
              </div>
            </li>
          );
        })}
      </ol>

      {chapters.length > 0 && (
        <Button variant="outline" className="h-9 w-full border-dashed" onClick={addChapter}>
          <Plus className="size-4" />
          Add chapter
        </Button>
      )}

      <ConfirmDialog
        open={chapterToRemove !== null}
        onOpenChange={(open) => !open && setChapterToRemove(null)}
        title={`Remove “${chapterToRemove?.title || "this chapter"}”?`}
        description={`This chapter and its ${chapterToRemove?.lessons.length ?? 0} lesson(s) will be removed from the curriculum. Recordings stay in the video library.`}
        confirmLabel="Remove chapter"
        destructive
        onConfirm={() => {
          if (!chapterToRemove) return;
          onChange(chapters.filter((c) => c.id !== chapterToRemove.id));
          toast.success("Chapter removed", { description: chapterToRemove.title });
          setChapterToRemove(null);
        }}
      />
    </div>
  );
}

function LessonRow({
  index,
  lesson,
  count,
  item,
  error,
  onPatch,
  onMove,
  onRemove,
}: {
  index: number;
  lesson: Lesson;
  count: number;
  item?: ContentItem;
  error?: string;
  onPatch: (patch: Partial<Lesson>) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
}) {
  const meta = LESSON_KIND_META[lesson.kind];
  const minutes = lesson.durationSec ? Math.round(lesson.durationSec / 60) : "";
  return (
    <li className="px-3 py-3">
      <div className="flex items-center gap-2">
        <GripVertical className="hidden size-4 shrink-0 text-muted-foreground/50 sm:block" aria-hidden="true" />
        <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", meta.tone)} title={meta.label}>
          <meta.icon className="size-3.5" />
        </span>
        <Input
          value={lesson.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          aria-label={`Lesson ${index + 1} title`}
          aria-invalid={!!error}
          placeholder={`${meta.label} lesson title`}
          className="h-8 min-w-0 flex-1"
        />
        <div className="flex shrink-0 items-center">
          <Button variant="ghost" size="icon-sm" aria-label="Move lesson up" disabled={index === 0} onClick={() => onMove(-1)}>
            <ArrowUp className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Move lesson down" disabled={index === count - 1} onClick={() => onMove(1)}>
            <ArrowDown className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Remove lesson" className="text-muted-foreground hover:text-destructive" onClick={onRemove}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-destructive sm:pl-[60px]">{error}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2 sm:pl-[60px]">
        <Select value={lesson.kind} onValueChange={(v) => onPatch({ kind: v as Lesson["kind"] })}>
          <SelectTrigger size="sm" className="w-[104px]" aria-label="Lesson type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(LESSON_KIND_META) as Lesson["kind"][]).map((k) => (
              <SelectItem key={k} value={k}>
                {LESSON_KIND_META[k].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative w-[84px]">
          <Input
            type="number"
            min={1}
            max={240}
            inputMode="numeric"
            value={minutes}
            onChange={(e) => onPatch({ durationSec: Math.max(0, Math.round(Number(e.target.value) * 60)) })}
            aria-label="Duration in minutes"
            className="h-7 pr-9 tabular-nums"
          />
          <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">min</span>
        </div>
        <label className="flex h-7 cursor-pointer items-center gap-1.5 rounded-md border px-2 text-xs text-muted-foreground">
          <Switch size="sm" checked={!!lesson.preview} onCheckedChange={(v) => onPatch({ preview: v })} aria-label="Free preview" />
          Free preview
        </label>
        {lesson.kind === "video" && (
          <div className="flex min-h-7 min-w-0 flex-1 basis-64 flex-wrap items-center gap-x-2.5 gap-y-1 rounded-md bg-muted/70 px-2.5 py-1 text-xs text-muted-foreground">
            <Clapperboard className="size-3.5 shrink-0" />
            {item ? (
              <>
                <span className="font-medium text-foreground">Sample recording</span>
                <span>{item.resolution}</span>
                <span>{formatSize(item.sizeMb)}</span>
                <span className="tabular-nums">{formatClock(item.durationSec)}</span>
                <AutoStatus status={item.status} className="h-5 text-[11px]" />
              </>
            ) : (
              <span>
                No recording yet — the mentor uploads it from the Mentor Portal (
                <Link href="/admin/content" className="font-medium text-primary hover:underline">
                  video library
                </Link>
                )
              </span>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
