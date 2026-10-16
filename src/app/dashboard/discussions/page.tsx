"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, GraduationCap, MessageCircleQuestion, MessagesSquare, Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { getMentor, resources } from "@/data";
import type { DiscussionThread } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useMyEnrollments } from "@/store/hooks";
import { ThreadDetail, ThreadListItem } from "@/components/engagement/discussion-parts";
import { NewQuestionDialog } from "@/components/engagement/new-question-dialog";
import { FormatBadge } from "@/components/shared/badges";
import { CourseIcon, CourseThumbnail } from "@/components/shared/course-thumbnail";
import { EmptyState, PageHeader } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Channel = DiscussionThread["channel"];
type StatusFilter = "all" | DiscussionThread["status"];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unanswered", label: "Unanswered" },
  { value: "answered", label: "Answered" },
  { value: "resolved", label: "Resolved" },
];

const CHANNEL_INFO: Record<Channel, { label: string; icon: typeof GraduationCap; text: string }> = {
  doubt: {
    label: "Doubt clearing",
    icon: GraduationCap,
    text: "Instructor-led: ask about lessons, assignments or live classes — your instructor answers personally, usually within 24 hours.",
  },
  community: {
    label: "Community",
    icon: Users,
    text: "Peer discussion: share experiences, find practice partners and help classmates. Instructors drop in occasionally.",
  },
};

const FILE_TONE: Record<string, string> = {
  PDF: "bg-destructive/10 text-destructive",
  DOCX: "bg-info-soft text-info",
  XLSX: "bg-success-soft text-success",
  PPTX: "bg-warning-soft text-warning",
  ZIP: "bg-muted text-muted-foreground",
};

