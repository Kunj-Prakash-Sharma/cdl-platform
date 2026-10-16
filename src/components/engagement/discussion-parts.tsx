"use client";

import { useState } from "react";
import { ArrowBigUp, ArrowLeft, BadgeCheck, CheckCircle2, Flag, GraduationCap, MessageSquare, SendHorizontal, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { courseLessons, getCourse, getMentor, getUser } from "@/data";
import type { DiscussionThread, ThreadReply } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useCurrentUser } from "@/store/hooks";
import { AutoStatus } from "@/components/shared/badges";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { timeAgo } from "./engagement-utils";

/** "Lesson 3 · Opening strong in the first 60 seconds" */
export function lessonLabel(courseId: string, lessonId?: string) {
  if (!lessonId) return undefined;
  const course = getCourse(courseId);
  if (!course) return undefined;
  const lessons = courseLessons(course);
  const idx = lessons.findIndex((l) => l.id === lessonId);
  return idx >= 0 ? `Lesson ${idx + 1} · ${lessons[idx].title}` : undefined;
}

export function threadStatusLabel(status: DiscussionThread["status"]) {
  return status === "unanswered" ? "Unanswered" : status === "answered" ? "Answered" : "Resolved";
}

function authorAvatar(authorId?: string) {
  return authorId ? (getMentor(authorId)?.avatar ?? getUser(authorId)?.avatar) : undefined;
}

