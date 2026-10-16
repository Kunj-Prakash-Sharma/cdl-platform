"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, ExternalLink, EyeOff, Flag, FlagOff, MessageSquareReply, RotateCcw, ShieldAlert, ThumbsUp, Trash2 } from "lucide-react";
import { findLesson, getCourse } from "@/data";
import { useDemoStore } from "@/store/demo-store";
import { formatDate } from "@/lib/format";
import type { DiscussionThread } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AutoStatus, StatusPill } from "@/components/shared/badges";
import { Portrait } from "@/components/shared/portrait";
import { ConfirmDialog, Field, InfoNote } from "@/components/admin/content/admin-kit";
import { ageLabel } from "./engagement-data";
import { avatarFor, ChannelPill, RoleTag } from "./engagement-ui";

const SUSPICIOUS = /(external link|paid|whatsapp|dm me|telegram|discount code)/i;

export function threadContext(thread: DiscussionThread) {
  const course = getCourse(thread.courseId);
  const lesson = course && thread.lessonId ? findLesson(course, thread.lessonId)?.lesson : undefined;
  return { course, lesson };
}

/** Confirm + remove a discussion thread from the shared store. */
export function RemoveThreadDialog({ thread, onClose }: { thread: DiscussionThread | null; onClose: (removed: boolean) => void }) {
  const removeThread = useDemoStore((s) => s.removeThread);
  return (
    <ConfirmDialog
      open={!!thread}
      onOpenChange={(o) => !o && onClose(false)}
      title="Remove this thread?"
      description={
        thread ? (
          <>
            &ldquo;{thread.title}&rdquo; and its {thread.replies.length} {thread.replies.length === 1 ? "reply" : "replies"} will be removed from the course
            discussions for every learner.
          </>
        ) : undefined
      }
      confirmLabel="Remove thread"
      destructive
      onConfirm={() => {
        if (!thread) return;
        removeThread(thread.id);
        toast.success("Thread removed", { description: "It no longer appears in the learner portal." });
        onClose(true);
      }}
    />
  );
}

