"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronUp,
  CircleCheck,
  ExternalLink,
  Inbox,
  MessageCircleQuestion,
  Paperclip,
  RotateCcw,
  Send,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { findLesson, getCourse, getMentor, getUser } from "@/data";
import { formatDate, relativeDay } from "@/lib/format";
import type { DiscussionThread } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { courseShort, MENTOR_ID, MENTOR_NAME, myCourses, myResources, useMentorThreads } from "@/components/mentor/mentor-data";
import { AutoStatus, StatusPill } from "@/components/shared/badges";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { EmptyState, PageHeader } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type StatusFilter = "all" | DiscussionThread["status"];
const RANK = { unanswered: 0, answered: 1, resolved: 2 } as const;

const TEMPLATES = [
  { label: "Great question", text: "Great question! Here's how I'd approach it: " },
  { label: "We'll practise live", text: "We'll practise exactly this in our next live class — come ready with one example. Meanwhile, " },
  { label: "Revisit the lesson", text: "Have another look at the framework section of the lesson, then try this: " },
  { label: "Ask for an example", text: "Could you share a short example of what you tried? That will help me give you specific feedback." },
];

export default function MentorQuestionsPage() {
  const threads = useMentorThreads();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [course, setCourse] = useState("all");
  const [channel, setChannel] = useState<"all" | DiscussionThread["channel"]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      all: threads.length,
      unanswered: threads.filter((t) => t.status === "unanswered").length,
      answered: threads.filter((t) => t.status === "answered").length,
      resolved: threads.filter((t) => t.status === "resolved").length,
    }),
    [threads],
  );

  const list = useMemo(
    () =>
      threads
        .filter((t) => (status === "all" || t.status === status) && (course === "all" || t.courseId === course) && (channel === "all" || t.channel === channel))
        .sort((a, b) => RANK[a.status] - RANK[b.status] || b.createdAt.localeCompare(a.createdAt)),
    [threads, status, course, channel],
  );

  // Desktop shows the first thread by default; mobile shows the list until one is picked.
  const activeId = selectedId && list.some((t) => t.id === selectedId) ? selectedId : (list[0]?.id ?? null);
  const active = threads.find((t) => t.id === activeId);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Student Questions"
        description="Doubts and discussions from learners on your courses. Unanswered questions are shown first."
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter by status">
          {(["all", "unanswered", "answered", "resolved"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={status === s}
              onClick={() => setStatus(s)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium capitalize transition focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                status === s ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {s}
              <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", status === s ? "bg-white/20" : "bg-muted")}>{counts[s]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-2 sm:flex-row lg:justify-end">
          <Select value={course} onValueChange={setCourse}>
            <SelectTrigger className="h-9 w-full sm:w-56" aria-label="Filter by course">
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
          <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
            <SelectTrigger className="h-9 w-full sm:w-48" aria-label="Filter by channel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All channels</SelectItem>
              <SelectItem value="doubt">Doubt clearing</SelectItem>
              <SelectItem value="community">Community</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={status === "unanswered" ? "You're all caught up" : "No questions match"}
          description={status === "unanswered" ? "No unanswered questions on your courses right now." : "Try a different status, course or channel."}
          action={
            <Button
              variant="outline"
              onClick={() => {
                setStatus("all");
                setCourse("all");
                setChannel("all");
              }}
            >
              Show all questions
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <ul className={cn("space-y-2 lg:block", selectedId ? "hidden" : "block")}>
            {list.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  aria-current={t.id === activeId ? "true" : undefined}
                  className={cn(
                    "w-full rounded-xl border bg-card p-3.5 text-left shadow-xs transition hover:border-primary/30",
                    t.id === activeId && "lg:border-primary/40 lg:bg-secondary/50 lg:ring-1 lg:ring-primary/20",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <AutoStatus status={t.status} />
                    <span className="text-[11px] text-muted-foreground capitalize">{t.channel === "doubt" ? "Doubt" : "Community"}</span>
                    <span className="ml-auto text-[11px] text-muted-foreground">{relativeDay(t.createdAt)}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold">{t.title}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{t.body}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Portrait avatar={getUser(t.authorId)?.avatar} name={t.authorName} className="size-5" />
                    <span className="truncate">{t.authorName}</span>·<span className="truncate">{courseShort(t.courseId)}</span>
                    <span className="ml-auto inline-flex shrink-0 items-center gap-0.5">
                      <ChevronUp className="size-3.5" /> {t.upvotes}
                    </span>
                    <span className="shrink-0">· {t.replies.length} repl{t.replies.length === 1 ? "y" : "ies"}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <div className={cn("lg:block", selectedId ? "block" : "hidden")}>
            {active && <ThreadDetail key={active.id} thread={active} onBack={() => setSelectedId(null)} />}
          </div>
        </div>
      )}
    </div>
  );
}

function ThreadDetail({ thread, onBack }: { thread: DiscussionThread; onBack: () => void }) {
  const addReply = useDemoStore((s) => s.addReply);
  const setThreadStatus = useDemoStore((s) => s.setThreadStatus);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string>();
  const [attached, setAttached] = useState<string[]>([]);

  const course = getCourse(thread.courseId);
  const lesson = course && thread.lessonId ? findLesson(course, thread.lessonId) : undefined;
  const author = getUser(thread.authorId);
  const mentor = getMentor(MENTOR_ID)!;
  const resources = myResources.filter((r) => r.courseId === thread.courseId);
  const suggested = [...resources].sort((a, b) => Number(b.chapterId === lesson?.chapter.id) - Number(a.chapterId === lesson?.chapter.id));

  const post = (resolve: boolean) => {
    if (body.trim().length < 10) {
      setError("Write a reply of at least 10 characters.");
      return;
    }
    addReply(thread.id, { authorName: MENTOR_NAME, authorRole: "mentor", authorId: MENTOR_ID, body: body.trim() });
    if (resolve) setThreadStatus(thread.id, "resolved");
    toast.success(resolve ? "Reply posted & marked resolved" : "Reply posted", { description: `${thread.authorName} will be notified (simulated).` });
    setBody("");
    setAttached([]);
    setError(undefined);
  };

  return (
    <article className="rounded-2xl border bg-card shadow-xs">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3 md:px-5">
        <Button variant="ghost" size="sm" className="-ml-2 lg:hidden" onClick={onBack}>
          <ArrowLeft /> All questions
        </Button>
        <AutoStatus status={thread.status} />
        <StatusPill tone={thread.channel === "doubt" ? "info" : "neutral"} dot={false}>
          {thread.channel === "doubt" ? "Doubt clearing" : "Community"}
        </StatusPill>
        <div className="ml-auto flex gap-2">
          {thread.status === "resolved" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setThreadStatus(thread.id, thread.replies.length ? "answered" : "unanswered");
                toast.success("Thread reopened");
              }}
            >
              <RotateCcw /> Reopen
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setThreadStatus(thread.id, "resolved");
                toast.success("Marked as resolved", { description: "The thread is closed for new doubts but stays visible to learners." });
              }}
            >
              <CircleCheck /> Mark resolved
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-5 p-4 md:p-5">
        {/* Course + lesson context */}
        {course && (
          <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-3 sm:flex-row sm:items-center">
            <CourseThumbnail course={course} size="sm" className="w-20 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{course.title}</p>
              <p className="text-xs text-muted-foreground">
                {lesson ? `${lesson.chapter.title} · Lesson: ${lesson.lesson.title}` : "General course question"}
              </p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/courses/${course.id}`}>
                  <ExternalLink /> Course page
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/mentor/courses/${course.id}`}>
                  <Settings2 /> Manage
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Question */}
        <div>
          <div className="flex items-center gap-3">
            <Portrait avatar={author?.avatar} name={thread.authorName} className="size-10" />
            <div>
              <p className="text-sm font-semibold">{thread.authorName}</p>
              <p className="text-xs text-muted-foreground">
                Asked {formatDate(thread.createdAt, "d MMM, h:mm a")} · {thread.upvotes} upvotes
              </p>
            </div>
          </div>
          <h2 className="mt-3 font-heading text-lg font-semibold">{thread.title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{thread.body}</p>
          {thread.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {thread.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Replies */}
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {thread.replies.length ? `${thread.replies.length} repl${thread.replies.length === 1 ? "y" : "ies"}` : "No replies yet"}
          </p>
          {thread.replies.map((r) => {
            const isMentor = r.authorRole === "mentor";
            const avatar = r.authorId === MENTOR_ID ? mentor.avatar : r.authorId ? (getUser(r.authorId)?.avatar ?? getMentor(r.authorId)?.avatar) : undefined;
            return (
              <div key={r.id} className={cn("flex gap-3 rounded-xl border p-3", isMentor ? "border-brand/25 bg-brand-soft/40" : "bg-background")}>
                <Portrait avatar={avatar} name={r.authorName} className="size-8" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{r.authorName}</p>
                    {isMentor && (
                      <StatusPill tone="brand" dot={false} className="h-5 px-1.5 text-[10px]">
                        Mentor
                      </StatusPill>
                    )}
                    {r.accepted && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success">
                        <BadgeCheck className="size-3.5" /> Accepted answer
                      </span>
                    )}
                    <span className="ml-auto text-[11px] text-muted-foreground">{formatDate(r.createdAt, "d MMM, h:mm a")}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-foreground/90">{r.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Composer */}
        <div className="space-y-3 rounded-xl border p-3 md:p-4">
          <div className="flex items-center gap-2">
            <Portrait avatar={mentor.avatar} name={mentor.name} className="size-7" />
            <Label htmlFor="reply" className="text-sm font-semibold">
              Reply as {MENTOR_NAME}
            </Label>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => {
                  setBody((b) => (b.trim() ? `${b.trimEnd()}\n\n${t.text}` : t.text));
                  setError(undefined);
                }}
                className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
              >
                + {t.label}
              </button>
            ))}
          </div>
          <Textarea
            id="reply"
            rows={5}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (error) setError(undefined);
            }}
            placeholder={`Help ${thread.authorName.split(" ")[0]} with a clear, practical answer…`}
            aria-invalid={Boolean(error)}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          {suggested.length > 0 && (
            <div className="space-y-1.5">
              <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Paperclip className="size-3.5" /> Suggested resources
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggested.map((r) => {
                  const done = attached.includes(r.id);
                  return (
                    <Button
                      key={r.id}
                      variant="outline"
                      size="sm"
                      disabled={done}
                      onClick={() => {
                        setBody((b) => `${b.trimEnd()}${b.trim() ? "\n\n" : ""}Resource: ${r.title} (${r.fileType}) — find it under Resources in ${courseShort(r.courseId)}.`);
                        setAttached((a) => [...a, r.id]);
                        setError(undefined);
                      }}
                    >
                      {done ? <CircleCheck /> : <Paperclip />} {r.title}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex flex-col-reverse gap-2 border-t pt-3 sm:flex-row sm:justify-end">
            {thread.status !== "resolved" && (
              <Button variant="outline" onClick={() => post(true)}>
                <CircleCheck /> Post & mark resolved
              </Button>
            )}
            <Button className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => post(false)}>
              <Send /> Post reply
            </Button>
          </div>
        </div>

        {!thread.replies.length && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageCircleQuestion className="size-3.5" /> Asked {relativeDay(thread.createdAt).toLowerCase()} — learners see an answer badge as soon as you reply.
          </p>
        )}
      </div>
    </article>
  );
}
