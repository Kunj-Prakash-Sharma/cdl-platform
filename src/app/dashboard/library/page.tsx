"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, LayoutGrid, List, Lock, PlayCircle, Search, X } from "lucide-react";
import { toast } from "sonner";
import { getMentor } from "@/data";
import { CATEGORIES } from "@/data/constants";
import { formatDuration } from "@/lib/format";
import type { Course, Lesson } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useCourses, useMyEnrollments } from "@/store/hooks";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { EmptyState, PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTouchLesson } from "@/components/learner/hooks";
import { lessonContextLabel } from "@/components/learner/utils";

type Item = { course: Course; lesson: Lesson; context: string };
const DURATIONS = { all: "Any length", short: "Under 10 min", medium: "10–15 min", long: "Over 15 min" } as const;
type DurationKey = keyof typeof DURATIONS;

export default function VideoLibraryPage() {
  const router = useRouter();
  const courses = useCourses();
  const enrollments = useMyEnrollments();
  const lessonProgress = useDemoStore((s) => s.lessonProgress);
  const touch = useTouchLesson();
  const [q, setQ] = useState("");
  const [courseId, setCourseId] = useState("all");
  const [category, setCategory] = useState("all");
  const [duration, setDuration] = useState<DurationKey>("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  const enrolledIds = useMemo(() => new Set(enrollments.map((e) => e.courseId)), [enrollments]);
  const publicCourses = useMemo(() => courses.filter((c) => !c.collegeId && c.status === "published"), [courses]);
  const all: Item[] = useMemo(
    () =>
      publicCourses.flatMap((course) =>
        course.chapters.flatMap((ch) => ch.lessons.filter((l) => l.kind === "video").map((lesson) => ({ course, lesson, context: `${ch.title} · ${lessonContextLabel(course, lesson.id)}` }))),
      ),
    [publicCourses],
  );
  const items = all.filter(({ course, lesson }) => {
    if (mineOnly && !enrolledIds.has(course.id)) return false;
    if (courseId !== "all" && course.id !== courseId) return false;
    if (category !== "all" && course.category !== category) return false;
    const m = lesson.durationSec / 60;
    if (duration === "short" && m >= 10) return false;
    if (duration === "medium" && (m < 10 || m > 15)) return false;
    if (duration === "long" && m <= 15) return false;
    const text = q.trim().toLowerCase();
    if (text && !`${lesson.title} ${course.title} ${getMentor(course.instructorId)?.name}`.toLowerCase().includes(text)) return false;
    return true;
  });
  const filtered = q || courseId !== "all" || category !== "all" || duration !== "all" || mineOnly;

  const open = (item: Item) => {
    if (enrolledIds.has(item.course.id)) {
      touch(item.course.id, item.lesson.id);
      router.push(`/dashboard/learn/${item.course.id}`);
    } else if (item.lesson.preview) {
      router.push(`/courses/${item.course.id}`);
    } else {
      toast("Locked lesson", { description: `Enrol in ${item.course.title} to watch this lesson.`, action: { label: "View course", onClick: () => router.push(`/courses/${item.course.id}`) } });
    }
  };
  const reset = () => {
    setQ("");
    setCourseId("all");
    setCategory("all");
    setDuration("all");
    setMineOnly(false);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Learn"
        title="Video Library"
        description={`${all.length} recorded lessons across ${publicCourses.length} programmes. Lessons from your enrolled programmes open in the course player.`}
      />

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-xs lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lessons, courses or mentors" className="h-9 pl-8" aria-label="Search lessons" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger className="h-9 w-full sm:w-52" aria-label="Filter by course">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {publicCourses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-9 w-[calc(50%-4px)] sm:w-44" aria-label="Filter by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={duration} onValueChange={(v) => setDuration(v as DurationKey)}>
            <SelectTrigger className="h-9 w-[calc(50%-4px)] sm:w-36" aria-label="Filter by duration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DURATIONS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5">
            <Switch id="mine-only" checked={mineOnly} onCheckedChange={setMineOnly} />
            <Label htmlFor="mine-only" className="text-sm whitespace-nowrap">
              My courses only
            </Label>
          </div>
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as "grid" | "list")} variant="outline" spacing={0} aria-label="Layout">
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGrid />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {items.length} of {all.length} lessons
        </span>
        {filtered && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <X /> Clear filters
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Search} title="No lessons match" description="Try a different search or clear the filters." action={<Button size="sm" onClick={reset}>Clear filters</Button>} />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <LessonTile key={item.lesson.id} item={item} enrolled={enrolledIds.has(item.course.id)} done={Boolean(lessonProgress[item.course.id]?.includes(item.lesson.id))} onOpen={() => open(item)} />
          ))}
        </div>
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card shadow-xs">
          {items.map((item) => (
            <LessonRow key={item.lesson.id} item={item} enrolled={enrolledIds.has(item.course.id)} done={Boolean(lessonProgress[item.course.id]?.includes(item.lesson.id))} onOpen={() => open(item)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AccessBadge({ enrolled, preview, done }: { enrolled: boolean; preview?: boolean; done: boolean }) {
  if (enrolled && done) return <span className="inline-flex items-center gap-1 text-xs font-medium text-brand"><CheckCircle2 className="size-3.5" /> Watched</span>;
  if (enrolled) return <span className="inline-flex items-center gap-1 text-xs font-medium text-primary"><PlayCircle className="size-3.5" /> Enrolled</span>;
  if (preview) return <span className="inline-flex items-center gap-1 text-xs font-medium text-info"><PlayCircle className="size-3.5" /> Free preview</span>;
  return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Lock className="size-3.5" /> Locked</span>;
}

function LessonTile({ item, enrolled, done, onOpen }: { item: Item; enrolled: boolean; done: boolean; onOpen: () => void }) {
  const mentor = getMentor(item.course.instructorId);
  const locked = !enrolled && !item.lesson.preview;
  return (
    <button type="button" onClick={onOpen} className="group flex flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
      <div className="relative p-2 pb-0">
        <CourseThumbnail course={item.course} size="sm" className={cn("rounded-xl", locked && "opacity-70 saturate-50")} />
        <span className="absolute right-4 bottom-2 rounded bg-black/65 px-1.5 py-0.5 font-mono text-[11px] text-white">{formatDuration(item.lesson.durationSec)}</span>
        <span className="absolute inset-0 m-2 mb-0 flex items-center justify-center rounded-xl opacity-0 transition group-hover:opacity-100">
          <span className="flex size-11 items-center justify-center rounded-full bg-white/95 text-navy shadow">{locked ? <Lock className="size-5" /> : <PlayCircle className="size-6" />}</span>
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <p className="line-clamp-2 text-sm leading-snug font-semibold group-hover:text-primary">{item.lesson.title}</p>
        <p className="truncate text-xs text-muted-foreground">{item.course.title}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
          <span className="truncate text-xs text-muted-foreground">{mentor?.name}</span>
          <AccessBadge enrolled={enrolled} preview={item.lesson.preview} done={done} />
        </div>
      </div>
    </button>
  );
}

function LessonRow({ item, enrolled, done, onOpen }: { item: Item; enrolled: boolean; done: boolean; onOpen: () => void }) {
  const mentor = getMentor(item.course.instructorId);
  return (
    <li>
      <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-muted/50 sm:gap-4">
        <div className="w-24 shrink-0 sm:w-32">
          <CourseThumbnail course={item.course} size="sm" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{item.lesson.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {item.course.title} · {item.context}
          </p>
          <p className="mt-1 text-xs text-muted-foreground sm:hidden">
            {mentor?.name} · {formatDuration(item.lesson.durationSec)}
          </p>
        </div>
        <span className="hidden w-36 truncate text-sm text-muted-foreground md:block">{mentor?.name}</span>
        <span className="hidden w-16 items-center gap-1 text-sm text-muted-foreground sm:inline-flex">
          <Clock className="size-3.5" /> {Math.round(item.lesson.durationSec / 60)}m
        </span>
        <span className="w-24 shrink-0 text-right">
          <AccessBadge enrolled={enrolled} preview={item.lesson.preview} done={done} />
        </span>
      </button>
    </li>
  );
}
