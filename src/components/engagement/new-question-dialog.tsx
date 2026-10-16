"use client";

import { useState } from "react";
import { GraduationCap, Plus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { courseLessons } from "@/data";
import type { Course, DiscussionThread } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useCurrentUser } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const SUGGESTED_TAGS: Record<DiscussionThread["channel"], string[]> = {
  doubt: ["Concept", "Assignment", "Live class", "Practice", "Resources"],
  community: ["Practice", "Peer review", "Study group", "Experience", "Resources"],
};

/** Composer for a new question / discussion. Remount with `key` to reset. */
export function NewQuestionDialog({
  course,
  channel,
  open,
  onOpenChange,
  onCreated,
}: {
  course: Course;
  channel: DiscussionThread["channel"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (thread: DiscussionThread) => void;
}) {
  const { user, userId } = useCurrentUser();
  const addThread = useDemoStore((s) => s.addThread);
  const addNotification = useDemoStore((s) => s.addNotification);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [lessonId, setLessonId] = useState("general");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const lessons = courseLessons(course);
  const titleError = title.trim().length < 10 ? "Use at least 10 characters so others understand your question." : undefined;
  const bodyError = body.trim().length < 20 ? "Add a bit more context (at least 20 characters)." : undefined;
  const doubt = channel === "doubt";

  const addTag = (t: string) => {
    const clean = t.trim().replace(/^#/, "");
    if (!clean || tags.includes(clean) || tags.length >= 4) return;
    setTags((x) => [...x, clean]);
  };

  const submit = () => {
    setSubmitted(true);
    if (titleError || bodyError) return;
    const thread = addThread({
      courseId: course.id,
      channel,
      title: title.trim(),
      body: body.trim(),
      authorId: userId,
      authorName: user.name,
      tags: tags.length ? tags : [doubt ? "Concept" : "Discussion"],
      lessonId: lessonId === "general" ? undefined : lessonId,
    });
    if (doubt) {
      addNotification({
        kind: "assignment",
        title: "Doubt submitted",
        body: `Your question in ${course.title} was sent to the instructor. Typical reply time: within 24 hours.`,
        href: "/dashboard/discussions",
      });
    }
    toast.success(doubt ? "Question sent to your instructor" : "Discussion posted", {
      description: doubt ? "You'll be notified when they reply (typically within 24 hours)." : "Your classmates can now reply.",
    });
    onCreated(thread);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{doubt ? "Ask your instructor" : "Start a discussion"}</DialogTitle>
          <DialogDescription>{course.title}</DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            "flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-xs",
            doubt ? "bg-brand-soft text-brand" : "bg-info-soft text-info",
          )}
        >
          {doubt ? <GraduationCap className="mt-0.5 size-4 shrink-0" /> : <Users className="mt-0.5 size-4 shrink-0" />}
          <span>
            {doubt
              ? "Posting in Doubt clearing — your instructor answers personally, usually within 24 hours."
              : "Posting in Community — classmates share experiences and help each other. Instructors drop in occasionally."}
          </span>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="q-title">{doubt ? "Your question" : "Topic"}</Label>
            <Input
              id="q-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={doubt ? "e.g. How do I summarise a GD when time is almost up?" : "e.g. Anyone up for mock interview practice this weekend?"}
              aria-invalid={submitted && Boolean(titleError)}
              maxLength={140}
              className="h-9"
            />
            {submitted && titleError && <p className="text-xs text-destructive">{titleError}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="q-body">Details</Label>
            <Textarea
              id="q-body"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What have you tried? Where exactly are you stuck?"
              aria-invalid={submitted && Boolean(bodyError)}
              maxLength={1000}
            />
            <div className="flex justify-between text-xs">
              <span className="text-destructive">{submitted && bodyError}</span>
              <span className="text-muted-foreground tabular-nums">{body.length}/1000</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="q-lesson">Related lesson</Label>
            <Select value={lessonId} onValueChange={setLessonId}>
              <SelectTrigger id="q-lesson" className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General — not about a specific lesson</SelectItem>
                {lessons.map((l, i) => (
                  <SelectItem key={l.id} value={l.id}>
                    Lesson {i + 1} · {l.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="q-tags">Tags</Label>
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((t) => (
                <span key={t} className="inline-flex h-7 items-center gap-1 rounded-full bg-secondary pr-1 pl-2.5 text-xs font-medium text-primary">
                  #{t}
                  <button type="button" aria-label={`Remove tag ${t}`} onClick={() => setTags((x) => x.filter((y) => y !== t))} className="rounded-full p-0.5 hover:bg-primary/10">
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <Input
                id="q-tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag(tagInput);
                    setTagInput("");
                  }
                }}
                placeholder={tags.length >= 4 ? "Max 4 tags" : "Type a tag, press Enter"}
                disabled={tags.length >= 4}
                className="h-7 w-40 flex-1"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SUGGESTED_TAGS[channel]
                .filter((t) => !tags.includes(t))
                .map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addTag(t)}
                    className="inline-flex h-6 items-center gap-1 rounded-full border border-dashed px-2 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                  >
                    <Plus className="size-3" /> {t}
                  </button>
                ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>{doubt ? "Send question" : "Post discussion"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
