"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileText, Paperclip, Send, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { CampusAssignment } from "./campus-data";

export interface QuizOutcome {
  score: number;
  correct: number;
  total: number;
  feedback: string;
}

/** Take a quiz: answer every question, then see the score and per-question feedback. */
export function QuizDialog({ quiz, onOpenChange, onSubmitted }: { quiz: CampusAssignment | null; onOpenChange: (o: boolean) => void; onSubmitted: (id: string, outcome: QuizOutcome) => void }) {
  return (
    <Dialog open={Boolean(quiz)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {quiz && <QuizBody key={quiz.id} quiz={quiz} onClose={() => onOpenChange(false)} onSubmitted={onSubmitted} />}
      </DialogContent>
    </Dialog>
  );
}

function QuizBody({ quiz, onClose, onSubmitted }: { quiz: CampusAssignment; onClose: () => void; onSubmitted: (id: string, outcome: QuizOutcome) => void }) {
  const questions = quiz.questions ?? [];
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [outcome, setOutcome] = useState<QuizOutcome | null>(null);
  const [attempted, setAttempted] = useState(false);
  const answered = questions.filter((q) => answers[q.id] !== undefined).length;

  const submit = () => {
    setAttempted(true);
    if (answered < questions.length) return;
    const correct = questions.filter((q) => answers[q.id] === q.correctIndex).length;
    const score = Math.round((correct / questions.length) * quiz.points);
    const ratio = correct / questions.length;
    const feedback =
      ratio === 1 ? "Perfect score — you're ready for this round." : ratio >= 0.6 ? "Good work. Review the explanations below for the ones you missed." : "Worth another look — revisit the related lessons and try again.";
    const result = { score, correct, total: questions.length, feedback };
    setOutcome(result);
    onSubmitted(quiz.id, result);
    toast.success(`Quiz submitted · ${score}/${quiz.points}`, { description: quiz.title });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{quiz.title}</DialogTitle>
        <DialogDescription>
          {questions.length} questions · {quiz.points} points · about {quiz.estimatedMin} min
        </DialogDescription>
      </DialogHeader>

      {outcome ? (
        <div className="space-y-4">
          <div className={cn("rounded-xl p-4", outcome.correct / outcome.total >= 0.6 ? "bg-success-soft" : "bg-warning-soft")}>
            <p className="text-sm text-muted-foreground">Your score</p>
            <p className="font-heading text-3xl font-semibold tabular-nums">
              {outcome.score}
              <span className="text-lg text-muted-foreground">/{quiz.points}</span>
            </p>
            <p className="mt-1 text-sm">
              {outcome.correct} of {outcome.total} correct · {outcome.feedback}
            </p>
          </div>
          <ol className="space-y-3">
            {questions.map((q, i) => {
              const right = answers[q.id] === q.correctIndex;
              return (
                <li key={q.id} className="rounded-xl border p-3">
                  <p className="flex gap-2 text-sm font-medium">
                    {right ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />}
                    {i + 1}. {q.prompt}
                  </p>
                  {!right && (
                    <p className="mt-1.5 pl-6 text-xs text-muted-foreground">
                      Your answer: {q.options[answers[q.id]]} · Correct: <span className="font-medium text-foreground">{q.options[q.correctIndex]}</span>
                    </p>
                  )}
                  {q.explanation && <p className="mt-1 pl-6 text-xs text-muted-foreground">{q.explanation}</p>}
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Progress value={(answered / Math.max(1, questions.length)) * 100} className="h-1.5 [&>[data-slot=progress-indicator]]:bg-brand" />
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {answered}/{questions.length} answered
            </span>
          </div>
          {questions.map((q, i) => {
            const missing = attempted && answers[q.id] === undefined;
            return (
              <fieldset key={q.id} className={cn("rounded-xl border p-4", missing && "border-destructive/50")}>
                <legend className="sr-only">Question {i + 1}</legend>
                <p className="text-sm font-medium">
                  {i + 1}. {q.prompt}
                </p>
                <RadioGroup className="mt-3 gap-2" value={answers[q.id] !== undefined ? String(answers[q.id]) : ""} onValueChange={(v) => setAnswers((a) => ({ ...a, [q.id]: Number(v) }))}>
                  {q.options.map((opt, oi) => (
                    <Label
                      key={oi}
                      htmlFor={`${q.id}-${oi}`}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm font-normal transition hover:bg-muted/60",
                        answers[q.id] === oi && "border-primary/40 bg-secondary",
                      )}
                    >
                      <RadioGroupItem id={`${q.id}-${oi}`} value={String(oi)} />
                      {opt}
                    </Label>
                  ))}
                </RadioGroup>
                {missing && <p className="mt-2 text-xs text-destructive">Choose an answer to continue.</p>}
              </fieldset>
            );
          })}
        </div>
      )}

      <DialogFooter>
        {outcome ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={submit}>
              <Send /> Submit quiz
            </Button>
          </>
        )}
      </DialogFooter>
    </>
  );
}

/** Submit an assignment: attach a file (name only) and/or a link + note. */
export function SubmitAssignmentDialog({
  assignment,
  onOpenChange,
  onSaved,
  submitTo,
}: {
  assignment: CampusAssignment | null;
  onOpenChange: (o: boolean) => void;
  onSaved: (id: string, status: "in-progress" | "submitted") => void;
  submitTo: string;
}) {
  return (
    <Dialog open={Boolean(assignment)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {assignment && <SubmitBody key={assignment.id} assignment={assignment} submitTo={submitTo} onClose={() => onOpenChange(false)} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  );
}

function SubmitBody({ assignment, submitTo, onClose, onSaved }: { assignment: CampusAssignment; submitTo: string; onClose: () => void; onSaved: (id: string, status: "in-progress" | "submitted") => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; sizeKb: number } | null>(null);
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);
  const needsFile = assignment.provider === "college";
  const linkOk = /^https?:\/\/\S+\.\S+/.test(link.trim());
  const error = needsFile ? (!file ? "Attach your resume as a PDF." : "") : !file && !linkOk && note.trim().length < 20 ? "Attach a file, add a valid link, or write at least 20 characters." : "";

  const submit = () => {
    setTouched(true);
    if (error) return;
    onSaved(assignment.id, "submitted");
    toast.success(`Submitted to ${submitTo}`, { description: `${assignment.title} — you'll be notified when it's reviewed (simulated).` });
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{assignment.title}</DialogTitle>
        <DialogDescription>{assignment.description}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <input
          ref={fileRef}
          type="file"
          accept={needsFile ? ".pdf,application/pdf" : undefined}
          className="sr-only"
          aria-label="Attach file"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setFile({ name: f.name, sizeKb: Math.max(1, Math.round(f.size / 1024)) });
            e.target.value = "";
          }}
        />
        {file ? (
          <div className="flex items-center gap-3 rounded-xl border p-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-info-soft text-info">
              <FileText className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{file.sizeKb} KB · attached (simulated)</p>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Remove attachment" onClick={() => setFile(null)}>
              <X />
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="h-10 w-full border-dashed" onClick={() => fileRef.current?.click()}>
            <Paperclip /> {needsFile ? "Attach resume (PDF)" : "Attach a file"}
          </Button>
        )}
        {!needsFile && (
          <div className="space-y-1.5">
            <Label htmlFor="sub-link">Link (optional)</Label>
            <Input id="sub-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://drive.example.com/my-recording" />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="sub-note">Note for the reviewer {needsFile ? "(optional)" : ""}</Label>
          <Textarea id="sub-note" rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything the reviewer should know…" />
        </div>
        {touched && error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => {
            onSaved(assignment.id, "in-progress");
            toast("Draft saved", { description: "Pick up where you left off any time." });
            onClose();
          }}
        >
          Save draft
        </Button>
        <Button onClick={submit}>
          <Send /> Submit
        </Button>
      </DialogFooter>
    </>
  );
}