export function ThreadSheet({ threadId, onOpenChange }: { threadId: string | null; onOpenChange: (open: boolean) => void }) {
  const threads = useDemoStore((s) => s.threads);
  const thread = useMemo(() => threads.find((t) => t.id === threadId) ?? null, [threads, threadId]);

  return (
    <Sheet open={!!thread} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 data-[side=right]:sm:max-w-xl">
        {thread && <ThreadDetail key={thread.id} thread={thread} onClose={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}

function ThreadDetail({ thread, onClose }: { thread: DiscussionThread; onClose: () => void }) {
  const addReply = useDemoStore((s) => s.addReply);
  const removeReply = useDemoStore((s) => s.removeReply);
  const setThreadFlag = useDemoStore((s) => s.setThreadFlag);
  const setThreadStatus = useDemoStore((s) => s.setThreadStatus);
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string>();
  const [hideId, setHideId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const { course, lesson } = threadContext(thread);
  const hideTarget = thread.replies.find((r) => r.id === hideId);

  const postReply = () => {
    const body = reply.trim();
    if (body.length < 5) {
      setError(body ? "Write at least a short sentence (5+ characters)." : "Reply can't be empty.");
      return;
    }
    addReply(thread.id, { authorName: "CDL Admin", authorRole: "admin", body });
    setReply("");
    setError(undefined);
    toast.success("Reply posted as CDL Admin", { description: "Learners in this course can now see it." });
  };

  return (
    <>
      <SheetHeader className="border-b px-5 pt-5 pb-4 pr-12">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <ChannelPill channel={thread.channel} />
          <AutoStatus status={thread.status} />
          {thread.flagged && (
            <StatusPill tone="danger" dot={false}>
              <Flag className="size-3" /> Flagged
            </StatusPill>
          )}
        </div>
        <SheetTitle className="text-lg leading-snug font-semibold">{thread.title}</SheetTitle>
        <SheetDescription>
          {course?.title ?? "Unknown course"}
          {lesson && <> · {lesson.title}</>}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {thread.flagged && (
          <InfoNote tone="warning" icon={ShieldAlert}>
            Reported by learners for review. Check replies for spam, external links or personal details, then hide what breaks the community guidelines and
            unflag the thread.
          </InfoNote>
        )}

        {/* Original post */}
        <article className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <Portrait avatar={avatarFor(thread.authorId)} name={thread.authorName} className="size-9" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-semibold">{thread.authorName}</span>
                <RoleTag role="learner" />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(thread.createdAt, "d MMM yyyy, h:mm a")} · {ageLabel(thread.createdAt)} ago
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground tabular-nums">
              <ThumbsUp className="size-3.5" /> {thread.upvotes}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-foreground/90">{thread.body}</p>
          {thread.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {thread.tags.map((t) => (
                <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </article>

        {/* Replies */}
        <section>
          <h3 className="mb-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {thread.replies.length} {thread.replies.length === 1 ? "reply" : "replies"}
          </h3>
          {thread.replies.length === 0 ? (
            <p className="rounded-xl border border-dashed bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
              No replies yet. Answer below or assign it to a mentor from the doubts queue.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {thread.replies.map((r) => {
                const suspicious = SUSPICIOUS.test(r.body);
                return (
                  <li
                    key={r.id}
                    className={cn(
                      "rounded-xl border p-3.5",
                      suspicious ? "border-destructive/30 bg-destructive/5" : r.authorRole === "admin" ? "bg-secondary/50" : "bg-card",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <Portrait avatar={avatarFor(r.authorId)} name={r.authorName} className="size-8" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[13px] font-semibold">{r.authorName}</span>
                          <RoleTag role={r.authorRole} />
                          {r.accepted && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-success">
                              <CheckCircle2 className="size-3.5" /> Accepted
                            </span>
                          )}
                          {suspicious && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-destructive">
                              <ShieldAlert className="size-3.5" /> Possible spam
                            </span>
                          )}
                        </div>
                        <p className="text-[11.5px] text-muted-foreground">{formatDate(r.createdAt, "d MMM, h:mm a")}</p>
                        <p className="mt-1.5 text-sm leading-relaxed">{r.body}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("shrink-0 text-muted-foreground", suspicious && "text-destructive hover:text-destructive")}
                        onClick={() => setHideId(r.id)}
                      >
                        <EyeOff /> Hide
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Admin reply */}
        <section className="rounded-xl border bg-muted/30 p-4">
          <Field id={`reply-${thread.id}`} label="Reply as CDL Admin" error={error} hint="Visible to every learner in this course discussion.">
            <Textarea
              id={`reply-${thread.id}`}
              value={reply}
              onChange={(e) => {
                setReply(e.target.value);
                if (error) setError(undefined);
              }}
              placeholder="Add a clarification, point to a resource or remind learners of the guidelines…"
              rows={3}
              maxLength={600}
              aria-invalid={!!error}
              className="min-h-20 bg-background"
            />
          </Field>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground tabular-nums">{reply.length}/600</span>
            <Button onClick={postReply} className="bg-brand text-brand-foreground hover:bg-brand/90">
              <MessageSquareReply /> Post reply
            </Button>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t bg-muted/30 px-5 py-3.5">
        {thread.status !== "resolved" ? (
          <Button
            variant="outline"
            onClick={() => {
              setThreadStatus(thread.id, "resolved");
              toast.success("Marked as resolved");
            }}
          >
            <CheckCircle2 /> Mark resolved
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              setThreadStatus(thread.id, thread.replies.length ? "answered" : "unanswered");
              toast("Thread reopened");
            }}
          >
            <RotateCcw /> Reopen
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => {
            setThreadFlag(thread.id, !thread.flagged);
            toast.success(thread.flagged ? "Flag cleared" : "Thread flagged for review");
          }}
        >
          {thread.flagged ? <FlagOff /> : <Flag />}
          {thread.flagged ? "Unflag" : "Flag"}
        </Button>
        <Button variant="ghost" asChild className="text-muted-foreground">
          <Link href="/dashboard/discussions">
            <ExternalLink /> Learner view
          </Link>
        </Button>
        <Button variant="destructive" className="sm:ml-auto" onClick={() => setRemoving(true)}>
          <Trash2 /> Remove
        </Button>
      </div>

      <ConfirmDialog
        open={!!hideTarget}
        onOpenChange={(o) => !o && setHideId(null)}
        title="Hide this reply?"
        description={hideTarget ? `The reply by ${hideTarget.authorName} will be hidden from all learners in this discussion.` : undefined}
        confirmLabel="Hide reply"
        destructive
        onConfirm={() => {
          if (!hideTarget) return;
          removeReply(thread.id, hideTarget.id);
          setHideId(null);
          toast.success("Reply hidden", { description: `${hideTarget.authorName}'s reply is no longer visible to learners.` });
        }}
      />
      <RemoveThreadDialog
        thread={removing ? thread : null}
        onClose={(removed) => {
          setRemoving(false);
          if (removed) onClose();
        }}
      />
    </>
  );
}
