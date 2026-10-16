"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  BookText,
  CircleHelp,
  CloudUpload,
  ExternalLink,
  Eye,
  FileVideo,
  Info,
  Paperclip,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { getResource } from "@/data";
import { formatClock, formatDate, formatDuration, formatNumber } from "@/lib/format";
import type { ContentItem, Course, Lesson } from "@/lib/types";
import { cn } from "@/lib/utils";
import { demoTimestamp } from "@/store/demo-store";
import { AutoStatus, FormatBadge, StatusPill } from "@/components/shared/badges";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { VideoPlayer } from "@/components/shared/video-player";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ContentPreviewDialog, UploadVideoDialog } from "./content-dialogs";
import { CONTENT_STATUS_LABEL, myCohorts, myResources, useMentorContent } from "./mentor-data";
import { Panel } from "./panel";

interface ELesson {
  id: string;
  title: string;
  durationSec: number;
  kind: Lesson["kind"];
  preview?: boolean;
  resourceIds: string[];
}
interface EChapter {
  id: string;
  title: string;
  lessons: ELesson[];
}

function initChapters(course: Course): EChapter[] {
  const res = myResources.filter((r) => r.courseId === course.id);
  return course.chapters.map((ch) => ({
    id: ch.id,
    title: ch.title,
    lessons: ch.lessons.map((l, i) => ({
      id: l.id,
      title: l.title,
      durationSec: l.durationSec,
      kind: l.kind,
      preview: l.preview,
      resourceIds: i === 0 ? res.filter((r) => r.chapterId === ch.id).map((r) => r.id) : [],
    })),
  }));
}

const KIND_ICON = { video: FileVideo, reading: BookText, quiz: CircleHelp } as const;

function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function InlineEdit({ value, onChange, label, className, autoEdit }: { value: string; onChange: (v: string) => void; label: string; className?: string; autoEdit?: boolean }) {
  const [editing, setEditing] = useState(Boolean(autoEdit));
  const [draft, setDraft] = useState(value);
  const commit = () => {
    const v = draft.trim();
    if (v) onChange(v);
    else setDraft(value);
    setEditing(false);
  };
  if (editing) {
    return (
      <Input
        autoFocus
        value={draft}
        aria-label={label}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="h-8"
      />
    );
  }
  return (
    <span className="group/edit inline-flex min-w-0 items-center gap-1">
      <span className={cn("min-w-0", className)}>{value}</span>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={`Rename ${label}`}
        className="shrink-0 text-muted-foreground opacity-60 group-hover/edit:opacity-100"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
      >
        <Pencil />
      </Button>
    </span>
  );
}

