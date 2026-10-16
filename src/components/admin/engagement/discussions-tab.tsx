"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Eye, Flag, FlagOff, MessageCircle, MoreHorizontal, ThumbsUp, Trash2 } from "lucide-react";
import { getCourse } from "@/data";
import { useDemoStore } from "@/store/demo-store";
import type { DiscussionThread } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AutoStatus, StatusPill } from "@/components/shared/badges";
import { Portrait } from "@/components/shared/portrait";
import { FilterBar, FilterSelect, ResultsMeta, SearchField, TableCard, TableEmptyRow } from "@/components/admin/content/admin-kit";
import { ageLabel } from "./engagement-data";
import { avatarFor, ChannelPill } from "./engagement-ui";
import { RemoveThreadDialog, threadContext, ThreadSheet } from "./thread-sheet";

const CHANNEL_OPTIONS = [
  { value: "doubt", label: "Doubts" },
  { value: "community", label: "Community" },
];
const STATUS_OPTIONS = [
  { value: "unanswered", label: "Unanswered" },
  { value: "answered", label: "Answered" },
  { value: "resolved", label: "Resolved" },
];

export function DiscussionsTab() {
  const threads = useDemoStore((s) => s.threads);
  const setThreadFlag = useDemoStore((s) => s.setThreadFlag);
  const setThreadStatus = useDemoStore((s) => s.setThreadStatus);

  const [query, setQuery] = useState("");
  const [course, setCourse] = useState("all");
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState("all");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<DiscussionThread | null>(null);

  const courseOptions = useMemo(() => {
    const ids = Array.from(new Set(threads.map((t) => t.courseId)));
    return ids
      .map((id) => ({ value: id, label: getCourse(id)?.title ?? id }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [threads]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads
      .filter((t) => course === "all" || t.courseId === course)
      .filter((t) => channel === "all" || t.channel === channel)
      .filter((t) => status === "all" || t.status === status)
      .filter((t) => !flaggedOnly || t.flagged)
      .filter(
        (t) =>
          !q ||
          t.title.toLowerCase().includes(q) ||
          t.body.toLowerCase().includes(q) ||
          t.authorName.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)),
      )
      .sort((a, b) => Number(!!b.flagged) - Number(!!a.flagged) || b.createdAt.localeCompare(a.createdAt));
  }, [threads, query, course, channel, status, flaggedOnly]);

  const filtersActive = !!query || course !== "all" || channel !== "all" || status !== "all" || flaggedOnly;
  const reset = () => {
    setQuery("");
    setCourse("all");
    setChannel("all");
    setStatus("all");
    setFlaggedOnly(false);
  };

  return (
    <div className="space-y-3">
      <FilterBar
        right={
          <div className="flex h-9 items-center gap-2 rounded-lg border bg-background px-3">
            <Switch id="flagged-only" checked={flaggedOnly} onCheckedChange={setFlaggedOnly} className="data-checked:bg-destructive" />
            <Label htmlFor="flagged-only" className="cursor-pointer text-[13px] font-medium">
              Flagged only
            </Label>
          </div>
        }
      >
        <SearchField value={query} onChange={setQuery} placeholder="Search threads, authors, tags…" label="Search discussions" />
        <FilterSelect value={course} onValueChange={setCourse} options={courseOptions} allLabel="All courses" label="Filter by course" className="sm:w-52" />
        <FilterSelect value={channel} onValueChange={setChannel} options={CHANNEL_OPTIONS} allLabel="All channels" label="Filter by channel" className="sm:w-36" />
        <FilterSelect value={status} onValueChange={setStatus} options={STATUS_OPTIONS} allLabel="All statuses" label="Filter by status" className="sm:w-36" />
      </FilterBar>

      <TableCard footer={<ResultsMeta shown={filtered.length} total={threads.length} noun="threads" onReset={filtersActive ? reset : undefined} />}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-72">Thread</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Author</TableHead>
              <TableHead className="text-right">Activity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Posted</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableEmptyRow colSpan={7} action={filtersActive ? <Button variant="outline" size="sm" onClick={reset}>Clear filters</Button> : undefined} />
            ) : (
              filtered.map((t) => {
                const { course: c, lesson } = threadContext(t);
                return (
                  <TableRow key={t.id} className={cn("cursor-pointer", t.flagged && "bg-destructive/[0.035] hover:bg-destructive/[0.06]")} onClick={() => setOpenId(t.id)}>
                    <TableCell className="max-w-96 whitespace-normal">
                      <div className="flex items-start gap-2">
                        {t.flagged && (
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-destructive/10 text-destructive" title="Flagged">
                            <Flag className="size-3" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <button
                            type="button"
                            className="text-left text-sm leading-snug font-medium hover:text-primary hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenId(t.id);
                            }}
                          >
                            {t.title}
                          </button>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {c?.title ?? t.courseId}
                            {lesson && <> · {lesson.title}</>}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ChannelPill channel={t.channel} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Portrait avatar={avatarFor(t.authorId)} name={t.authorName} className="size-7" />
                        <span className="text-[13px] font-medium whitespace-nowrap">{t.authorName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                        <span className="inline-flex items-center gap-1" title="Replies">
                          <MessageCircle className="size-3.5" /> {t.replies.length}
                        </span>
                        <span className="inline-flex items-center gap-1" title="Upvotes">
                          <ThumbsUp className="size-3.5" /> {t.upvotes}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <AutoStatus status={t.status} />
                        {t.flagged && (
                          <StatusPill tone="danger" dot={false} className="h-5 px-1.5 text-[10.5px]">
                            Flagged
                          </StatusPill>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{ageLabel(t.createdAt)} ago</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${t.title}`}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onSelect={() => setOpenId(t.id)}>
                            <Eye /> View thread
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              setThreadFlag(t.id, !t.flagged);
                              toast.success(t.flagged ? "Flag cleared" : "Thread flagged for review", { description: t.title });
                            }}
                          >
                            {t.flagged ? <FlagOff /> : <Flag />}
                            {t.flagged ? "Unflag" : "Flag for review"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={t.status === "resolved"}
                            onSelect={() => {
                              setThreadStatus(t.id, "resolved");
                              toast.success("Marked as resolved", { description: t.title });
                            }}
                          >
                            <CheckCircle2 /> Mark resolved
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => setRemoveTarget(t)}>
                            <Trash2 /> Remove thread
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableCard>

      <ThreadSheet threadId={openId} onOpenChange={(o) => !o && setOpenId(null)} />
      <RemoveThreadDialog thread={removeTarget} onClose={() => setRemoveTarget(null)} />
    </div>
  );
}
