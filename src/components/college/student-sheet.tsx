"use client";

import { BellRing, CalendarDays, CheckCircle2, CircleDashed, Clock, Copy, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { getCourse } from "@/data";
import { formatDate, relativeDay } from "@/lib/format";
import type { College, CollegeStudent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProviderBadge } from "./brand";
import { attentionReasons, cohortShort, daysSinceActive, overallProgress } from "./college-data";

export function sendReminder(names: string[]) {
  if (!names.length) return;
  toast.success(names.length === 1 ? `Reminder sent to ${names[0]}` : `Reminders sent to ${names.length} students`, {
    description: "A nudge to continue their assigned programs was sent by email and in-app (simulated).",
  });
}

/** Student detail for the college admin — only data the college is permitted to see. */
export function StudentSheet({ student, college, onOpenChange }: { student: CollegeStudent | null; college: College; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={Boolean(student)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {student && (
          <>
            <SheetHeader className="border-b pr-12">
              <div className="flex items-center gap-3">
                <Portrait avatar={student.avatar} name={student.name} className="size-14" rounded="xl" />
                <div className="min-w-0">
                  <SheetTitle className="font-heading text-lg">{student.name}</SheetTitle>
                  <SheetDescription>
                    {student.rollNo} · {student.department} · {student.year}
                  </SheetDescription>
                  <p className="truncate text-xs text-muted-foreground">{student.email}</p>
                </div>
              </div>
            </SheetHeader>
            <div className="space-y-6 p-4">
              <dl className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-muted/60 p-2.5">
                  <dt className="flex items-center gap-1 text-muted-foreground">
                    <CalendarDays className="size-3" /> Cohort
                  </dt>
                  <dd className="mt-1 text-sm font-medium">{student.cohortId ? cohortShort(student.cohortId) : "Self-paced"}</dd>
                </div>
                <div className={cn("rounded-lg p-2.5", daysSinceActive(student) > 7 ? "bg-warning-soft" : "bg-muted/60")}>
                  <dt className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-3" /> Last active
                  </dt>
                  <dd className={cn("mt-1 text-sm font-medium", daysSinceActive(student) > 7 && "text-warning")}>{relativeDay(student.lastActive)}</dd>
                </div>
                <div className="rounded-lg bg-muted/60 p-2.5">
                  <dt className="text-muted-foreground">Overall</dt>
                  <dd className="mt-1 text-sm font-medium tabular-nums">{overallProgress(student)}%</dd>
                </div>
              </dl>

              {attentionReasons(student).length > 0 && (
                <div className="rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-xs text-warning">
                  Needs attention: {attentionReasons(student).join(" · ")}
                </div>
              )}

              <div className="space-y-3">
                <h3 className="font-heading text-sm font-semibold">Program progress</h3>
                <ul className="space-y-3">
                  {student.assignedCourseIds.map((id) => {
                    const course = getCourse(id);
                    if (!course) return null;
                    const p = student.progress[id] ?? 0;
                    return (
                      <li key={id} className="rounded-xl border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{course.title}</p>
                          <span className="text-sm font-semibold tabular-nums">{p}%</span>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <ProviderBadge course={course} college={college} size="sm" />
                          <span className="text-[11px] text-muted-foreground">{p >= 100 ? "Completed" : p === 0 ? "Not started" : "In progress"}</span>
                        </div>
                        <Progress value={p} className="mt-2 h-1.5 [&>[data-slot=progress-indicator]]:bg-brand" />
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-heading text-sm font-semibold">Career assessment</h3>
                <div className="flex items-center gap-2 text-sm">
                  {student.assessmentCompleted ? (
                    <>
                      <CheckCircle2 className="size-4 text-success" /> Completed
                    </>
                  ) : (
                    <>
                      <CircleDashed className="size-4 text-muted-foreground" /> Not completed yet
                    </>
                  )}
                </div>
                <div className="flex gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                  <ShieldCheck className="size-4 shrink-0 text-primary" />
                  <p>
                    Assessment answers and reports are private to the student. {college.shortName} can see completion status and program progress only — never individual responses or
                    scores.
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">Last activity recorded {formatDate(student.lastActive)} · demo data</p>
            </div>
            <SheetFooter className="mt-auto flex-row border-t">
              <Button className="h-10 flex-1" onClick={() => sendReminder([student.name])}>
                <BellRing /> Send reminder
              </Button>
              <Button
                variant="outline"
                className="h-10"
                onClick={() => {
                  void navigator.clipboard?.writeText(student.email).catch(() => undefined);
                  toast.success("Email copied", { description: student.email });
                }}
              >
                <Copy /> Copy email
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
