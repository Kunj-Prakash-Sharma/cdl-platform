"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDashed, ClipboardCheck, Lock, ShieldCheck, Target } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DemoBadge } from "@/components/shared/badges";
import { PageHeader, SectionHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ProviderBadge, useAitCollege } from "@/components/college/brand";
import { overallProgress, sessionNumber, sessionTopic, studentAttended } from "@/components/college/college-data";
import { ATTENDED, MY_PAST, STUDENT, STUDENT_COURSES } from "@/components/campus/campus-data";
import { CampusEyebrow, ProgressRing } from "@/components/campus/ui";

interface ChecklistItem {
  id: string;
  label: string;
  detail: string;
  auto?: boolean;
  done: boolean;
  href?: string;
}

export default function CampusProgressPage() {
  const college = useAitCollege();
  const overall = overallProgress(STUDENT);
  const completedPrograms = STUDENT_COURSES.filter((c) => (STUDENT.progress[c.id] ?? 0) >= 100).length;
  const attendanceRate = MY_PAST.length ? Math.round((ATTENDED.length / MY_PAST.length) * 100) : 0;
  const [manual, setManual] = useState<Record<string, boolean>>({ linkedin: true });

  const p = (id: string) => STUDENT.progress[id] ?? 0;
  const checklist: ChecklistItem[] = [
    { id: "assessment", label: "Complete the career assessment", detail: STUDENT.assessmentCompleted ? "Completed" : "Not started", auto: true, done: STUDENT.assessmentCompleted },
    { id: "gd", label: "Reach 75% in Group Discussion Mastery", detail: `${p("group-discussion-mastery")}% complete`, auto: true, done: p("group-discussion-mastery") >= 75, href: "/campus/learn/group-discussion-mastery" },
    { id: "attendance", label: "Attend at least 80% of live classes", detail: `${attendanceRate}% attended`, auto: true, done: attendanceRate >= 80, href: "/campus/sessions" },
    { id: "bootcamp", label: `Finish the ${college.shortName} Industry Readiness Bootcamp`, detail: `${p("ait-industry-readiness")}% complete`, auto: true, done: p("ait-industry-readiness") >= 100, href: "/campus/learn/ait-industry-readiness" },
    { id: "interview", label: "Complete Interview Preparation", detail: `${p("interview-preparation")}% complete`, auto: true, done: p("interview-preparation") >= 100, href: "/campus/learn/interview-preparation" },
    { id: "resume", label: "Get your resume approved by the T&P cell", detail: "Due 20 Oct", done: Boolean(manual.resume), href: "/campus/assignments" },
    { id: "star", label: "Prepare three STAR stories", detail: "Self-reported", done: Boolean(manual.star) },
    { id: "linkedin", label: "Update your professional profile", detail: "Self-reported", done: Boolean(manual.linkedin) },
  ];
  const readyCount = checklist.filter((c) => c.done).length;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        eyebrow={<CampusEyebrow college={college} />}
        title="My progress"
        description={`Your learning across ${college.shortName}'s assigned programs. Your T&P cell sees program progress and attendance — never your assessment answers.`}
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.1fr)_1fr_1fr]">
        <div className="flex items-center gap-5 rounded-2xl border bg-card p-5 shadow-xs">
          <ProgressRing value={overall} size={112} stroke={10}>
            <span className="font-heading text-2xl font-semibold tabular-nums">{overall}%</span>
            <span className="text-[11px] text-muted-foreground">overall</span>
          </ProgressRing>
          <div className="space-y-1 text-sm">
            <p className="font-heading font-semibold">Overall completion</p>
            <p className="text-muted-foreground">
              {completedPrograms} of {STUDENT_COURSES.length} programs completed
            </p>
            <p className="text-muted-foreground">Placement checklist: {readyCount}/{checklist.length}</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <p className="font-heading font-semibold">Career assessment</p>
            <ClipboardCheck className="size-4 text-muted-foreground" />
          </div>
          <p className={cn("mt-3 flex items-center gap-2 text-sm font-medium", STUDENT.assessmentCompleted ? "text-success" : "text-muted-foreground")}>
            {STUDENT.assessmentCompleted ? <CheckCircle2 className="size-4" /> : <CircleDashed className="size-4" />}
            {STUDENT.assessmentCompleted ? "Completed" : "Not completed yet"}
          </p>
          <p className="mt-3 flex gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-primary" />
            Your answers and report are private to you. {college.shortName} only sees that you&apos;ve completed it.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <p className="font-heading font-semibold">Live classes attended</p>
            <DemoBadge>Synthetic</DemoBadge>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tabular-nums">
            {ATTENDED.length}
            <span className="text-base font-medium text-muted-foreground">/{MY_PAST.length}</span>
          </p>
          <div className="mt-3 flex gap-1.5" aria-label="Attendance by class">
            {MY_PAST.map((s) => {
              const ok = studentAttended(STUDENT, s);
              return (
                <span
                  key={s.id}
                  title={`Class ${sessionNumber(s.title)} · ${sessionTopic(s.title)} · ${formatDate(s.date, "d MMM")} · ${ok ? "Attended" : "Missed"}`}
                  className={cn("flex h-7 flex-1 items-center justify-center rounded-md text-[11px] font-medium", ok ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}
                >
                  {sessionNumber(s.title)}
                </span>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{attendanceRate}% attendance · Class numbers shown</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <SectionHeader title="Progress by program" description="Updated as you complete lessons." />
          <ul className="mt-4 space-y-4">
            {STUDENT_COURSES.map((c) => {
              const v = p(c.id);
              return (
                <li key={c.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{c.title}</p>
                      <ProviderBadge course={c} college={college} size="sm" className="mt-1" />
                    </div>
                    <Link href={`/campus/learn/${c.id}`} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline">
                      {v >= 100 ? "Review" : "Continue"} <ArrowRight className="size-3" />
                    </Link>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <Progress value={v} className="h-2 [&>[data-slot=progress-indicator]]:bg-brand" />
                    <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums">{v}%</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <SectionHeader
            title={
              <span className="flex items-center gap-2">
                <Target className="size-4" style={{ color: college.brandColor }} /> Placement readiness checklist
              </span>
            }
            description={`${readyCount} of ${checklist.length} done before the November drives.`}
          />
          <Progress value={(readyCount / checklist.length) * 100} className="mt-3 h-1.5" />
          <ul className="mt-4 divide-y">
            {checklist.map((item) => (
              <li key={item.id} className="flex items-start gap-3 py-2.5">
                {item.auto ? (
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center" title="Tracked automatically">
                    {item.done ? <CheckCircle2 className="size-4 text-success" /> : <CircleDashed className="size-4 text-muted-foreground" />}
                  </span>
                ) : (
                  <Checkbox
                    id={`chk-${item.id}`}
                    checked={item.done}
                    className="mt-0.5"
                    onCheckedChange={(v) => {
                      setManual((m) => ({ ...m, [item.id]: v === true }));
                      if (v === true) toast.success("Checklist updated", { description: item.label });
                    }}
                  />
                )}
                <label htmlFor={item.auto ? undefined : `chk-${item.id}`} className={cn("min-w-0 flex-1 text-sm", !item.auto && "cursor-pointer")}>
                  <span className={cn("block", item.done && "text-muted-foreground line-through decoration-muted-foreground/40")}>{item.label}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {item.auto && <Lock className="size-3" />}
                    {item.auto ? `Tracked automatically · ${item.detail}` : item.detail}
                  </span>
                </label>
                {item.href && !item.done && (
                  <Button asChild variant="ghost" size="sm" className="shrink-0">
                    <Link href={item.href}>Go</Link>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
