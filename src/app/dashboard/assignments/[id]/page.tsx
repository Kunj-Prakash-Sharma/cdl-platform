"use client";

import { use, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, Clock, FileText, Paperclip, RotateCcw, Save, Send, Star, Timer, Trophy, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { assignments, courseLessons, getMentor } from "@/data";
import { DEMO_TODAY } from "@/data/constants";
import { formatDate, relativeDay } from "@/lib/format";
import type { QuizQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";
import { demoTimestamp, useDemoStore } from "@/store/demo-store";
import { useEnrollment } from "@/store/hooks";
import { AutoStatus } from "@/components/shared/badges";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { mergeAssignment, type MyAssignment } from "@/components/learner/hooks";
import { formatSize } from "@/components/learner/utils";
import { TealProgress } from "@/components/learner/widgets";

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const seed = assignments.find((a) => a.id === id);
  if (!seed) notFound();
  return <Detail id={id} />;
}

function Detail({ id }: { id: string }) {
  const seed = assignments.find((a) => a.id === id)!;
  const submission = useDemoStore((s) => s.submissions[id]);
  const a = useMemo(() => mergeAssignment(seed, submission), [seed, submission]);
  const enrollment = useEnrollment(a.courseId);
  const mentor = getMentor(a.course.instructorId);
  const open = a.status === "not-started" || a.status === "in-progress";
  const overdue = open && a.dueDate < DEMO_TODAY;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-3">
        <Link href="/dashboard/assignments" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Assignments & Quizzes
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wider text-brand uppercase">
              {a.kind === "quiz" ? "Quiz" : "Assignment"} · {a.course.title}
            </p>
            <h1 className="mt-1 font-heading text-2xl font-semibold md:text-[26px]">{a.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className={cn("inline-flex items-center gap-1", overdue && "font-semibold text-destructive")}>
                <CalendarDays className="size-4" /> Due {formatDate(a.dueDate, "EEE, d MMM yyyy")}
                {open && ` · ${relativeDay(a.dueDate).toLowerCase()}`}
              </span>
              <span className="inline-flex items-center gap-1">
                <Star className="size-4" /> {a.points} points
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-4" /> ~{a.estimatedMin} min
              </span>
            </div>
          </div>
          <AutoStatus status={a.status} label={a.status === "submitted" ? "Awaiting mentor review" : undefined} className="self-start" />
        </div>
      </div>

      {!enrollment && (
        <p className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          You&apos;re not enrolled in {a.course.title}. <Link href={`/courses/${a.courseId}`} className="font-semibold underline">View the programme</Link> to unlock this work.
        </p>
      )}

      {a.kind === "quiz" && a.questions?.length ? (
        <QuizRunner key={`${a.status}-${submission?.submittedAt ?? "new"}`} a={a} />
      ) : a.kind === "quiz" ? (
        <GradedSummary a={a} mentorName={mentor?.name} />
      ) : (
        <AssignmentWork key={a.status} a={a} mentorName={mentor?.name} mentorAvatar={mentor?.avatar} />
      )}
    </div>
  );
}

function GradedSummary({ a, mentorName }: { a: MyAssignment; mentorName?: string }) {
  const pct = a.score !== undefined ? Math.round((a.score / a.points) * 100) : 0;
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-xs">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex size-24 shrink-0 flex-col items-center justify-center rounded-2xl bg-success-soft text-success">
          <span className="font-heading text-3xl font-bold">{a.score ?? "—"}</span>
          <span className="text-xs font-medium">of {a.points}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Graded · {pct}%</p>
          <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
          {a.feedback && (
            <div className="mt-3 rounded-xl bg-muted/60 p-3 text-sm">
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Feedback{mentorName ? ` · ${mentorName}` : ""}</p>
              {a.feedback}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- Quiz ----------------

function QuizRunner({ a }: { a: MyAssignment }) {
  const questions = a.questions as QuizQuestion[];
  const saveSubmission = useDemoStore((s) => s.saveSubmission);
  const setLessonComplete = useDemoStore((s) => s.setLessonComplete);
  const graded = a.status === "graded" && a.submission?.answers?.length === questions.length;
  const [mode, setMode] = useState<"taking" | "review">(graded ? "review" : "taking");
  const [answers, setAnswers] = useState<number[]>(() =>
    graded || a.submission?.answers ? questions.map((_, i) => a.submission?.answers?.[i] ?? -1) : questions.map(() => -1),
  );
  const [index, setIndex] = useState(() => {
    const first = answers.findIndex((x) => x < 0);
    return first < 0 ? 0 : first;
  });

  const answered = answers.filter((x) => x >= 0).length;
  const correct = answers.filter((x, i) => x === questions[i].correctIndex).length;
  const score = Math.round((correct / questions.length) * a.points);
  const q = questions[index];

  const submit = () => {
    if (answered < questions.length) {
      toast.error("Answer every question first", { description: `${questions.length - answered} unanswered` });
      const firstOpen = answers.findIndex((x) => x < 0);
      if (firstOpen >= 0) setIndex(firstOpen);
      return;
    }
    const pct = correct / questions.length;
    const feedback =
      pct === 1 ? "Perfect score — you've mastered this checkpoint." : pct >= 0.6 ? "Good work. Review the explanations for the questions you missed." : "Revisit the lessons in this course and try again — you can retake the quiz any time.";
    saveSubmission(a.id, { status: "graded", answers, score, feedback, submittedAt: demoTimestamp() });
    const quizLesson = courseLessons(a.course).find((l) => l.kind === "quiz");
    if (quizLesson) setLessonComplete(a.courseId, quizLesson.id, true);
    setMode("review");
    toast.success(`Quiz submitted · ${score}/${a.points}`, { description: feedback });
  };

  if (mode === "review") {
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-5 rounded-2xl border bg-card p-5 shadow-xs sm:flex-row sm:items-center">
          <div className="flex size-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand text-brand-foreground">
            <Trophy className="size-5" />
            <span className="mt-1 font-heading text-xl font-bold">
              {score}/{a.points}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-lg font-semibold">
              {correct} of {questions.length} correct
            </p>
            <p className="text-sm text-muted-foreground">{a.feedback ?? a.submission?.feedback}</p>
            {a.submission?.submittedAt && <p className="mt-1 text-xs text-muted-foreground">Submitted {formatDate(a.submission.submittedAt, "d MMM yyyy, h:mm a")}</p>}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAnswers(questions.map(() => -1));
                setIndex(0);
                setMode("taking");
              }}
            >
              <RotateCcw /> Retake
            </Button>
            <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link href={`/dashboard/learn/${a.courseId}`}>Back to course</Link>
            </Button>
          </div>
        </div>
        <ol className="space-y-3">
          {questions.map((qq, i) => {
            const ok = answers[i] === qq.correctIndex;
            return (
              <li key={qq.id} className="rounded-2xl border bg-card p-5 shadow-xs">
                <div className="flex items-start gap-3">
                  {ok ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {i + 1}. {qq.prompt}
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {qq.options.map((o, oi) => (
                        <li
                          key={o}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                            oi === qq.correctIndex && "border-success/40 bg-success-soft",
                            oi === answers[i] && !ok && "border-destructive/40 bg-destructive/5",
                          )}
                        >
                          {oi === qq.correctIndex ? <Check className="size-4 text-success" /> : oi === answers[i] ? <X className="size-4 text-destructive" /> : <span className="size-4" />}
                          {o}
                          {oi === answers[i] && <span className="ml-auto text-xs text-muted-foreground">Your answer</span>}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {qq.explanation ?? (ok ? "Correct — this matches the framework from the lessons." : `The correct answer is “${qq.options[qq.correctIndex]}”. Revisit the related lesson to see why.`)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-5 shadow-xs sm:p-7">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Question {index + 1} of {questions.length}
          </span>
          <span className="text-muted-foreground">{answered} answered</span>
        </div>
        <TealProgress value={Math.round(((index + 1) / questions.length) * 100)} className="mt-2" />
        <fieldset className="mt-6">
          <legend className="font-heading text-lg leading-snug font-semibold">{q.prompt}</legend>
          <div className="mt-4 space-y-2" role="radiogroup">
            {q.options.map((o, oi) => {
              const selected = answers[index] === oi;
              return (
                <button
                  key={o}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setAnswers((prev) => prev.map((x, i) => (i === index ? oi : x)))}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition hover:border-brand/40 hover:bg-brand-soft/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    selected && "border-brand bg-brand-soft/60 font-medium",
                  )}
                >
                  <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold", selected ? "border-brand bg-brand text-white" : "text-muted-foreground")}>
                    {String.fromCharCode(65 + oi)}
                  </span>
                  {o}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <Button variant="outline" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
            <ArrowLeft /> Previous
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                saveSubmission(a.id, { status: "in-progress", answers });
                toast.success("Progress saved", { description: `${answered} of ${questions.length} answered` });
              }}
            >
              <Save /> Save & exit later
            </Button>
            {index < questions.length - 1 ? (
              <Button onClick={() => setIndex((i) => i + 1)} className="bg-brand text-brand-foreground hover:bg-brand/90">
                Next <ArrowRight />
              </Button>
            ) : (
              <Button onClick={submit} className="bg-brand text-brand-foreground hover:bg-brand/90">
                <Send /> Submit quiz
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-1.5" aria-label="Jump to question">
        {questions.map((qq, i) => (
          <button
            key={qq.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Question ${i + 1}${answers[i] >= 0 ? ", answered" : ""}`}
            className={cn("size-8 rounded-lg border text-xs font-semibold transition", i === index ? "border-brand bg-brand text-white" : answers[i] >= 0 ? "bg-brand-soft text-brand" : "bg-card text-muted-foreground")}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------- Assignment ----------------

const ATTACH_RE = /\n\n\[Attached: (.+?) · (.+?)\]$/;

function AssignmentWork({ a, mentorName, mentorAvatar }: { a: MyAssignment; mentorName?: string; mentorAvatar?: Parameters<typeof Portrait>[0]["avatar"] }) {
  const router = useRouter();
  const saveSubmission = useDemoStore((s) => s.saveSubmission);
  const stored = a.submission?.note ?? "";
  const match = stored.match(ATTACH_RE);
  const [text, setText] = useState(match ? stored.replace(ATTACH_RE, "") : stored);
  const [file, setFile] = useState<{ name: string; size: string } | null>(match ? { name: match[1], size: match[2] } : null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const editable = a.status === "not-started" || a.status === "in-progress";
  const note = () => `${text.trim()}${file ? `\n\n[Attached: ${file.name} · ${file.size}]` : ""}`;

  const save = (status: "in-progress" | "submitted") => {
    if (status === "submitted" && words < 20 && !file) {
      setError("Write at least 20 words or attach a file before submitting.");
      return;
    }
    if (status === "in-progress" && !text.trim() && !file) {
      setError("Add a response or attachment to save a draft.");
      return;
    }
    setError("");
    saveSubmission(a.id, { status, note: note(), submittedAt: status === "submitted" ? demoTimestamp() : undefined });
    if (status === "submitted") {
      toast.success("Assignment submitted", { description: `Awaiting review from ${mentorName ?? "your mentor"}.` });
      router.push("/dashboard/assignments");
    } else toast.success("Draft saved", { description: "You can come back and finish it any time." });
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-card p-5 shadow-xs">
        <h2 className="font-heading font-semibold">Brief</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.description}</p>
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
          <li className="rounded-lg bg-muted/60 px-3 py-2">
            <span className="block text-xs text-muted-foreground">Points</span>
            {a.points}
          </li>
          <li className="rounded-lg bg-muted/60 px-3 py-2">
            <span className="block text-xs text-muted-foreground">Estimated time</span>~{a.estimatedMin} minutes
          </li>
          <li className="rounded-lg bg-muted/60 px-3 py-2">
            <span className="block text-xs text-muted-foreground">Reviewed by</span>
            {mentorName}
          </li>
        </ul>
      </section>

      {a.status === "graded" && (
        <section className="rounded-2xl border border-success/25 bg-success-soft/50 p-5">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-xl bg-success text-white">
              <span className="font-heading text-xl font-bold">{a.score}</span>
              <span className="text-[10px]">of {a.points}</span>
            </div>
            <div>
              <p className="font-semibold">Graded</p>
              <p className="text-sm text-muted-foreground">Submitted {a.submission?.submittedAt ? formatDate(a.submission.submittedAt) : formatDate(a.dueDate)}</p>
            </div>
          </div>
          {a.feedback && (
            <div className="mt-4 flex gap-3 rounded-xl bg-card p-4 text-sm shadow-xs">
              <Portrait avatar={mentorAvatar} name={mentorName ?? "Mentor"} className="size-9" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Mentor feedback · {mentorName}</p>
                <p className="mt-1">{a.feedback}</p>
              </div>
            </div>
          )}
        </section>
      )}

      {a.status === "submitted" && (
        <section className="space-y-3 rounded-2xl border border-info/25 bg-info-soft/50 p-5">
          <p className="flex items-center gap-2 font-semibold text-info">
            <Timer className="size-4" /> Awaiting mentor review
          </p>
          <p className="text-sm text-muted-foreground">
            Submitted {a.submission?.submittedAt ? formatDate(a.submission.submittedAt, "d MMM, h:mm a") : ""}. {mentorName} usually reviews within two days.
          </p>
          <div className="rounded-xl bg-card p-4 text-sm whitespace-pre-wrap shadow-xs">{text || "—"}</div>
          {file && (
            <p className="flex items-center gap-2 text-sm">
              <Paperclip className="size-4" /> {file.name} · {file.size}
            </p>
          )}
          <Button variant="outline" size="sm" onClick={() => saveSubmission(a.id, { status: "in-progress", note: note() })}>
            Withdraw & edit
          </Button>
        </section>
      )}

      {editable && (
        <section className="rounded-2xl border bg-card p-5 shadow-xs">
          <Label htmlFor="response" className="font-heading text-base font-semibold">
            Your response
          </Label>
          <Textarea
            id="response"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError("");
            }}
            placeholder="Write your response, or paste a link to your recording and describe your approach…"
            className="mt-3 min-h-44"
            aria-invalid={Boolean(error)}
          />
          <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
            <span>{a.status === "in-progress" && !a.submission ? "Draft started — keep going" : a.submission ? `Draft saved` : "Not started"}</span>
            <span>{words} words</span>
          </div>

          <div className="mt-4">
            <input
              ref={inputRef}
              type="file"
              id="attachment"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile({ name: f.name, size: formatSize(Math.max(1, Math.round(f.size / 1024))) });
                  setError("");
                }
                e.target.value = "";
              }}
            />
            {file ? (
              <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
                <FileText className="size-5 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{file.size} · attached (not uploaded — simulated)</p>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="Remove attachment" onClick={() => setFile(null)}>
                  <X />
                </Button>
              </div>
            ) : (
              <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-muted/40">
                <Paperclip className="size-4" /> Attach a file (PDF, DOCX, MP4 — stays on your device)
              </button>
            )}
          </div>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => save("in-progress")}>
              <Save /> Save draft
            </Button>
            <Button className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => save("submitted")}>
              <Send /> Submit for review
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
