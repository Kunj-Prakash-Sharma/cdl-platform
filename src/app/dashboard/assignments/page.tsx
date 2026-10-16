"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlarmClock, CalendarDays, ClipboardCheck, FileQuestion, FileText, Star, Timer } from "lucide-react";
import { DEMO_TODAY } from "@/data/constants";
import { formatDate, relativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AutoStatus } from "@/components/shared/badges";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { EmptyState, PageHeader, StatCard } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMyAssignments, type MyAssignment } from "@/components/learner/hooks";

type TabKey = "todo" | "submitted" | "graded";
const STATUS_LABEL = { "not-started": "Not started", "in-progress": "In progress", submitted: "Awaiting review", graded: "Graded" } as const;

export default function AssignmentsPage() {
  const all = useMyAssignments();
  const [tab, setTab] = useState<TabKey>("todo");
  const groups = useMemo(() => {
    const todo = all.filter((a) => a.status === "not-started" || a.status === "in-progress").sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const submitted = all.filter((a) => a.status === "submitted");
    const graded = all.filter((a) => a.status === "graded").sort((a, b) => b.dueDate.localeCompare(a.dueDate));
    return { todo, submitted, graded };
  }, [all]);
  const list = groups[tab];
  const earned = groups.graded.reduce((s, a) => s + (a.score ?? 0), 0);
  const possible = groups.graded.reduce((s, a) => s + a.points, 0);
  const dueSoon = groups.todo.filter((a) => a.dueDate <= "2026-10-20").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader eyebrow="Learn" title="Assignments & Quizzes" description="Quizzes are scored instantly; assignments are reviewed by your mentor." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="To do" value={groups.todo.length} icon={ClipboardCheck} hint={`${dueSoon} due in the next 5 days`} accent="warning" />
        <StatCard label="Awaiting review" value={groups.submitted.length} icon={Timer} hint="mentor feedback in ~2 days" accent="info" />
        <StatCard label="Graded" value={groups.graded.length} icon={Star} hint="with feedback" accent="success" />
        <StatCard label="Average score" value={possible ? `${Math.round((earned / possible) * 100)}%` : "—"} icon={FileQuestion} hint={`${earned}/${possible} points`} accent="brand" />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList className="h-9">
          <TabsTrigger value="todo" className="px-3">To do ({groups.todo.length})</TabsTrigger>
          <TabsTrigger value="submitted" className="px-3">Submitted ({groups.submitted.length})</TabsTrigger>
          <TabsTrigger value="graded" className="px-3">Graded ({groups.graded.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {list.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={tab === "todo" ? "You're all caught up" : tab === "submitted" ? "Nothing awaiting review" : "No graded work yet"}
          description={all.length ? "New assignments appear as you progress through your programmes." : "Enrol in a programme to get assignments and quizzes."}
          action={
            <Button asChild size="sm">
              <Link href={all.length ? "/dashboard/learning" : "/courses"}>{all.length ? "Go to My Learning" : "Browse courses"}</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {list.map((a) => (
            <AssignmentRow key={a.id} a={a} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AssignmentRow({ a }: { a: MyAssignment }) {
  const open = a.status === "not-started" || a.status === "in-progress";
  const overdue = open && a.dueDate < DEMO_TODAY;
  const soon = open && !overdue && a.dueDate <= "2026-10-18";
  const cta = a.status === "graded" ? "View feedback" : a.status === "submitted" ? "View submission" : a.status === "in-progress" ? "Continue" : "Start";
  return (
    <li className={cn("flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-xs sm:flex-row sm:items-center", overdue && "border-destructive/30")}>
      <div className="hidden w-28 shrink-0 sm:block">
        <CourseThumbnail course={a.course} size="sm" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex h-5 items-center gap-1 rounded-md px-1.5 text-[11px] font-semibold", a.kind === "quiz" ? "bg-info-soft text-info" : "bg-secondary text-primary")}>
            {a.kind === "quiz" ? <FileQuestion className="size-3" /> : <FileText className="size-3" />}
            {a.kind === "quiz" ? "Quiz" : "Assignment"}
          </span>
          <span className="truncate text-xs text-muted-foreground">{a.course.title}</span>
        </div>
        <p className="mt-1 font-semibold">{a.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className={cn("inline-flex items-center gap-1", overdue && "font-semibold text-destructive", soon && "font-semibold text-warning")}>
            {overdue || soon ? <AlarmClock className="size-3.5" /> : <CalendarDays className="size-3.5" />}
            {open ? `${overdue ? "Overdue · was due" : "Due"} ${formatDate(a.dueDate, "EEE, d MMM")} (${relativeDay(a.dueDate).toLowerCase()})` : `Due ${formatDate(a.dueDate)}`}
          </span>
          <span>{a.points} points</span>
          <span>~{a.estimatedMin} min</span>
          {a.status === "graded" && a.score !== undefined && (
            <span className="font-semibold text-success">
              Score {a.score}/{a.points}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
        <AutoStatus status={a.status} label={STATUS_LABEL[a.status]} />
        <Button asChild size="sm" variant={open ? "default" : "outline"} className={cn("h-8 px-3", open && "bg-brand text-brand-foreground hover:bg-brand/90")}>
          <Link href={`/dashboard/assignments/${a.id}`}>{cta}</Link>
        </Button>
      </div>
    </li>
  );
}
