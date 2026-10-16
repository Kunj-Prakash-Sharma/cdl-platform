"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CircleCheck,
  Clapperboard,
  Clock3,
  Ellipsis,
  EyeOff,
  HardDrive,
  Inbox,
  MessageSquareWarning,
  Paperclip,
  Play,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { getMentor } from "@/data";
import { formatClock, formatDate, formatNumber, relativeDay } from "@/lib/format";
import type { ContentItem, Course } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useMentors } from "@/store/hooks";
import { AutoStatus } from "@/components/shared/badges";
import { CourseIcon } from "@/components/shared/course-thumbnail";
import { EmptyState, PageHeader, StatCard } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { VideoPlayer } from "@/components/shared/video-player";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ClearFiltersButton,
  ConfirmDialog,
  DetailRow,
  Field,
  FilterBar,
  FilterSelect,
  InfoNote,
  ResultsMeta,
  SearchField,
  TableCard,
  TableEmptyRow,
} from "./admin-kit";
import { useCourseLookup } from "./course-utils";
import { formatSize } from "./curriculum-builder";

const STATUS_LABEL: Record<ContentItem["status"], string> = {
  published: "Published",
  "in-review": "In review",
  draft: "Draft",
  "changes-requested": "Changes requested",
};
const RESOLUTIONS: ContentItem["resolution"][] = ["720p", "1080p", "1440p", "4K"];
const PAGE_SIZE = 12;
const QUICK_NOTES = ["Audio levels are uneven", "Please add captions", "Trim the dead air at the start", "Slides are hard to read at 720p", "Re-export at 1080p"];

type Lookup = (id: string) => Course | undefined;

function chapterTitle(course: Course | undefined, chapterId: string) {
  return course?.chapters.find((c) => c.id === chapterId)?.title ?? "Unassigned chapter";
}

function MiniThumb({ course, className }: { course?: Course; className?: string }) {
  return (
    <div
      className={cn("relative flex aspect-video w-16 shrink-0 items-center justify-center overflow-hidden rounded-md", className)}
      style={{ backgroundImage: course ? `linear-gradient(135deg, ${course.thumbnail.from}, ${course.thumbnail.to})` : undefined }}
      aria-hidden="true"
    >
      {course ? <CourseIcon theme={course.thumbnail} className="size-4 text-white/40" /> : null}
      <span className="absolute flex size-6 items-center justify-center rounded-full bg-white/90 shadow-sm">
        <Play className="ml-px size-3 fill-primary text-primary" />
      </span>
    </div>
  );
}