export default function DiscussionsPage() {
  const enrollments = useMyEnrollments();
  const threads = useDemoStore((s) => s.threads);
  const upvoteThread = useDemoStore((s) => s.upvoteThread);

  const programmes = useMemo(
    () => [...enrollments].sort((a, b) => Number(b.format === "live-cohort") - Number(a.format === "live-cohort") || b.enrolledOn.localeCompare(a.enrolledOn)),
    [enrollments],
  );

  const [courseId, setCourseId] = useState<string>();
  const [channel, setChannel] = useState<Channel>("doubt");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [upvoted, setUpvoted] = useState<string[]>([]);
  const [composer, setComposer] = useState({ open: false, key: 0 });

  const active = programmes.find((e) => e.courseId === courseId) ?? programmes[0];
  const course = active?.course;

  const courseThreads = useMemo(() => (course ? threads.filter((t) => t.courseId === course.id) : []), [threads, course]);
  const channelThreads = courseThreads.filter((t) => t.channel === channel);
  const q = query.trim().toLowerCase();
  const filtered = channelThreads
    .filter((t) => status === "all" || t.status === status)
    .filter((t) => !q || [t.title, t.body, t.authorName, ...t.tags, ...t.replies.map((r) => r.body)].join(" ").toLowerCase().includes(q))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const selected = filtered.find((t) => t.id === selectedId) ?? filtered[0];
  const counts = (s: StatusFilter) => (s === "all" ? channelThreads.length : channelThreads.filter((t) => t.status === s).length);

  const instructor = course ? getMentor(course.instructorId) : undefined;
  const courseResources = course ? resources.filter((r) => r.courseId === course.id) : [];
  const resolvedPct = courseThreads.length ? Math.round((courseThreads.filter((t) => t.status !== "unanswered").length / courseThreads.length) * 100) : 0;

  const select = (id: string) => {
    setSelectedId(id);
    setMobileOpen(true);
  };
  const upvote = (id: string) => {
    if (upvoted.includes(id)) {
      toast.info("You've already upvoted this question");
      return;
    }
    upvoteThread(id);
    setUpvoted((u) => [...u, id]);
  };

  if (!course) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader title="Discussions & Doubts" description="Programme-wise doubt clearing and peer discussion." />
        <EmptyState
          icon={MessagesSquare}
          title="Enrol in a programme to join its discussions"
          description="Each programme has an instructor-led doubt-clearing channel and a peer community."
          action={
            <Button asChild>
              <Link href="/courses">Explore courses</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const info = CHANNEL_INFO[channel];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        eyebrow="Ask · discuss · learn together"
        title="Discussions & Doubts"
        description="Every programme has its own space: instructor-led doubt clearing, plus a community for peer discussion."
        actions={
          <Button className="h-9 bg-brand px-4 text-brand-foreground hover:bg-brand/90" onClick={() => setComposer((c) => ({ open: true, key: c.key + 1 }))}>
            <Plus /> {channel === "doubt" ? "Ask a question" : "Start a discussion"}
          </Button>
        }
      />

      {/* Programme selector */}
      <div role="tablist" aria-label="Programme" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {programmes.map((e) => {
          const on = e.courseId === course.id;
          const n = threads.filter((t) => t.courseId === e.courseId).length;
          return (
            <button
              key={e.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => {
                setCourseId(e.courseId);
                setSelectedId(undefined);
                setMobileOpen(false);
              }}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition",
                on ? "border-primary/40 bg-card shadow-xs ring-1 ring-primary/20" : "bg-background/60 hover:bg-card",
              )}
            >
              <span
                className="flex size-8 items-center justify-center rounded-lg text-white"
                style={{ backgroundImage: `linear-gradient(135deg, ${e.course.thumbnail.from}, ${e.course.thumbnail.to})` }}
              >
                <CourseIcon theme={e.course.thumbnail} className="size-4" />
              </span>
              <span className="leading-tight">
                <span className={cn("block text-sm font-medium whitespace-nowrap", !on && "text-muted-foreground")}>{e.course.title}</span>
                <span className="block text-[11px] text-muted-foreground">{n} thread{n === 1 ? "" : "s"}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Programme header with suggested resources */}
      <section className="grid gap-4 rounded-2xl border bg-card p-4 shadow-xs sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex gap-4">
          <CourseThumbnail course={course} size="sm" className="hidden w-28 shrink-0 sm:block" />
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-lg leading-snug font-semibold">{course.title}</h2>
              <FormatBadge format={active.format} short />
            </div>
            {instructor && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Portrait avatar={instructor.avatar} name={instructor.name} className="size-6" />
                <span>
                  Instructor <span className="font-medium text-foreground">{instructor.name}</span> · replies within 24h
                </span>
              </div>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                <span className="font-semibold text-foreground tabular-nums">{courseThreads.length}</span> threads
              </span>
              <span>
                <span className="font-semibold text-foreground tabular-nums">{courseThreads.filter((t) => t.channel === "doubt").length}</span> doubts
              </span>
              <span>
                <span className="font-semibold text-foreground tabular-nums">{resolvedPct}%</span> answered
              </span>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-muted/50 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Suggested learning resources</p>
            <Link href="/dashboard/resources" className="text-xs font-medium text-primary hover:underline">
              All resources
            </Link>
          </div>
          {courseResources.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">No downloadable resources for this programme yet.</p>
          ) : (
            <ul className="space-y-1">
              {courseResources.slice(0, 3).map((r) => (
                <li key={r.id}>
                  <Link href="/dashboard/resources" className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-background">
                    <span className={cn("flex h-6 w-10 shrink-0 items-center justify-center rounded text-[10px] font-bold", FILE_TONE[r.fileType])}>{r.fileType}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{r.title}</span>
                    <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Channel tabs + filters */}
      <div className="space-y-3">
        <Tabs
          value={channel}
          onValueChange={(v) => {
            setChannel(v as Channel);
            setSelectedId(undefined);
            setMobileOpen(false);
          }}
        >
          <TabsList className="h-10! w-full sm:w-fit">
            {(Object.keys(CHANNEL_INFO) as Channel[]).map((c) => {
              const Icon = CHANNEL_INFO[c].icon;
              return (
                <TabsTrigger key={c} value={c} className="px-3">
                  <Icon /> {CHANNEL_INFO[c].label}
                  <span className="rounded-full bg-muted-foreground/10 px-1.5 text-[11px] leading-4 font-semibold tabular-nums text-muted-foreground">
                    {courseThreads.filter((t) => t.channel === c).length}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <info.icon className="mt-0.5 size-4 shrink-0 text-brand" />
          {info.text}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="scrollbar-none flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={status === f.value}
                onClick={() => setStatus(f.value)}
                className={cn(
                  "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition",
                  status === f.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
                <span className="text-xs text-muted-foreground tabular-nums">{counts(f.value)}</span>
              </button>
            ))}
          </div>
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions, replies, tags" className="h-9 bg-background pl-8" aria-label="Search discussions" />
          </div>
        </div>
      </div>

      {/* List + detail */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={MessageCircleQuestion}
          title={
            channelThreads.length === 0
              ? channel === "doubt"
                ? "No doubts asked yet"
                : "No community discussions yet"
              : q
                ? "No threads match your search"
                : `No ${status} threads`
          }
          description={
            channelThreads.length === 0
              ? channel === "doubt"
                ? "Stuck on a lesson or assignment? Ask your instructor — it's what this space is for."
                : "Start the first conversation with your classmates."
              : "Try another filter or clear your search."
          }
          action={
            channelThreads.length === 0 ? (
              <Button onClick={() => setComposer((c) => ({ open: true, key: c.key + 1 }))}>
                <Plus /> {channel === "doubt" ? "Ask the first question" : "Start a discussion"}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setStatus("all");
                  setQuery("");
                }}
              >
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <div className="space-y-2.5">
            {filtered.map((t) => (
              <ThreadListItem key={t.id} thread={t} active={selected?.id === t.id} onSelect={() => select(t.id)} />
            ))}
          </div>
          {selected && (
            <div
              className={cn(
                "bg-card",
                mobileOpen
                  ? "fixed inset-0 z-50 overflow-y-auto px-4 pb-10 lg:static lg:z-auto lg:block lg:rounded-2xl lg:border lg:p-6 lg:shadow-xs"
                  : "hidden rounded-2xl border p-6 shadow-xs lg:block",
                "lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto",
              )}
            >
              <ThreadDetail
                key={selected.id}
                thread={selected}
                onBack={mobileOpen ? () => setMobileOpen(false) : undefined}
                upvoted={upvoted.includes(selected.id)}
                onUpvote={() => upvote(selected.id)}
              />
            </div>
          )}
        </div>
      )}

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ArrowRight className="size-3.5" /> Questions are moderated by the CDL team. Instructors see doubts in their Mentor Portal.
      </p>

      <NewQuestionDialog
        key={`${composer.key}-${course.id}-${channel}`}
        course={course}
        channel={channel}
        open={composer.open}
        onOpenChange={(open) => setComposer((c) => ({ ...c, open }))}
        onCreated={(t) => {
          setStatus("all");
          setQuery("");
          setSelectedId(t.id);
        }}
      />
    </div>
  );
}
