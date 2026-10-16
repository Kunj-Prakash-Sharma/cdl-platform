"use client";

import { useMemo, useState } from "react";
import { Award, CalendarClock, CheckCircle2, ClipboardCheck, FileText, ListTodo, MessageSquareText, Timer } from "lucide-react";
import { getCourse } from "@/data";
import { formatDate, relativeDay } from "@/lib/format";
import type { Assignment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/shared/badges";
import { EmptyState, PageHeader, StatCard } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProviderBadge, useAitCollege } from "@/components/college/brand";
import { CAMPUS_ASSIGNMENTS, daysUntil, isOpen, type CampusAssignment } from "@/components/campus/campus-data";
import { QuizDialog, SubmitAssignmentDialog } from "@/components/campus/assignment-dialogs";
import { CampusEyebrow } from "@/components/campus/ui";

type Override = Pick<Assignment, "status" | "score" | "feedback">;

const STATUS_LABEL: Record<Assignment["status"], { label: string; tone: "neutral" | "warning" | "info" | "success" }> = {
  "not-started": { label: "Not started", tone: "neutral" },
  "in-progress": { label: "Draft saved", tone: "warning" },
  submitted: { label: "Submitted", tone: "info" },
  graded: { label: "Graded", tone: "success" },
};

export default function CampusAssignmentsPage() {
  const college = useAitCollege();
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [tab, setTab] = useState("todo");
  const [quiz, setQuiz] = useState<CampusAssignment | null>(null);
  const [submitting, setSubmitting] = useState<CampusAssignment | null>(null);
  const [feedbackFor, setFeedbackFor] = useState<CampusAssignment | null>(null);

  const items = useMemo(() => CAMPUS_ASSIGNMENTS.map((a) => ({ ...a, ...overrides[a.id] })), [overrides]);
  const todo = items.filter((a) => isOpen(a.status));
  const done = items.filter((a) => !isOpen(a.status));
  const visible = tab === "todo" ? todo : tab === "done" ? done : items;
  const graded = items.filter((a) => a.status === "graded");
  const earned = graded.reduce((s, a) => s + (a.score ?? 0), 0);
  const possible = graded.reduce((s, a) => s + a.points, 0);

  const act = (a: CampusAssignment) => {
    if (a.status === "graded") setFeedbackFor(a);
    else if (a.kind === "quiz") setQuiz(a);
    else setSubmitting(a);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow={<CampusEyebrow college={college} />}
        title="Assignments & quizzes"
        description={`Work from your CDL programs and the ${college.shortName} Training & Placement cell, in one place.`}
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="To do" value={todo.length} icon={ListTodo} accent="warning" />
        <StatCard label="Due this week" value={todo.filter((a) => daysUntil(a.dueDate) <= 7).length} icon={CalendarClock} accent="info" />
        <StatCard label="Submitted" value={items.filter((a) => a.status === "submitted").length} icon={CheckCircle2} accent="brand" hint="awaiting review" />
        <StatCard label="Points earned" value={`${earned}/${possible}`} icon={Award} accent="success" hint={`${graded.length} graded`} />
      </section>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="todo" className="px-3">
            To do ({todo.length})
          </TabsTrigger>
          <TabsTrigger value="done" className="px-3">
            Submitted &amp; graded ({done.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="px-3">
            All
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="You're all caught up" description="Nothing left to submit right now. New work from your programs and T&P cell will appear here." />
      ) : (
        <ul className="space-y-3">
          {visible.map((a) => {
            const course = getCourse(a.courseId);
            const st = STATUS_LABEL[a.status];
            const days = daysUntil(a.dueDate);
            const overdue = isOpen(a.status) && days < 0;
            return (
              <li key={a.id} className="rounded-2xl border bg-card p-4 shadow-xs md:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start">
                  <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", a.kind === "quiz" ? "bg-info-soft text-info" : "bg-secondary text-primary")}>
                    {a.kind === "quiz" ? <ClipboardCheck className="size-5" /> : <FileText className="size-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {course && <ProviderBadge course={course} college={college} size="sm" />}
                      <span className="text-xs text-muted-foreground">
                        {a.provider === "college" ? `${college.shortName} T&P cell` : course?.title} · {a.kind === "quiz" ? "Quiz" : "Assignment"}
                      </span>
                    </div>
                    <h2 className="mt-1.5 font-heading font-semibold">{a.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className={cn("inline-flex items-center gap-1", isOpen(a.status) && days <= 5 && "font-medium text-warning", overdue && "text-destructive")}>
                        <CalendarClock className="size-3.5" />
                        Due {formatDate(a.dueDate, "d MMM")} · {relativeDay(a.dueDate)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Award className="size-3.5" /> {a.points} points
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Timer className="size-3.5" /> ~{a.estimatedMin} min
                      </span>
                      {a.status === "graded" && a.score !== undefined && (
                        <span className="font-semibold text-success">
                          Score {a.score}/{a.points}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 md:flex-col md:items-end">
                    <StatusPill tone={st.tone}>{st.label}</StatusPill>
                    {a.status === "submitted" ? (
                      <span className="text-xs text-muted-foreground">Under review</span>
                    ) : (
                      <Button size="sm" variant={a.status === "graded" ? "outline" : "default"} className="h-8" onClick={() => act(a)}>
                        {a.status === "graded" ? (
                          <>
                            <MessageSquareText /> Feedback
                          </>
                        ) : a.kind === "quiz" ? (
                          "Start quiz"
                        ) : a.status === "in-progress" ? (
                          "Continue"
                        ) : (
                          "Submit"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <QuizDialog
        quiz={quiz}
        onOpenChange={(o) => !o && setQuiz(null)}
        onSubmitted={(id, outcome) => setOverrides((o) => ({ ...o, [id]: { status: "graded", score: outcome.score, feedback: outcome.feedback } }))}
      />
      <SubmitAssignmentDialog
        assignment={submitting}
        submitTo={submitting?.provider === "college" ? `${college.shortName} T&P cell` : "your CDL mentor"}
        onOpenChange={(o) => !o && setSubmitting(null)}
        onSaved={(id, status) => setOverrides((o) => ({ ...o, [id]: { status } }))}
      />
      <Dialog open={Boolean(feedbackFor)} onOpenChange={(o) => !o && setFeedbackFor(null)}>
        <DialogContent className="sm:max-w-md">
          {feedbackFor && (
            <>
              <DialogHeader>
                <DialogTitle>{feedbackFor.title}</DialogTitle>
                <DialogDescription>
                  Score {feedbackFor.score}/{feedbackFor.points}
                </DialogDescription>
              </DialogHeader>
              <p className="rounded-xl bg-muted/60 p-4 text-sm">{feedbackFor.feedback ?? "No written feedback for this item."}</p>
              <DialogFooter>
                {feedbackFor.kind === "quiz" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const q = feedbackFor;
                      setFeedbackFor(null);
                      setQuiz(q);
                    }}
                  >
                    Retake quiz
                  </Button>
                )}
                <Button onClick={() => setFeedbackFor(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