export function ThreadListItem({ thread, active, onSelect }: { thread: DiscussionThread; active: boolean; onSelect: () => void }) {
  const lesson = lessonLabel(thread.courseId, thread.lessonId);
  const instructorReplied = thread.replies.some((r) => r.authorRole !== "learner");
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={cn(
        "relative w-full rounded-xl border bg-card p-4 text-left transition hover:border-primary/30 hover:shadow-xs focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        active && "border-primary/40 bg-accent/50 ring-1 ring-primary/20",
      )}
    >
      <div className="flex items-start gap-3">
        <Portrait name={thread.authorName} avatar={authorAvatar(thread.authorId)} className="size-8 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate font-medium text-foreground">{thread.authorName}</span>
            <span>·</span>
            <span className="whitespace-nowrap">{timeAgo(thread.createdAt)}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-snug font-semibold">{thread.title}</p>
          {lesson && <p className="mt-1 truncate text-xs text-muted-foreground">{lesson}</p>}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            <AutoStatus status={thread.status} label={threadStatusLabel(thread.status)} />
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3.5" /> {thread.replies.length}
            </span>
            <span className="inline-flex items-center gap-1">
              <ArrowBigUp className="size-4" /> {thread.upvotes}
            </span>
            {instructorReplied && thread.channel === "doubt" && (
              <span className="inline-flex items-center gap-1 text-brand">
                <GraduationCap className="size-3.5" /> Instructor replied
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function ReplyItem({ reply }: { reply: ThreadReply }) {
  const staff = reply.authorRole !== "learner";
  return (
    <li
      className={cn(
        "rounded-xl border p-4",
        staff ? "border-brand/30 bg-brand-soft/50" : "bg-card",
        reply.accepted && "border-success/40 bg-success-soft/50 ring-1 ring-success/20",
      )}
    >
      {reply.accepted && (
        <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-success">
          <CheckCircle2 className="size-4" /> Accepted answer
        </p>
      )}
      <div className="flex items-center gap-2.5">
        <Portrait name={reply.authorName} avatar={authorAvatar(reply.authorId)} className="size-8" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold">{reply.authorName}</span>
            {reply.authorRole === "mentor" && (
              <span className="inline-flex h-5 items-center gap-1 rounded-full bg-brand px-2 text-[11px] font-semibold text-brand-foreground">
                <BadgeCheck className="size-3" /> Instructor
              </span>
            )}
            {reply.authorRole === "admin" && (
              <span className="inline-flex h-5 items-center gap-1 rounded-full bg-primary px-2 text-[11px] font-semibold text-primary-foreground">
                <ShieldCheck className="size-3" /> CDL Team
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{timeAgo(reply.createdAt)}</p>
        </div>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed whitespace-pre-line text-foreground/90">{reply.body}</p>
    </li>
  );
}

/** Full thread view: question, replies (instructor replies highlighted), upvote, resolve and reply composer. */
export function ThreadDetail({ thread, onBack, upvoted, onUpvote }: { thread: DiscussionThread; onBack?: () => void; upvoted: boolean; onUpvote: () => void }) {
  const { user, userId } = useCurrentUser();
  const addReply = useDemoStore((s) => s.addReply);
  const setThreadStatus = useDemoStore((s) => s.setThreadStatus);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string>();
  const lesson = lessonLabel(thread.courseId, thread.lessonId);
  const isAuthor = thread.authorId === userId;
  const replyId = `reply-${thread.id}`;

  const post = () => {
    if (draft.trim().length < 3) {
      setError("Write a little more before posting.");
      return;
    }
    addReply(thread.id, { authorName: user.name, authorRole: "learner", authorId: userId, body: draft.trim() });
    setDraft("");
    setError(undefined);
    toast.success("Reply posted", {
      description: thread.channel === "doubt" ? "Your instructor and classmates can see it now." : "Thanks for helping your peers!",
    });
  };

  return (
    <div className="flex flex-col">
      {onBack && (
        <div className="sticky top-0 z-10 -mx-4 mb-3 flex items-center gap-2 border-b bg-background/95 px-4 py-2.5 backdrop-blur lg:hidden">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft /> All questions
          </Button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <AutoStatus status={thread.status} label={threadStatusLabel(thread.status)} />
        <span className="inline-flex h-6 items-center rounded-full bg-muted px-2.5 text-xs font-medium text-muted-foreground">
          {thread.channel === "doubt" ? "Doubt clearing" : "Community"}
        </span>
        {thread.tags.map((t) => (
          <span key={t} className="inline-flex h-6 items-center rounded-full border px-2.5 text-xs text-muted-foreground">
            #{t}
          </span>
        ))}
      </div>
      <h2 className="mt-3 font-heading text-xl leading-snug font-semibold">{thread.title}</h2>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Portrait name={thread.authorName} avatar={authorAvatar(thread.authorId)} className="size-6" />
        <span className="font-medium text-foreground">{isAuthor ? `${thread.authorName} (you)` : thread.authorName}</span>
        <span>·</span>
        <span>{timeAgo(thread.createdAt)}</span>
        {lesson && (
          <>
            <span>·</span>
            <span>{lesson}</span>
          </>
        )}
      </div>
      <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-line">{thread.body}</p>

      {thread.flagged && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
          <Flag className="size-3.5" /> Part of this thread is under review by moderators.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-y py-3">
        <Button variant={upvoted ? "secondary" : "outline"} size="sm" onClick={onUpvote} aria-pressed={upvoted}>
          <ArrowBigUp className={cn(upvoted && "fill-current text-primary")} /> {upvoted ? "Upvoted" : "Upvote"} · {thread.upvotes}
        </Button>
        {isAuthor && thread.status !== "resolved" && (
          <Button
            variant="outline"
            size="sm"
            className="text-success"
            onClick={() => {
              setThreadStatus(thread.id, "resolved");
              toast.success("Marked as resolved", { description: "Thanks for closing the loop — this helps classmates find answers." });
            }}
          >
            <CheckCircle2 /> Mark as resolved
          </Button>
        )}
        {isAuthor && thread.status === "resolved" && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
            <CheckCircle2 className="size-4" /> You marked this resolved
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {thread.replies.length} repl{thread.replies.length === 1 ? "y" : "ies"}
        </span>
      </div>

      <ul className="mt-4 space-y-3">
        {thread.replies.length === 0 ? (
          <li className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            {thread.channel === "doubt" ? "No replies yet — your instructor typically answers within 24 hours." : "No replies yet. Be the first to help!"}
          </li>
        ) : (
          thread.replies.map((r) => <ReplyItem key={r.id} reply={r} />)
        )}
      </ul>

      <div className="mt-5 rounded-xl border bg-card p-3">
        <Label htmlFor={replyId} className="sr-only">
          Write a reply
        </Label>
        <div className="flex items-start gap-3">
          <Portrait name={user.name} avatar={user.avatar} className="mt-1 size-8 shrink-0" />
          <Textarea
            id={replyId}
            rows={3}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError(undefined);
            }}
            placeholder={thread.channel === "doubt" ? "Add a follow-up or share what worked for you…" : "Share your experience or advice…"}
            aria-invalid={Boolean(error)}
            className="min-h-20 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2">
          <p className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>{error ?? "Be kind and specific. Replies are visible to your programme."}</p>
          <Button size="sm" onClick={post} disabled={!draft.trim()}>
            <SendHorizontal /> Post reply
          </Button>
        </div>
      </div>
    </div>
  );
}