export function VideoLibrary() {
  const items = useDemoStore((s) => s.contentItems);
  const updateContentItem = useDemoStore((s) => s.updateContentItem);
  const removeContentItem = useDemoStore((s) => s.removeContentItem);
  const lookup = useCourseLookup();
  const mentors = useMentors();

  const [tab, setTab] = useState("review");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [course, setCourse] = useState("all");
  const [mentor, setMentor] = useState("all");
  const [resolution, setResolution] = useState("all");
  const [page, setPage] = useState(0);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [changesId, setChangesId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const sorted = useMemo(() => [...items].sort((a, b) => b.uploadedOn.localeCompare(a.uploadedOn) || a.title.localeCompare(b.title)), [items]);
  const queue = useMemo(() => sorted.filter((i) => i.status === "in-review").sort((a, b) => a.uploadedOn.localeCompare(b.uploadedOn)), [sorted]);
  const sentBack = useMemo(() => sorted.filter((i) => i.status === "changes-requested" || i.status === "draft"), [sorted]);

  const stats = useMemo(() => {
    const sec = items.reduce((n, i) => n + i.durationSec, 0);
    const mb = items.reduce((n, i) => n + i.sizeMb, 0);
    return {
      count: items.length,
      published: items.filter((i) => i.status === "published").length,
      hours: sec / 3600,
      gb: mb / 1024,
      inReview: queue.length,
      views: items.reduce((n, i) => n + i.views, 0),
    };
  }, [items, queue.length]);

  const courseOptions = useMemo(() => {
    const ids = Array.from(new Set(items.map((i) => i.courseId)));
    return ids.map((id) => ({ value: id, label: lookup(id)?.title ?? id })).sort((a, b) => a.label.localeCompare(b.label));
  }, [items, lookup]);
  const mentorOptions = useMemo(() => {
    const ids = new Set(items.map((i) => i.mentorId));
    return mentors.filter((m) => ids.has(m.id)).map((m) => ({ value: m.id, label: m.name }));
  }, [items, mentors]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return sorted.filter((i) => {
      if (status !== "all" && i.status !== status) return false;
      if (course !== "all" && i.courseId !== course) return false;
      if (mentor !== "all" && i.mentorId !== mentor) return false;
      if (resolution !== "all" && i.resolution !== resolution) return false;
      if (term) {
        const c = lookup(i.courseId);
        const hay = [i.title, i.description, c?.title ?? "", chapterTitle(c, i.chapterId), getMentor(i.mentorId)?.name ?? ""].join(" ").toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [sorted, q, status, course, mentor, resolution, lookup]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const hasFilters = q !== "" || status !== "all" || course !== "all" || mentor !== "all" || resolution !== "all";
  const resetFilters = () => {
    setQ("");
    setStatus("all");
    setCourse("all");
    setMentor("all");
    setResolution("all");
    setPage(0);
  };
  const withReset =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setPage(0);
    };

  function approve(item: ContentItem) {
    updateContentItem(item.id, { status: "published", reviewNote: undefined });
    toast.success("Approved & published", { description: `“${item.title}” is now live for enrolled learners at its original ${item.resolution} quality.` });
  }
  function unpublish(item: ContentItem) {
    updateContentItem(item.id, { status: "draft" });
    toast.success("Recording unpublished", { description: `“${item.title}” is hidden from learners and moved back to draft.` });
  }

  const previewItem = previewId ? byId.get(previewId) : undefined;
  const changesItem = changesId ? byId.get(changesId) : undefined;
  const removeItem = removeId ? byId.get(removeId) : undefined;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Video Library"
        description="One central library for every recorded lesson. Review mentor uploads, publish approved recordings and keep the catalog tidy."
        actions={
          <Button variant="outline" className="h-9" asChild>
            <Link href="/admin/courses">
              <Clapperboard className="size-4" />
              Manage courses
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Recordings" value={formatNumber(stats.count)} icon={Clapperboard} hint={`${stats.published} published · ${formatNumber(stats.views)} views`} />
        <StatCard label="Total runtime" value={`${stats.hours.toFixed(1)} h`} icon={Clock3} accent="brand" hint="Across all courses" />
        <StatCard label="Storage used" value={`${stats.gb.toFixed(1)} GB`} icon={HardDrive} accent="info" hint="Original-quality files" />
        <StatCard
          label="In review"
          value={stats.inReview}
          icon={ShieldCheck}
          accent="warning"
          hint={stats.inReview ? "Mentor uploads awaiting approval" : "Review queue is clear"}
        />
      </div>

      <InfoNote>
        All recordings live in <span className="font-medium">one central library</span> and play at their original upload quality. Uploads from the Mentor
        Portal appear here instantly for review. Transcoding and adaptive streaming are planned for Phase 2.
      </InfoNote>

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList className="h-9!">
          <TabsTrigger value="review" className="px-3">
            Review queue
            <span className="ml-1 rounded-full bg-warning-soft px-1.5 text-[11px] font-semibold text-warning tabular-nums">{queue.length}</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="px-3">
            All content
            <span className="ml-1 rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground tabular-nums">{items.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-6">
          {queue.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="The review queue is clear"
              description="New mentor uploads will show up here for approval. Everything submitted so far has been reviewed."
              action={
                <Button variant="outline" size="sm" onClick={() => setTab("all")}>
                  Browse all content
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {queue.map((item) => (
                <ReviewCard
                  key={item.id}
                  item={item}
                  lookup={lookup}
                  onPreview={() => setPreviewId(item.id)}
                  onApprove={() => approve(item)}
                  onRequestChanges={() => setChangesId(item.id)}
                  onRemove={() => setRemoveId(item.id)}
                />
              ))}
            </div>
          )}

          {sentBack.length > 0 && (
            <section className="space-y-3">
              <div>
                <h2 className="font-heading text-[15px] font-semibold">Drafts & sent back to mentors</h2>
                <p className="text-[13px] text-muted-foreground">Uploads that are still drafts or need changes before they can be published.</p>
              </div>
              <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-xs">
                {sentBack.map((item) => {
                  const c = lookup(item.courseId);
                  const m = getMentor(item.mentorId);
                  return (
                    <li key={item.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <MiniThumb course={c} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{item.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {c?.title} · {m?.name} · uploaded {relativeDay(item.uploadedOn).toLowerCase()}
                          </p>
                          {item.reviewNote && (
                            <p className="mt-1 flex items-start gap-1.5 text-xs text-destructive">
                              <MessageSquareWarning className="mt-px size-3.5 shrink-0" />
                              {item.reviewNote}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 pl-[76px] sm:pl-0">
                        <AutoStatus status={item.status} label={STATUS_LABEL[item.status]} />
                        <Button variant="outline" size="sm" onClick={() => setPreviewId(item.id)}>
                          <Play className="size-3.5" />
                          Preview
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => approve(item)}>
                          Publish anyway
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-3">
          <FilterBar right={<ResultsMeta shown={filtered.length} total={items.length} noun="recordings" onReset={resetFilters} />}>
            <SearchField value={q} onChange={withReset(setQ)} placeholder="Search title, course or mentor…" label="Search recordings" />
            <FilterSelect
              label="Status"
              allLabel="All statuses"
              value={status}
              onValueChange={withReset(setStatus)}
              options={(Object.keys(STATUS_LABEL) as ContentItem["status"][]).map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
              className="sm:w-44"
            />
            <FilterSelect label="Course" allLabel="All courses" value={course} onValueChange={withReset(setCourse)} options={courseOptions} className="sm:w-52" />
            <FilterSelect label="Mentor" allLabel="All mentors" value={mentor} onValueChange={withReset(setMentor)} options={mentorOptions} className="sm:w-44" />
            <FilterSelect
              label="Resolution"
              allLabel="Any resolution"
              value={resolution}
              onValueChange={withReset(setResolution)}
              options={RESOLUTIONS.map((r) => ({ value: r, label: r }))}
              className="sm:w-36"
            />
            <ClearFiltersButton visible={hasFilters} onClick={resetFilters} />
          </FilterBar>

          <TableCard
            footer={
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>
                  Page {safePage + 1} of {pageCount}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            }
          >
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Recording</TableHead>
                  <TableHead>Mentor</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.length === 0 && (
                  <TableEmptyRow
                    colSpan={8}
                    icon={Clapperboard}
                    action={
                      <Button variant="outline" size="sm" onClick={resetFilters}>
                        Clear filters
                      </Button>
                    }
                  />
                )}
                {pageItems.map((item) => {
                  const c = lookup(item.courseId);
                  const m = getMentor(item.mentorId);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex min-w-[300px] items-center gap-3">
                          <button type="button" onClick={() => setPreviewId(item.id)} aria-label={`Preview ${item.title}`} className="rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                            <MiniThumb course={c} />
                          </button>
                          <div className="min-w-0">
                            <button type="button" onClick={() => setPreviewId(item.id)} className="block max-w-[320px] truncate text-left font-medium hover:text-primary hover:underline">
                              {item.title}
                            </button>
                            <p className="max-w-[320px] truncate text-xs text-muted-foreground">
                              {c?.title ?? item.courseId} · {chapterTitle(c, item.chapterId)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {m && (
                          <div className="flex items-center gap-2">
                            <Portrait avatar={m.avatar} name={m.name} className="size-7" />
                            <span className="text-[13px] whitespace-nowrap">{m.name}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatClock(item.durationSec)}</TableCell>
                      <TableCell>
                        <span className="inline-flex h-5 items-center rounded bg-muted px-1.5 text-[11px] font-semibold text-foreground">{item.resolution}</span>
                        <div className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">{formatSize(item.sizeMb)}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(item.uploadedOn)}
                        <div className="text-[11px] text-muted-foreground">{relativeDay(item.uploadedOn)}</div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{item.views ? formatNumber(item.views) : "—"}</TableCell>
                      <TableCell>
                        <AutoStatus status={item.status} label={STATUS_LABEL[item.status]} />
                      </TableCell>
                      <TableCell>
                        <ItemActions
                          item={item}
                          onPreview={() => setPreviewId(item.id)}
                          onApprove={() => approve(item)}
                          onRequestChanges={() => setChangesId(item.id)}
                          onUnpublish={() => unpublish(item)}
                          onRemove={() => setRemoveId(item.id)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableCard>
        </TabsContent>
      </Tabs>

      <PreviewDialog
        item={previewItem}
        lookup={lookup}
        onOpenChange={(open) => !open && setPreviewId(null)}
        onApprove={(item) => {
          approve(item);
          setPreviewId(null);
        }}
        onRequestChanges={(item) => {
          setPreviewId(null);
          setChangesId(item.id);
        }}
      />

      <Dialog open={!!changesItem} onOpenChange={(open) => !open && setChangesId(null)}>
        {changesItem && (
          <RequestChangesForm
            key={changesItem.id}
            item={changesItem}
            onCancel={() => setChangesId(null)}
            onSubmit={(note) => {
              updateContentItem(changesItem.id, { status: "changes-requested", reviewNote: note });
              toast.success("Changes requested", { description: `${getMentor(changesItem.mentorId)?.name ?? "The mentor"} will see your note in the Mentor Portal.` });
              setChangesId(null);
            }}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={!!removeItem}
        onOpenChange={(open) => !open && setRemoveId(null)}
        title={`Remove “${removeItem?.title ?? ""}”?`}
        description="The recording is deleted from the central library and unlinked from its lesson. This can't be undone in the demo."
        confirmLabel="Remove recording"
        destructive
        onConfirm={() => {
          if (!removeItem) return;
          removeContentItem(removeItem.id);
          toast.success("Recording removed", { description: removeItem.title });
          setRemoveId(null);
        }}
      />
    </div>
  );
}

function ItemActions({
  item,
  onPreview,
  onApprove,
  onRequestChanges,
  onUnpublish,
  onRemove,
}: {
  item: ContentItem;
  onPreview: () => void;
  onApprove: () => void;
  onRequestChanges: () => void;
  onUnpublish: () => void;
  onRemove: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${item.title}`}>
          <Ellipsis className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={onPreview}>
          <Play />
          Preview
        </DropdownMenuItem>
        {item.status !== "published" && (
          <DropdownMenuItem onSelect={onApprove}>
            <CircleCheck />
            Approve & publish
          </DropdownMenuItem>
        )}
        {item.status !== "changes-requested" && (
          <DropdownMenuItem onSelect={onRequestChanges}>
            <MessageSquareWarning />
            Request changes
          </DropdownMenuItem>
        )}
        {item.status === "published" && (
          <DropdownMenuItem onSelect={onUnpublish}>
            <EyeOff />
            Unpublish
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onRemove}>
          <Trash2 />
          Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ReviewCard({
  item,
  lookup,
  onPreview,
  onApprove,
  onRequestChanges,
  onRemove,
}: {
  item: ContentItem;
  lookup: Lookup;
  onPreview: () => void;
  onApprove: () => void;
  onRequestChanges: () => void;
  onRemove: () => void;
}) {
  const c = lookup(item.courseId);
  const m = getMentor(item.mentorId);
  return (
    <article className="flex flex-col rounded-2xl border bg-card p-4 shadow-xs">
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onPreview}
          aria-label={`Preview ${item.title}`}
          className="group relative flex aspect-video w-36 shrink-0 items-center justify-center overflow-hidden rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:w-44"
          style={{ backgroundImage: c ? `linear-gradient(135deg, ${c.thumbnail.from}, ${c.thumbnail.to})` : undefined }}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-white/90 shadow-md transition-transform group-hover:scale-105">
            <Play className="ml-0.5 size-4 fill-primary text-primary" />
          </span>
          <span className="absolute right-1.5 bottom-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10.5px] font-medium text-white tabular-nums">
            {formatClock(item.durationSec)}
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-heading leading-snug font-semibold">{item.title}</p>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {c?.title} · {chapterTitle(c, item.chapterId)}
          </p>
          <p className="mt-1.5 line-clamp-2 text-[13px] text-muted-foreground">{item.description}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-3 text-xs text-muted-foreground">
        {m && (
          <span className="flex items-center gap-1.5">
            <Portrait avatar={m.avatar} name={m.name} className="size-5" />
            <span className="font-medium text-foreground">{m.name}</span>
          </span>
        )}
        <span className="flex items-center gap-1">
          <Upload className="size-3.5" />
          {relativeDay(item.uploadedOn)}
        </span>
        <span>
          {item.resolution} · {formatSize(item.sizeMb)}
        </span>
        {!!item.resourceIds?.length && (
          <span className="flex items-center gap-1">
            <Paperclip className="size-3.5" />
            {item.resourceIds.length} resource
          </span>
        )}
        <AutoStatus status={item.status} label={STATUS_LABEL[item.status]} className="ml-auto" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onPreview}>
          <Play className="size-3.5" />
          Preview
        </Button>
        <Button size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={onApprove}>
          <CircleCheck className="size-3.5" />
          Approve & publish
        </Button>
        <Button variant="outline" size="sm" onClick={onRequestChanges}>
          <MessageSquareWarning className="size-3.5" />
          Request changes
        </Button>
        <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground hover:text-destructive" onClick={onRemove}>
          <Trash2 className="size-3.5" />
          Remove
        </Button>
      </div>
    </article>
  );
}

function PreviewDialog({
  item,
  lookup,
  onOpenChange,
  onApprove,
  onRequestChanges,
}: {
  item?: ContentItem;
  lookup: Lookup;
  onOpenChange: (open: boolean) => void;
  onApprove: (item: ContentItem) => void;
  onRequestChanges: (item: ContentItem) => void;
}) {
  const c = item ? lookup(item.courseId) : undefined;
  const m = item ? getMentor(item.mentorId) : undefined;
  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      {item && (
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="pr-6">{item.title}</DialogTitle>
            <DialogDescription>
              {c?.title ?? item.courseId} · {chapterTitle(c, item.chapterId)}
            </DialogDescription>
          </DialogHeader>
          {c ? (
            <VideoPlayer
              course={c}
              lesson={{ id: item.id, title: item.title, durationSec: item.durationSec }}
              contextLabel={chapterTitle(c, item.chapterId)}
              originalQuality={item.resolution}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">Course not found for this recording.</div>
          )}
          <div className="grid gap-x-8 sm:grid-cols-2">
            <div className="divide-y">
              <DetailRow label="Status">
                <AutoStatus status={item.status} label={STATUS_LABEL[item.status]} />
              </DetailRow>
              <DetailRow label="Mentor">{m?.name ?? "—"}</DetailRow>
              <DetailRow label="Uploaded">{formatDate(item.uploadedOn)}</DetailRow>
            </div>
            <div className="divide-y">
              <DetailRow label="Original quality">{item.resolution}</DetailRow>
              <DetailRow label="File size">{formatSize(item.sizeMb)}</DetailRow>
              <DetailRow label="Duration · views">
                {formatClock(item.durationSec)} · {formatNumber(item.views)}
              </DetailRow>
            </div>
          </div>
          <p className="text-[13px] text-muted-foreground">{item.description}</p>
          {item.reviewNote && (
            <InfoNote icon={MessageSquareWarning} tone="warning">
              <span className="font-medium">Review note:</span> {item.reviewNote}
            </InfoNote>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {item.status !== "changes-requested" && (
              <Button variant="outline" onClick={() => onRequestChanges(item)}>
                <MessageSquareWarning className="size-4" />
                Request changes
              </Button>
            )}
            {item.status !== "published" && (
              <Button className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => onApprove(item)}>
                <CircleCheck className="size-4" />
                Approve & publish
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

function RequestChangesForm({ item, onCancel, onSubmit }: { item: ContentItem; onCancel: () => void; onSubmit: (note: string) => void }) {
  const [note, setNote] = useState(item.reviewNote ?? "");
  const [submitted, setSubmitted] = useState(false);
  const error = note.trim().length < 10 ? "Add a short note (at least 10 characters) so the mentor knows what to fix." : undefined;
  const mentor = getMentor(item.mentorId);

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Request changes</DialogTitle>
        <DialogDescription>
          “{item.title}” goes back to {mentor?.name ?? "the mentor"} with your note. It stays hidden from learners until it is re-submitted and approved.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_NOTES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNote((v) => (v.trim() ? `${v.trim()} ${n}.` : `${n}.`))}
              className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
            >
              + {n}
            </button>
          ))}
        </div>
        <Field id="review-note" label="Note to mentor" required error={submitted ? error : undefined} hint={`${note.trim().length}/400 characters`}>
          <Textarea
            id="review-note"
            value={note}
            maxLength={400}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            aria-invalid={submitted && !!error}
            placeholder="e.g. Audio drops after 4:30 — please re-export with normalised levels."
          />
        </Field>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            setSubmitted(true);
            if (!error) onSubmit(note.trim());
          }}
        >
          Send to mentor
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
