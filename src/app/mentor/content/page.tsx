"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CloudUpload,
  Eye,
  FolderSearch,
  HardDrive,
  Library,
  MoreHorizontal,
  Pencil,
  PlayCircle,
  RefreshCw,
  Search,
  Send,
  Timer,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { formatClock, formatCompact, formatDate, formatDuration, formatNumber } from "@/lib/format";
import type { ContentItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { ConfirmDialog } from "@/components/mentor/confirm-dialog";
import { ContentPreviewDialog, ContentThumb, EditContentDialog, formatSize, UploadVideoDialog } from "@/components/mentor/content-dialogs";
import { chapterTitle, CONTENT_STATUS_LABEL, courseShort, myCourses, useMentorContent } from "@/components/mentor/mentor-data";
import { AutoStatus } from "@/components/shared/badges";
import { EmptyState, PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type StatusFilter = "all" | ContentItem["status"];
const STATUS_ORDER: StatusFilter[] = ["all", "published", "in-review", "draft", "changes-requested"];
const PENDING_RANK: Record<ContentItem["status"], number> = { "changes-requested": 0, draft: 1, "in-review": 2, published: 3 };

export default function MentorContentPage() {
  const items = useMentorContent();
  const updateContentItem = useDemoStore((s) => s.updateContentItem);
  const removeContentItem = useDemoStore((s) => s.removeContentItem);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [course, setCourse] = useState("all");
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [preview, setPreview] = useState<ContentItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [edit, setEdit] = useState<ContentItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [toDelete, setToDelete] = useState<ContentItem | null>(null);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: items.length, published: 0, "in-review": 0, draft: 0, "changes-requested": 0 };
    items.forEach((i) => c[i.status]++);
    return c;
  }, [items]);

  const totals = useMemo(
    () => ({
      seconds: items.reduce((s, i) => s + i.durationSec, 0),
      mb: items.reduce((s, i) => s + i.sizeMb, 0),
      views: items.reduce((s, i) => s + i.views, 0),
    }),
    [items],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => (status === "all" || i.status === status) && (course === "all" || i.courseId === course))
      .filter((i) => !q || `${i.title} ${i.description} ${chapterTitle(i.courseId, i.chapterId)}`.toLowerCase().includes(q))
      .sort((a, b) => PENDING_RANK[a.status] - PENDING_RANK[b.status] || b.uploadedOn.localeCompare(a.uploadedOn));
  }, [items, status, course, query]);

  const openPreview = (i: ContentItem) => {
    setPreview(i);
    setPreviewOpen(true);
  };
  const openEdit = (i: ContentItem) => {
    setEdit(i);
    setEditOpen(true);
  };
  const submitDraft = (i: ContentItem) => {
    updateContentItem(i.id, { status: "in-review", reviewNote: undefined });
    toast.success("Submitted for review", { description: `“${i.title}” is now in the admin review queue.` });
  };

  const filtered = status !== "all" || course !== "all" || query.trim() !== "";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Content Library"
        description="Upload, organise and track every recorded lesson. Admins approve submissions in the admin console — status updates appear here instantly."
        actions={
          <Button className="h-10 bg-brand px-4 text-brand-foreground hover:bg-brand/90" onClick={() => setUploadOpen(true)}>
            <CloudUpload /> Upload video
          </Button>
        }
      />

      {/* Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-navy p-5 text-navy-foreground md:p-6">
        <div className="absolute -top-16 -right-10 size-56 rounded-full bg-white/5" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-xl gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
              <Library className="size-5" />
            </span>
            <div>
              <p className="font-heading text-lg font-semibold">One central library for every recording — no more moving files between drives</p>
              <p className="mt-1 text-sm text-navy-foreground/70">
                Uploads are stored once at original quality, linked to their course and chapter, and published only after review.
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 lg:shrink-0">
            {[
              { icon: PlayCircle, label: "Videos", value: formatNumber(items.length) },
              { icon: Timer, label: "Runtime", value: formatDuration(totals.seconds) },
              { icon: HardDrive, label: "Storage", value: formatSize(totals.mb) },
              { icon: Eye, label: "Views", value: formatCompact(totals.views) },
            ].map((s) => (
              <div key={s.label}>
                <dt className="flex items-center gap-1 text-xs text-navy-foreground/60">
                  <s.icon className="size-3.5" /> {s.label}
                </dt>
                <dd className="font-heading text-xl font-semibold tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter by status">
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={status === s}
              onClick={() => setStatus(s)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                status === s ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {s === "all" ? "All" : CONTENT_STATUS_LABEL[s]}
              <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", status === s ? "bg-white/20" : "bg-muted")}>{counts[s]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search titles, descriptions, chapters" aria-label="Search content" className="h-9 pl-8" />
          </div>
          <Select value={course} onValueChange={setCourse}>
            <SelectTrigger className="h-9 w-full sm:w-60" aria-label="Filter by course">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All my courses</SelectItem>
              {myCourses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={FolderSearch}
          title={status === "changes-requested" && !query && course === "all" ? "Nothing needs changes" : "No videos match"}
          description={
            status === "changes-requested" && !query && course === "all"
              ? "When a reviewer asks for changes, the video and their note appear here so you can fix and resubmit."
              : "Try another status, course or search term — or upload a new recording."
          }
          action={
            <div className="flex gap-2">
              {filtered && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatus("all");
                    setCourse("all");
                    setQuery("");
                  }}
                >
                  Clear filters
                </Button>
              )}
              <Button onClick={() => setUploadOpen(true)}>
                <CloudUpload /> Upload video
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border bg-card lg:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-4">Video</TableHead>
                  <TableHead>Course · chapter</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="max-w-80 pl-4 whitespace-normal">
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => openPreview(i)} aria-label={`Preview ${i.title}`} className="rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                          <ContentThumb courseId={i.courseId} durationSec={i.durationSec} className="w-24" />
                        </button>
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-medium">{i.title}</p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">{i.description}</p>
                          {i.status === "changes-requested" && i.reviewNote && (
                            <p className="mt-1 flex items-start gap-1 text-xs text-destructive">
                              <AlertTriangle className="mt-px size-3 shrink-0" /> {i.reviewNote}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <p className="text-sm">{courseShort(i.courseId)}</p>
                      <p className="text-xs text-muted-foreground">{chapterTitle(i.courseId, i.chapterId)}</p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatClock(i.durationSec)}</TableCell>
                    <TableCell>{i.resolution}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatSize(i.sizeMb)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(i.uploadedOn, "d MMM yyyy")}</TableCell>
                    <TableCell className="text-right tabular-nums">{i.views ? formatNumber(i.views) : "—"}</TableCell>
                    <TableCell>
                      <AutoStatus status={i.status} label={CONTENT_STATUS_LABEL[i.status]} />
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <RowActions item={i} onPreview={openPreview} onEdit={openEdit} onSubmit={submitDraft} onDelete={setToDelete} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            {rows.map((i) => (
              <li key={i.id} className="flex flex-col rounded-xl border bg-card p-3 shadow-xs">
                <div className="flex gap-3">
                  <button type="button" onClick={() => openPreview(i)} aria-label={`Preview ${i.title}`} className="shrink-0">
                    <ContentThumb courseId={i.courseId} durationSec={i.durationSec} className="w-28" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">{i.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {courseShort(i.courseId)} · {chapterTitle(i.courseId, i.chapterId)}
                    </p>
                    <div className="mt-1.5">
                      <AutoStatus status={i.status} label={CONTENT_STATUS_LABEL[i.status]} />
                    </div>
                  </div>
                  <RowActions item={i} onPreview={openPreview} onEdit={openEdit} onSubmit={submitDraft} onDelete={setToDelete} />
                </div>
                {i.status === "changes-requested" && i.reviewNote && (
                  <p className="mt-2 flex items-start gap-1 rounded-lg bg-destructive/5 p-2 text-xs text-destructive">
                    <AlertTriangle className="mt-px size-3 shrink-0" /> {i.reviewNote}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {i.resolution} · {formatSize(i.sizeMb)} · {formatDate(i.uploadedOn, "d MMM")} · {i.views ? `${formatNumber(i.views)} views` : "no views yet"}
                </p>
              </li>
            ))}
          </ul>
          <p className="px-1 text-xs text-muted-foreground">
            Showing {rows.length} of {items.length} videos · playback is at original upload quality in Phase 1
          </p>
        </>
      )}

      <UploadVideoDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <ContentPreviewDialog item={preview} open={previewOpen} onOpenChange={setPreviewOpen} />
      <EditContentDialog item={edit} open={editOpen} onOpenChange={setEditOpen} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete this draft?"
        description={`“${toDelete?.title ?? ""}” and its upload will be removed from your library. This can't be undone.`}
        confirmLabel="Delete draft"
        onConfirm={() => {
          if (toDelete) {
            removeContentItem(toDelete.id);
            toast.success("Draft deleted");
          }
          setToDelete(null);
        }}
      />
    </div>
  );
}

function RowActions({
  item,
  onPreview,
  onEdit,
  onSubmit,
  onDelete,
}: {
  item: ContentItem;
  onPreview: (i: ContentItem) => void;
  onEdit: (i: ContentItem) => void;
  onSubmit: (i: ContentItem) => void;
  onDelete: (i: ContentItem) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${item.title}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={() => onPreview(item)}>
          <Eye /> Preview
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onEdit(item)}>
          <Pencil /> Edit details
        </DropdownMenuItem>
        {item.status === "draft" && (
          <DropdownMenuItem onSelect={() => onSubmit(item)}>
            <Send /> Submit for review
          </DropdownMenuItem>
        )}
        {item.status === "changes-requested" && (
          <DropdownMenuItem onSelect={() => onEdit(item)}>
            <RefreshCw /> Fix & resubmit
          </DropdownMenuItem>
        )}
        {item.status === "draft" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(item)}>
              <Trash2 /> Delete draft
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