export function CurriculumEditor({ course }: { course: Course }) {
  const content = useMentorContent();
  const [baseline, setBaseline] = useState(() => initChapters(course));
  const [chapters, setChapters] = useState(baseline);
  const [newChapterId, setNewChapterId] = useState<string>();
  const [submittedAt, setSubmittedAt] = useState<string>();
  const [upload, setUpload] = useState<{ open: boolean; chapterId?: string }>({ open: false });
  const [previewLesson, setPreviewLesson] = useState<ELesson | null>(null);
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [attachFor, setAttachFor] = useState<{ chapterId: string; lesson: ELesson } | null>(null);

  const dirty = JSON.stringify(chapters) !== JSON.stringify(baseline);
  const lessonCount = chapters.reduce((s, c) => s + c.lessons.length, 0);
  const runtime = chapters.reduce((s, c) => s + c.lessons.reduce((x, l) => x + l.durationSec, 0), 0);
  const courseResources = myResources.filter((r) => r.courseId === course.id);
  const cohorts = myCohorts.filter((c) => c.courseId === course.id);

  const courseItems = useMemo(() => content.filter((c) => c.courseId === course.id), [content, course.id]);
  const lessonIds = useMemo(() => new Set(course.chapters.flatMap((c) => c.lessons.map((l) => l.id))), [course]);
  const statusFor = (lesson: ELesson): ContentItem["status"] => courseItems.find((c) => c.id === `ci-${lesson.id}`)?.status ?? "published";
  const uploadsFor = (chapterId: string) => courseItems.filter((c) => c.chapterId === chapterId && !lessonIds.has(c.id.replace(/^ci-/, "")));
  const orphanUploads = courseItems.filter((c) => !lessonIds.has(c.id.replace(/^ci-/, "")) && !chapters.some((ch) => ch.id === c.chapterId));

  const updateChapter = (chapterId: string, fn: (c: EChapter) => EChapter) => setChapters((list) => list.map((c) => (c.id === chapterId ? fn(c) : c)));
  const updateLesson = (chapterId: string, lessonId: string, patch: Partial<ELesson>) =>
    updateChapter(chapterId, (c) => ({ ...c, lessons: c.lessons.map((l) => (l.id === lessonId ? { ...l, ...patch } : l)) }));

  const addChapter = () => {
    const id = `new-ch-${course.id}-${chapters.length + 1}`;
    setChapters((list) => [...list, { id, title: "Untitled chapter", lessons: [] }]);
    setNewChapterId(id);
  };

  const submit = () => {
    setBaseline(chapters);
    setSubmittedAt(formatDate(demoTimestamp(), "h:mm a"));
    toast.success("Changes submitted for admin review (demo)", {
      description: "Learners keep seeing the current curriculum until the CDL team approves your changes.",
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        {submittedAt && !dirty && (
          <div className="flex items-start gap-2.5 rounded-xl border border-info/20 bg-info-soft p-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-info" />
            <p>
              <span className="font-medium">Curriculum changes submitted at {submittedAt}.</span>{" "}
              <span className="text-muted-foreground">They&apos;re pending admin review — the published course is unchanged until then.</span>
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {chapters.length} chapters · {lessonCount} lessons · {formatDuration(runtime)} runtime
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addChapter}>
              <Plus /> Add chapter
            </Button>
            <Button size="sm" disabled={!dirty} onClick={submit}>
              <Send /> Submit changes
            </Button>
          </div>
        </div>

        {chapters.map((chapter, ci) => {
          const uploads = uploadsFor(chapter.id);
          return (
            <section key={chapter.id} className="rounded-2xl border bg-card shadow-xs">
              <header className="flex items-center gap-2 border-b px-4 py-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-semibold text-primary">{ci + 1}</span>
                <div className="min-w-0 flex-1">
                  <InlineEdit
                    key={`${chapter.id}-${chapter.id === newChapterId}`}
                    value={chapter.title}
                    autoEdit={chapter.id === newChapterId}
                    label={`chapter ${ci + 1}`}
                    className="truncate font-heading text-sm font-semibold"
                    onChange={(title) => updateChapter(chapter.id, (c) => ({ ...c, title }))}
                  />
                </div>
                <span className="hidden text-xs text-muted-foreground sm:inline">{chapter.lessons.length} lessons</span>
                <Button variant="ghost" size="icon-sm" aria-label={`Move chapter ${ci + 1} up`} disabled={ci === 0} onClick={() => setChapters((l) => move(l, ci, ci - 1))}>
                  <ArrowUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move chapter ${ci + 1} down`}
                  disabled={ci === chapters.length - 1}
                  onClick={() => setChapters((l) => move(l, ci, ci + 1))}
                >
                  <ArrowDown />
                </Button>
              </header>
              <ul className="divide-y">
                {chapter.lessons.map((lesson, li) => {
                  const Icon = KIND_ICON[lesson.kind];
                  const status = statusFor(lesson);
                  return (
                    <li key={lesson.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <InlineEdit
                            value={lesson.title}
                            label={`lesson ${lesson.title}`}
                            className="text-sm font-medium"
                            onChange={(title) => updateLesson(chapter.id, lesson.id, { title })}
                          />
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            <span className="capitalize">{lesson.kind}</span>·<span>{formatClock(lesson.durationSec)}</span>
                            {lesson.preview && <StatusPill tone="info" dot={false} className="h-5 px-1.5 text-[10px]">Free preview</StatusPill>}
                            <AutoStatus status={status} label={CONTENT_STATUS_LABEL[status]} className="h-5 px-2 text-[10px]" />
                          </div>
                          {lesson.resourceIds.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {lesson.resourceIds.map((id) => (
                                <span key={id} className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-[11px]">
                                  <Paperclip className="size-3" /> {getResource(id)?.title}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5 self-end sm:self-center">
                        <Button variant="ghost" size="icon-sm" aria-label="Move lesson up" disabled={li === 0} onClick={() => updateChapter(chapter.id, (c) => ({ ...c, lessons: move(c.lessons, li, li - 1) }))}>
                          <ArrowUp />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Move lesson down"
                          disabled={li === chapter.lessons.length - 1}
                          onClick={() => updateChapter(chapter.id, (c) => ({ ...c, lessons: move(c.lessons, li, li + 1) }))}
                        >
                          <ArrowDown />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setAttachFor({ chapterId: chapter.id, lesson })}>
                          <Paperclip /> <span className="hidden md:inline">Resources</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPreviewLesson(lesson)}>
                          <Eye /> Preview
                        </Button>
                      </div>
                    </li>
                  );
                })}
                {uploads.map((item) => (
                  <li key={item.id} className="flex flex-col gap-2 bg-muted/30 px-4 py-3 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                        <CloudUpload className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.title}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span>New upload · {formatClock(item.durationSec)} · {item.resolution}</span>
                          <AutoStatus status={item.status} label={CONTENT_STATUS_LABEL[item.status]} className="h-5 px-2 text-[10px]" />
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1 self-end sm:self-center">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/mentor/content">Library</Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setPreviewItem(item)}>
                        <Eye /> Preview
                      </Button>
                    </div>
                  </li>
                ))}
                {chapter.lessons.length === 0 && uploads.length === 0 && (
                  <li className="px-4 py-5 text-center text-sm text-muted-foreground">No lessons yet — upload the first video for this chapter.</li>
                )}
              </ul>
              <div className="border-t px-4 py-2.5">
                <Button variant="ghost" size="sm" className="text-brand" onClick={() => setUpload({ open: true, chapterId: chapter.id })}>
                  <Plus /> Add lesson
                </Button>
              </div>
            </section>
          );
        })}

        {orphanUploads.length > 0 && (
          <Panel title="Other uploads" description="Videos uploaded to chapters that aren't part of the published curriculum yet.">
            <ul className="space-y-2">
              {orphanUploads.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{item.title}</span>
                  <AutoStatus status={item.status} label={CONTENT_STATUS_LABEL[item.status]} />
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {dirty && (
          <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border bg-card/95 p-3 shadow-md backdrop-blur sm:flex-row sm:items-center">
            <p className="flex-1 text-sm">
              <span className="font-medium">Unsaved curriculum changes.</span>{" "}
              <span className="text-muted-foreground">Submit them for admin review when you&apos;re ready.</span>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setChapters(baseline)}>
                <RotateCcw /> Discard
              </Button>
              <Button className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={submit}>
                <Send /> Submit for review
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
        <div className="space-y-3 rounded-2xl border bg-card p-4 shadow-xs">
          <CourseThumbnail course={course} />
          <div className="flex flex-wrap gap-1.5">
            {course.formats.map((f) => (
              <FormatBadge key={f} format={f} short />
            ))}
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Learners</dt>
              <dd className="font-semibold">{formatNumber(course.learners)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Rating</dt>
              <dd className="font-semibold">
                {course.rating.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">({formatNumber(course.reviewCount)})</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd>
                <AutoStatus status={course.status} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Last updated</dt>
              <dd className="font-semibold">{formatDate(course.lastUpdated, "d MMM yyyy")}</dd>
            </div>
          </dl>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href={`/courses/${course.id}`}>
              <ExternalLink /> View public course page
            </Link>
          </Button>
        </div>

        <Panel title="Cohorts" bodyClassName="pt-3 space-y-2">
          {cohorts.map((co) => (
            <div key={co.id} className="rounded-lg border px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{co.name.split(" · ")[1] ?? co.name}</p>
                <AutoStatus status={co.status} />
              </div>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3" /> {co.enrolled}/{co.seats} · {co.scheduleLabel}
              </p>
            </div>
          ))}
        </Panel>

        <Panel title="Course resources" bodyClassName="pt-3 space-y-2">
          {courseResources.map((r) => (
            <div key={r.id} className="flex items-center gap-2.5 text-sm">
              <span className="flex h-7 w-10 shrink-0 items-center justify-center rounded-md bg-secondary text-[10px] font-bold text-primary">{r.fileType}</span>
              <span className="min-w-0 flex-1 truncate">{r.title}</span>
            </div>
          ))}
          {courseResources.length === 0 && <p className="text-sm text-muted-foreground">No resources yet.</p>}
        </Panel>
      </aside>

      <UploadVideoDialog
        open={upload.open}
        onOpenChange={(open) => setUpload((u) => ({ ...u, open }))}
        defaultCourseId={course.id}
        defaultChapterId={upload.chapterId}
        extraChapters={chapters.map((c) => ({ id: c.id, title: c.title }))}
      />

      <Dialog open={Boolean(previewLesson)} onOpenChange={(o) => !o && setPreviewLesson(null)}>
        <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-3xl">
          {previewLesson && (
            <>
              <DialogHeader className="pr-8">
                <DialogTitle className="text-lg font-semibold">{previewLesson.title}</DialogTitle>
                <DialogDescription>
                  {course.title} · {chapters.find((c) => c.lessons.some((l) => l.id === previewLesson.id))?.title}
                </DialogDescription>
              </DialogHeader>
              {previewLesson.kind === "video" ? (
                <VideoPlayer
                  course={course}
                  lesson={previewLesson}
                  contextLabel="Lesson preview"
                  originalQuality={courseItems.find((c) => c.id === `ci-${previewLesson.id}`)?.resolution}
                />
              ) : (
                <div className="flex flex-col items-center rounded-xl border border-dashed bg-muted/30 px-6 py-10 text-center">
                  {previewLesson.kind === "quiz" ? <CircleHelp className="size-8 text-brand" /> : <BookText className="size-8 text-brand" />}
                  <p className="mt-3 font-heading font-semibold">{previewLesson.kind === "quiz" ? "Quiz lesson" : "Reading lesson"}</p>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    About {formatDuration(previewLesson.durationSec)}. Questions and reading content are edited by the CDL content team in the admin console.
                  </p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <ContentPreviewDialog item={previewItem} open={Boolean(previewItem)} onOpenChange={(o) => !o && setPreviewItem(null)} />

      <Dialog open={Boolean(attachFor)} onOpenChange={(o) => !o && setAttachFor(null)}>
        <DialogContent className="sm:max-w-md">
          {attachFor && (
            <AttachForm
              key={attachFor.lesson.id}
              lesson={attachFor.lesson}
              options={courseResources}
              onClose={() => setAttachFor(null)}
              onSave={(ids) => {
                updateLesson(attachFor.chapterId, attachFor.lesson.id, { resourceIds: ids });
                toast.success("Resources updated", { description: "Included in your next curriculum submission." });
                setAttachFor(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AttachForm({
  lesson,
  options,
  onSave,
  onClose,
}: {
  lesson: ELesson;
  options: typeof myResources;
  onSave: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(lesson.resourceIds);
  return (
    <>
      <DialogHeader>
        <DialogTitle>Attach resources</DialogTitle>
        <DialogDescription>Choose course resources learners can download alongside “{lesson.title}”.</DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        {options.map((r) => {
          const checked = selected.includes(r.id);
          return (
            <label
              key={r.id}
              htmlFor={`attach-${r.id}`}
              className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition hover:bg-muted/50", checked && "border-brand/40 bg-brand-soft/40")}
            >
              <Checkbox id={`attach-${r.id}`} checked={checked} onCheckedChange={(v) => setSelected((s) => (v ? [...s, r.id] : s.filter((x) => x !== r.id)))} className="mt-0.5" />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{r.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {r.fileType} · {r.description}
                </span>
              </span>
            </label>
          );
        })}
        {options.length === 0 && <p className="text-sm text-muted-foreground">This course has no resources yet.</p>}
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => onSave(selected)}>Save attachments</Button>
      </DialogFooter>
    </>
  );
}
