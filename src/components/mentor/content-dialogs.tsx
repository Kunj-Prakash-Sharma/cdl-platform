"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CloudUpload,
  FileVideo,
  Info,
  Paperclip,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getCourse, getResource } from "@/data";
import { formatClock, formatDate, formatNumber } from "@/lib/format";
import type { ContentItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { AutoStatus } from "@/components/shared/badges";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { VideoPlayer } from "@/components/shared/video-player";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { chapterTitle, CONTENT_STATUS_LABEL, MENTOR_ID, myCourses, myResources } from "./mentor-data";

export const RESOLUTIONS: ContentItem["resolution"][] = ["720p", "1080p", "1440p", "4K"];
const MAX_MB = 4096;
const VIDEO_EXT = /\.(mp4|mov|mkv|webm|m4v)$/i;

/** "12:30" → 750 seconds (null when invalid). */
export function parseDuration(value: string) {
  const m = /^(\d{1,3}):([0-5]\d)$/.exec(value.trim());
  if (!m) return null;
  const total = Number(m[1]) * 60 + Number(m[2]);
  return total > 0 ? total : null;
}

export const toMMSS = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

export const formatSize = (mb: number) => (mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${formatNumber(Math.round(mb))} MB`);

const titleFromFile = (name: string) => {
  const base = name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return base ? base[0].toUpperCase() + base.slice(1) : "";
};

/** Thumbnail for a content item: course artwork + duration badge. */
export function ContentThumb({ courseId, durationSec, className }: { courseId: string; durationSec: number; className?: string }) {
  const course = getCourse(courseId);
  return (
    <div className={cn("relative shrink-0", className)}>
      {course ? <CourseThumbnail course={course} size="sm" /> : <div className="aspect-video rounded-md bg-muted" />}
      <span className="absolute right-1 bottom-1 rounded bg-black/70 px-1 py-px text-[10px] font-medium text-white tabular-nums">
        {formatClock(durationSec)}
      </span>
    </div>
  );
}

type ChapterOption = { id: string; title: string };

function chapterOptionsFor(courseId: string, extra: ChapterOption[] = []): ChapterOption[] {
  const course = getCourse(courseId);
  const base = course?.chapters.map((c) => ({ id: c.id, title: c.title })) ?? [];
  return [...base, ...extra.filter((e) => !base.some((b) => b.id === e.id))];
}

function ResourcePicker({
  courseId,
  value,
  onChange,
  idPrefix,
}: {
  courseId: string;
  value: string[];
  onChange: (ids: string[]) => void;
  idPrefix: string;
}) {
  const list = myResources.filter((r) => r.courseId === courseId);
  if (!list.length) {
    return <p className="rounded-lg border border-dashed px-3 py-3 text-xs text-muted-foreground">No resources for this course yet — add them from the course workspace.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {list.map((r) => {
        const checked = value.includes(r.id);
        return (
          <label
            key={r.id}
            htmlFor={`${idPrefix}-${r.id}`}
            className={cn(
              "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition hover:bg-muted/50",
              checked && "border-brand/40 bg-brand-soft/40",
            )}
          >
            <Checkbox
              id={`${idPrefix}-${r.id}`}
              checked={checked}
              onCheckedChange={(v) => onChange(v ? [...value, r.id] : value.filter((x) => x !== r.id))}
              className="mt-0.5"
            />
            <span className="min-w-0">
              <span className="block truncate font-medium">{r.title}</span>
              <span className="text-xs text-muted-foreground">
                {r.fileType} · {r.sizeKb >= 1024 ? `${(r.sizeKb / 1024).toFixed(1)} MB` : `${r.sizeKb} KB`}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

function ResolutionHelp() {
  return (
    <p className="flex gap-1.5 text-xs text-muted-foreground">
      <Info className="mt-px size-3.5 shrink-0" />
      Phase 1 plays your original upload quality — no re-encoding. Automatic transcoding to adaptive resolutions comes in a later phase.
    </p>
  );
}

// ---------------------------------------------------------------------------------------------
// Upload dialog
// ---------------------------------------------------------------------------------------------

export function UploadVideoDialog({
  open,
  onOpenChange,
  defaultCourseId,
  defaultChapterId,
  extraChapters,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCourseId?: string;
  defaultChapterId?: string;
  /** Chapters added locally in the course workspace that aren't in the published course yet */
  extraChapters?: ChapterOption[];
}) {
  const [instance, setInstance] = useState(0);
  const change = (o: boolean) => {
    onOpenChange(o);
    if (!o) setTimeout(() => setInstance((i) => i + 1), 200);
  };
  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-2xl">
        <UploadForm
          key={`${instance}-${defaultCourseId}-${defaultChapterId}`}
          defaultCourseId={defaultCourseId}
          defaultChapterId={defaultChapterId}
          extraChapters={extraChapters}
          onClose={() => change(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

const STEPS = ["Upload video", "Details & resources", "Preview & submit"] as const;

function UploadForm({
  defaultCourseId,
  defaultChapterId,
  extraChapters,
  onClose,
}: {
  defaultCourseId?: string;
  defaultChapterId?: string;
  extraChapters?: ChapterOption[];
  onClose: () => void;
}) {
  const addContentItem = useDemoStore((s) => s.addContentItem);
  const initialCourse = defaultCourseId ?? myCourses[0].id;
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<{ name: string; sizeMb: number } | null>(null);
  const [fileError, setFileError] = useState<string>();
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [courseId, setCourseId] = useState(initialCourse);
  const [chapterId, setChapterId] = useState(defaultChapterId ?? chapterOptionsFor(initialCourse, extraChapters)[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [resolution, setResolution] = useState<ContentItem["resolution"]>("1080p");
  const [resourceIds, setResourceIds] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);

  const uploaded = progress >= 100;

  // Simulated upload: nothing leaves the browser — progress just advances on a timer.
  useEffect(() => {
    if (!file || progress >= 100) return;
    const t = window.setTimeout(() => setProgress((p) => Math.min(100, p + 6 + Math.random() * 11)), 260);
    return () => window.clearTimeout(t);
  }, [file, progress]);

  const course = getCourse(courseId)!;
  const chapters = chapterOptionsFor(courseId, courseId === defaultCourseId ? extraChapters : []);
  const durationSec = parseDuration(duration);

  const errors = {
    title: title.trim().length < 4 ? "Give the video a clear title (at least 4 characters)." : undefined,
    chapter: !chapterId ? "Choose a chapter." : undefined,
    duration: durationSec === null ? "Use mm:ss, e.g. 12:30." : undefined,
    description: description.trim().length > 400 ? "Keep the description under 400 characters." : undefined,
  };
  const detailsValid = !errors.title && !errors.chapter && !errors.duration && !errors.description;

  const acceptFile = (f: File | undefined) => {
    if (!f) return;
    const isVideo = f.type.startsWith("video/") || VIDEO_EXT.test(f.name);
    if (!isVideo) {
      setFileError("That doesn't look like a video. Choose an MP4, MOV, MKV or WEBM file.");
      return;
    }
    const sizeMb = Math.max(1, Math.round(f.size / (1024 * 1024)));
    if (sizeMb > MAX_MB) {
      setFileError("Files up to 4 GB are supported in Phase 1. Try exporting at a lower bitrate.");
      return;
    }
    setFileError(undefined);
    setFile({ name: f.name, sizeMb });
    setProgress(0);
    if (!title) setTitle(titleFromFile(f.name));
  };

  const useSample = () => {
    setFileError(undefined);
    setFile({ name: "speaker-warm-up-routine-final.mp4", sizeMb: 486 });
    setProgress(0);
    if (!title) setTitle("A 5-minute speaker warm-up routine");
    if (!duration) setDuration("10:35");
    if (!description) setDescription("Breath, voice and body warm-ups to do before any talk, interview or presentation.");
  };

  const changeCourse = (id: string) => {
    setCourseId(id);
    setChapterId(chapterOptionsFor(id, id === defaultCourseId ? extraChapters : [])[0]?.id ?? "");
    setResourceIds([]);
  };

  const next = () => {
    if (step === 0) {
      if (!file) {
        setFileError("Add a video file to continue (or use the sample recording).");
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      setTouched(true);
      if (!detailsValid) return;
      setStep(2);
    }
  };

  const save = (status: "draft" | "in-review") => {
    if (!file || !durationSec) return;
    addContentItem({
      courseId,
      chapterId,
      title: title.trim(),
      description: description.trim() || `Recorded lesson for ${course.title}.`,
      durationSec,
      resolution,
      sizeMb: file.sizeMb,
      mentorId: MENTOR_ID,
      status,
      resourceIds: resourceIds.length ? resourceIds : undefined,
    });
    if (status === "draft") toast.success("Saved as draft", { description: "Find it in your Content Library whenever you're ready to submit." });
    else toast.success("Submitted for review", { description: "The CDL content team will approve it in the admin console. Status updates appear in your library." });
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">Upload a video lesson</DialogTitle>
        <DialogDescription>Simulated upload — your file never leaves this browser. Only its name and size are read.</DialogDescription>
      </DialogHeader>

      {/* Stepper */}
      <ol className="flex items-center gap-2 text-xs" aria-label="Upload steps">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2" aria-current={i === step ? "step" : undefined}>
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                i < step && "border-brand bg-brand text-brand-foreground",
                i === step && "border-primary bg-primary text-primary-foreground",
                i > step && "text-muted-foreground",
              )}
            >
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={cn("hidden font-medium sm:inline", i !== step && "text-muted-foreground")}>{label}</span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>

      {/* Upload status (visible on every step once a file is chosen) */}
      {file && (
        <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
            <FileVideo className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <p className="truncate font-medium">{file.name}</p>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {uploaded ? formatSize(file.sizeMb) : `${formatSize((file.sizeMb * progress) / 100)} of ${formatSize(file.sizeMb)}`}
              </span>
            </div>
            <Progress value={progress} className="mt-2 h-1.5 [&>[data-slot=progress-indicator]]:bg-brand" />
            <p className={cn("mt-1.5 flex items-center gap-1 text-xs", uploaded ? "text-success" : "text-muted-foreground")}>
              {uploaded ? (
                <>
                  <CheckCircle2 className="size-3.5" /> Uploaded · stored at original quality
                </>
              ) : (
                <>Uploading… {Math.floor(progress)}% (simulated)</>
              )}
            </p>
          </div>
          {step === 0 && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Remove file"
              onClick={() => {
                setFile(null);
                setProgress(0);
              }}
            >
              <X />
            </Button>
          )}
        </div>
      )}

      {step === 0 && (
        <div className="space-y-3">
          <label
            htmlFor="video-file"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              acceptFile(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition",
              dragging ? "border-brand bg-brand-soft/60" : "border-border bg-muted/30 hover:border-brand/50 hover:bg-brand-soft/30",
              fileError && "border-destructive/50",
            )}
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-background shadow-xs ring-1 ring-border">
              <CloudUpload className="size-6 text-brand" />
            </span>
            <p className="mt-3 font-heading font-semibold">{file ? "Drop a different file to replace it" : "Drag and drop your recording here"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              or <span className="font-medium text-primary underline underline-offset-2">browse your computer</span> · MP4, MOV, MKV or WEBM up to 4 GB
            </p>
            <input
              id="video-file"
              type="file"
              accept="video/*,.mp4,.mov,.mkv,.webm,.m4v"
              className="sr-only"
              onChange={(e) => {
                acceptFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {fileError && (
            <p className="flex items-center gap-1.5 text-sm text-destructive" role="alert">
              <AlertTriangle className="size-4" /> {fileError}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
            <span>No recording handy? Use a sample file to walk through the flow.</span>
            <Button variant="outline" size="sm" onClick={useSample}>
              <Sparkles /> Use sample recording
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="up-course">Course</Label>
            <Select value={courseId} onValueChange={changeCourse}>
              <SelectTrigger id="up-course" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {myCourses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="up-chapter">Chapter</Label>
            <Select value={chapterId} onValueChange={setChapterId}>
              <SelectTrigger id="up-chapter" className="w-full" aria-invalid={touched && Boolean(errors.chapter)}>
                <SelectValue placeholder="Choose a chapter" />
              </SelectTrigger>
              <SelectContent>
                {chapters.map((c, i) => (
                  <SelectItem key={c.id} value={c.id}>
                    {i + 1}. {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="up-title">Title</Label>
            <Input id="up-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Handling Q&A after your talk" aria-invalid={touched && Boolean(errors.title)} />
            {touched && errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="up-desc">Description</Label>
              <span className={cn("text-xs tabular-nums", description.length > 400 ? "text-destructive" : "text-muted-foreground")}>{description.length}/400</span>
            </div>
            <Textarea id="up-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will learners be able to do after this lesson?" aria-invalid={touched && Boolean(errors.description)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="up-duration">Duration (mm:ss)</Label>
            <Input id="up-duration" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="12:30" aria-invalid={touched && Boolean(errors.duration)} />
            {touched && errors.duration && <p className="text-xs text-destructive">{errors.duration}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="up-res">Recorded resolution</Label>
            <Select value={resolution} onValueChange={(v) => setResolution(v as ContentItem["resolution"])}>
              <SelectTrigger id="up-res" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <ResolutionHelp />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="flex items-center gap-1.5">
              <Paperclip className="size-3.5" /> Attach learning resources
            </Label>
            <ResourcePicker courseId={courseId} value={resourceIds} onChange={setResourceIds} idPrefix="up-res" />
          </div>
        </div>
      )}

      {step === 2 && durationSec && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="p-2 pb-0">
                <ContentThumb courseId={courseId} durationSec={durationSec} />
              </div>
              <div className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-heading text-sm leading-snug font-semibold">{title}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {course.title} · {chapters.find((c) => c.id === chapterId)?.title}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{formatClock(durationSec)}</span>
                  <span>{resolution}</span>
                  <span>{file && formatSize(file.sizeMb)}</span>
                  <span>{resourceIds.length} resource{resourceIds.length === 1 ? "" : "s"}</span>
                </div>
              </div>
            </div>
            <VideoPlayer
              course={course}
              lesson={{ id: "upload-preview", title, durationSec }}
              contextLabel="Preview"
              originalQuality={resolution}
              className="self-start rounded-xl"
            />
          </div>
          {description && <p className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">{description}</p>}
          {resourceIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {resourceIds.map((id) => (
                <span key={id} className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs">
                  <Paperclip className="size-3" /> {getResource(id)?.title}
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2.5 rounded-xl border border-info/20 bg-info-soft p-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-info" />
            <p className="text-foreground/80">
              <span className="font-medium">Submit for review</span> sends it to the CDL content team. Once approved in the admin console it&apos;s published to
              learners automatically. <span className="font-medium">Save as draft</span> keeps it private to you.
            </p>
          </div>
          {!uploaded && (
            <p className="flex items-center gap-1.5 text-xs text-warning">
              <RefreshCw className="size-3.5 animate-spin" /> Upload still in progress — you can submit once it reaches 100%.
            </p>
          )}
        </div>
      )}

      <DialogFooter className="sm:justify-between">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft /> Back
          </Button>
        ) : (
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        )}
        {step < 2 ? (
          <Button onClick={next} className="h-9 px-4">
            Continue <ArrowRight />
          </Button>
        ) : (
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" className="h-9" disabled={!uploaded} onClick={() => save("draft")}>
              Save as draft
            </Button>
            <Button className="h-9 bg-brand px-4 text-brand-foreground hover:bg-brand/90" disabled={!uploaded} onClick={() => save("in-review")}>
              <Send /> Submit for review
            </Button>
          </div>
        )}
      </DialogFooter>
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Edit metadata dialog
// ---------------------------------------------------------------------------------------------

export function EditContentDialog({ item, open, onOpenChange }: { item: ContentItem | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-xl">
        {item && <EditForm key={item.id} item={item} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function EditForm({ item, onClose }: { item: ContentItem; onClose: () => void }) {
  const updateContentItem = useDemoStore((s) => s.updateContentItem);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [chapterId, setChapterId] = useState(item.chapterId);
  const [duration, setDuration] = useState(toMMSS(item.durationSec));
  const [resolution, setResolution] = useState(item.resolution);
  const [resourceIds, setResourceIds] = useState<string[]>(item.resourceIds ?? []);
  const [touched, setTouched] = useState(false);

  const chapters = chapterOptionsFor(item.courseId, [{ id: item.chapterId, title: chapterTitle(item.courseId, item.chapterId) }]);
  const durationSec = parseDuration(duration);
  const errors = {
    title: title.trim().length < 4 ? "Title needs at least 4 characters." : undefined,
    duration: durationSec === null ? "Use mm:ss, e.g. 12:30." : undefined,
  };
  const valid = !errors.title && !errors.duration;

  const save = (nextStatus?: ContentItem["status"]) => {
    setTouched(true);
    if (!valid || !durationSec) return;
    updateContentItem(item.id, {
      title: title.trim(),
      description: description.trim(),
      chapterId,
      durationSec,
      resolution,
      resourceIds,
      ...(nextStatus ? { status: nextStatus, reviewNote: undefined } : {}),
    });
    if (nextStatus === "in-review")
      toast.success(item.status === "changes-requested" ? "Resubmitted for review" : "Submitted for review", {
        description: "The content team will see it in the admin review queue.",
      });
    else toast.success("Metadata saved", { description: item.status === "published" ? "Learners see the updated details right away." : undefined });
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">Edit video details</DialogTitle>
        <DialogDescription>
          {getCourse(item.courseId)?.title} · uploaded {formatDate(item.uploadedOn)} · currently {CONTENT_STATUS_LABEL[item.status].toLowerCase()}
        </DialogDescription>
      </DialogHeader>
      {item.status === "changes-requested" && item.reviewNote && (
        <div className="flex gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="font-medium">Reviewer note</p>
            <p className="text-muted-foreground">{item.reviewNote}</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ed-title">Title</Label>
          <Input id="ed-title" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={touched && Boolean(errors.title)} />
          {touched && errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ed-desc">Description</Label>
          <Textarea id="ed-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ed-chapter">Chapter</Label>
          <Select value={chapterId} onValueChange={setChapterId}>
            <SelectTrigger id="ed-chapter" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {chapters.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ed-duration">Duration (mm:ss)</Label>
          <Input id="ed-duration" value={duration} onChange={(e) => setDuration(e.target.value)} aria-invalid={touched && Boolean(errors.duration)} />
          {touched && errors.duration && <p className="text-xs text-destructive">{errors.duration}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ed-res">Resolution</Label>
          <Select value={resolution} onValueChange={(v) => setResolution(v as ContentItem["resolution"])}>
            <SelectTrigger id="ed-res" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOLUTIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <ResolutionHelp />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Learning resources</Label>
          <ResourcePicker courseId={item.courseId} value={resourceIds} onChange={setResourceIds} idPrefix="ed-res" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        {item.status === "draft" || item.status === "changes-requested" ? (
          <>
            <Button variant="outline" onClick={() => save()}>
              Save changes
            </Button>
            <Button className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => save("in-review")}>
              <Send /> {item.status === "draft" ? "Save & submit for review" : "Save & resubmit"}
            </Button>
          </>
        ) : (
          <Button onClick={() => save()}>Save changes</Button>
        )}
      </DialogFooter>
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Preview dialog
// ---------------------------------------------------------------------------------------------

export function ContentPreviewDialog({ item, open, onOpenChange }: { item: ContentItem | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const course = item ? getCourse(item.courseId) : undefined;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-3xl">
        {item && course && (
          <>
            <DialogHeader className="pr-8">
              <DialogTitle className="text-lg leading-snug font-semibold">{item.title}</DialogTitle>
              <DialogDescription>
                {course.title} · {chapterTitle(item.courseId, item.chapterId)}
              </DialogDescription>
            </DialogHeader>
            <VideoPlayer
              course={course}
              lesson={{ id: item.id, title: item.title, durationSec: item.durationSec }}
              contextLabel={chapterTitle(item.courseId, item.chapterId)}
              originalQuality={item.resolution}
            />
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <AutoStatus status={item.status} label={CONTENT_STATUS_LABEL[item.status]} />
              <span>{formatClock(item.durationSec)}</span>·<span>{item.resolution} original</span>·<span>{formatSize(item.sizeMb)}</span>·
              <span>Uploaded {formatDate(item.uploadedOn)}</span>·<span>{formatNumber(item.views)} views</span>
            </div>
            {item.reviewNote && (
              <div className="flex gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <p>
                  <span className="font-medium">Reviewer note: </span>
                  <span className="text-muted-foreground">{item.reviewNote}</span>
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{item.description}</p>
            {item.resourceIds && item.resourceIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.resourceIds.map((id) => (
                  <span key={id} className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs">
                    <Paperclip className="size-3" /> {getResource(id)?.title ?? id}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
