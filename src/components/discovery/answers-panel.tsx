"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Check, Lock, Pencil } from "lucide-react";
import { getCourse } from "@/data";
import { recommendCourses } from "@/lib/recommend";
import { formatINR } from "@/lib/format";
import { isAnswered, summaryLabel, summaryValue, type NodeId } from "@/lib/discovery";
import type { DiscoveryAnswers, LearningFormat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DemoBadge, FormatBadge } from "@/components/shared/badges";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { Button } from "@/components/ui/button";

/** "Your answers so far" — every answered step can be edited (jumps back to that step). */
export function AnswersList({
  flow,
  answers,
  current,
  onEdit,
  disabled,
}: {
  flow: NodeId[];
  answers: DiscoveryAnswers;
  current: NodeId;
  onEdit: (node: NodeId) => void;
  disabled?: boolean;
}) {
  const nodes = flow.filter((n) => n !== "snapshot");
  const answeredCount = nodes.filter((n) => isAnswered(n, answers)).length;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold">Your answers so far</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {answeredCount}/{nodes.length}
        </span>
      </div>
      <ul className="divide-y rounded-xl border bg-background">
        {nodes.map((node) => {
          const answered = isAnswered(node, answers);
          const isCurrent = node === current;
          return (
            <li key={node} className={cn("flex items-start gap-2.5 px-3 py-2.5", isCurrent && "bg-brand-soft/60")}>
              <span
                className={cn(
                  "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full",
                  answered ? "bg-brand text-brand-foreground" : isCurrent ? "ring-2 ring-brand ring-offset-1" : "ring-1 ring-border",
                )}
              >
                {answered && <Check className="size-3" strokeWidth={3} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{summaryLabel(node, answers)}</p>
                <p className={cn("mt-0.5 line-clamp-2 text-sm", !answered && "text-muted-foreground")}>
                  {answered ? summaryValue(node, answers) : isCurrent ? "Answering now…" : "—"}
                </p>
              </div>
              {answered && !isCurrent && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled}
                  onClick={() => onEdit(node)}
                  aria-label={`Edit ${summaryLabel(node, answers).toLowerCase()}`}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Pencil />
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Lock className="size-3" /> Demo: answers stay in this browser only.
      </p>
    </div>
  );
}

const POPULAR: { id: string; format: LearningFormat }[] = [
  { id: "career-discovery-fundamentals", format: "self-paced" },
  { id: "communication-skills", format: "self-paced" },
  { id: "interview-preparation", format: "self-paced" },
];

/** Live "Relevant for you" suggestions that update as the visitor answers. */
export function RelevantList({ answers, compact }: { answers: DiscoveryAnswers; compact?: boolean }) {
  const items = useMemo(() => {
    if (!answers.stage && answers.persona !== "parent") {
      return POPULAR.map((p) => ({ course: getCourse(p.id)!, format: p.format, reason: "A popular first step on CDL." }));
    }
    return recommendCourses({ stage: answers.stage, persona: answers.persona, interests: answers.interests, challenges: answers.challenges, goals: answers.goals }, 3);
  }, [answers]);
  const personalised = !!answers.stage || answers.persona === "parent";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-heading text-sm font-semibold">{personalised ? "Relevant for you" : "Popular starting points"}</h2>
        {personalised && <DemoBadge className="h-5 px-2 text-[10px]">Rule-based demo</DemoBadge>}
      </div>
      {!compact && (
        <p className="mb-2.5 text-xs text-muted-foreground">{personalised ? "Updates as you answer." : "Personalised suggestions appear once we know your stage."}</p>
      )}
      <ul className="space-y-2">
        {items.map(({ course, format, reason }) => (
          <li key={course.id}>
            <Link
              href={`/courses/${course.id}`}
              className="group flex gap-3 rounded-xl border bg-background p-2 transition hover:border-primary/30 hover:shadow-xs focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <CourseThumbnail course={course} size="sm" className="w-20 shrink-0 self-start" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold group-hover:text-primary">{course.title}</p>
                {!compact && <p className="line-clamp-1 text-[11px] text-muted-foreground">{reason}</p>}
                <div className="mt-1 flex items-center gap-1.5">
                  <FormatBadge format={format} short className="h-5 px-1.5 text-[10px]" />
                  <span className="text-xs font-semibold">{formatINR(course.pricing[format] ?? 0, { free: true })}</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
