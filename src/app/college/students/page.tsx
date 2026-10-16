"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BellRing, CheckCircle2, CircleDashed, MailCheck, RotateCcw, Search, ShieldCheck, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { getCourse } from "@/data";
import { relativeDay } from "@/lib/format";
import type { CollegeStudent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DemoBadge, StatusPill } from "@/components/shared/badges";
import { EmptyState, PageHeader } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAitCollege, useCollegePrograms } from "@/components/college/brand";
import {
  AIT_COHORTS,
  AIT_STUDENTS,
  cohortShort,
  daysSinceActive,
  inBand,
  needsAttention,
  overallProgress,
  programShort,
  PROGRESS_BANDS,
  STUDENT_YEARS,
} from "@/components/college/college-data";
import { InviteStudentsDialog, type Invitation } from "@/components/college/invite-dialog";
import { sendReminder, StudentSheet } from "@/components/college/student-sheet";

export default function CollegeStudentsPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-7xl animate-pulse rounded-2xl bg-muted" />}>
      <StudentsDirectory />
    </Suspense>
  );
}

const ALL = "all";

function StudentsDirectory() {
  const params = useSearchParams();
  const college = useAitCollege();
  const programs = useCollegePrograms();
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState(ALL);
  const [year, setYear] = useState(ALL);
  const [cohort, setCohort] = useState(ALL);
  const [band, setBand] = useState(ALL);
  const [assessment, setAssessment] = useState(ALL);
  const [program, setProgram] = useState(() => params.get("program") ?? ALL);
  const [selectedId, setSelectedId] = useState<string | null>(() => params.get("student"));
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invites, setInvites] = useState<Invitation[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return AIT_STUDENTS.filter((s) => {
      if (q && !`${s.name} ${s.rollNo} ${s.email}`.toLowerCase().includes(q)) return false;
      if (department !== ALL && s.department !== department) return false;
      if (year !== ALL && s.year !== year) return false;
      if (cohort !== ALL && (cohort === "none" ? Boolean(s.cohortId) : s.cohortId !== cohort)) return false;
      if (band !== ALL && !inBand(overallProgress(s), band)) return false;
      if (assessment !== ALL && s.assessmentCompleted !== (assessment === "yes")) return false;
      if (program !== ALL && !s.assignedCourseIds.includes(program)) return false;
      return true;
    });
  }, [query, department, year, cohort, band, assessment, program]);

  const filtersActive = query || [department, year, cohort, band, assessment, program].some((v) => v !== ALL);
  const reset = () => {
    setQuery("");
    setDepartment(ALL);
    setYear(ALL);
    setCohort(ALL);
    setBand(ALL);
    setAssessment(ALL);
    setProgram(ALL);
  };
  const selected = AIT_STUDENTS.find((s) => s.id === selectedId) ?? null;
  const attentionInView = filtered.filter(needsAttention);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow={college.name}
        title="Students"
        description="Track enrolment, program progress and engagement for students on your licence."
        actions={
          <>
            <Button variant="outline" className="h-10 px-4" disabled={!attentionInView.length} onClick={() => sendReminder(attentionInView.map((s) => s.name))}>
              <BellRing /> Remind {attentionInView.length ? `${attentionInView.length} needing attention` : "students"}
            </Button>
            <Button className="h-10 px-4" onClick={() => setInviteOpen(true)}>
              <UserPlus /> Invite students
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs sm:flex-row sm:items-center">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <Users className="size-5" />
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium">
            {college.activeStudents} students enrolled · {college.seats - college.activeStudents} seats available
          </p>
          <p className="text-muted-foreground">The directory below shows {AIT_STUDENTS.length} representative student records for this demo.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" /> Assessment answers stay private
          </span>
          <DemoBadge />
        </div>
      </div>

      {invites.length > 0 && (
        <section className="rounded-xl border border-dashed bg-card p-4">
          <h2 className="font-heading text-sm font-semibold">Pending invitations</h2>
          <ul className="mt-2 divide-y">
            {invites.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <MailCheck className="size-4 text-brand" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{inv.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.count} invitation{inv.count === 1 ? "" : "s"} · {inv.department} · {inv.detail}
                  </p>
                </div>
                <StatusPill tone="warning">Awaiting sign-up</StatusPill>
                <Button variant="ghost" size="sm" onClick={() => toast.success("Invitations resent", { description: `${inv.count} students will get a fresh sign-in link (simulated).` })}>
                  Resend
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    setInvites((list) => list.filter((x) => x.id !== inv.id));
                    toast("Invitation revoked", { description: `${inv.count} seat${inv.count === 1 ? "" : "s"} released back to your licence.` });
                  }}
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, roll no or email" className="h-9 pl-8" aria-label="Search students" />
          </div>
          <FilterSelect label="Department" value={department} onChange={setDepartment} options={college.departments.map((d) => ({ value: d, label: d }))} />
          <FilterSelect label="Year" value={year} onChange={setYear} options={STUDENT_YEARS.map((y) => ({ value: y, label: y }))} />
          <FilterSelect
            label="Cohort"
            value={cohort}
            onChange={setCohort}
            options={[...AIT_COHORTS.map((c) => ({ value: c.id, label: cohortShort(c.id) })), { value: "none", label: "No cohort" }]}
          />
          <FilterSelect label="Progress" value={band} onChange={setBand} options={PROGRESS_BANDS.map((b) => ({ value: b.id, label: b.label }))} />
          <FilterSelect
            label="Assessment"
            value={assessment}
            onChange={setAssessment}
            options={[
              { value: "yes", label: "Completed" },
              { value: "no", label: "Not completed" },
            ]}
          />
          <FilterSelect label="Program" value={program} onChange={setProgram} options={programs.map((c) => ({ value: c.id, label: programShort(c) }))} />
          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw /> Reset
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {AIT_STUDENTS.length} records
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No students match these filters"
          description="Try a different search term or clear the filters."
          action={
            <Button variant="outline" onClick={reset}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border bg-card shadow-xs md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="pl-4">Student</TableHead>
                  <TableHead>Roll no</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Programs</TableHead>
                  <TableHead className="w-44">Overall progress</TableHead>
                  <TableHead>Last active</TableHead>
                  <TableHead className="pr-4">Assessment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer"
                    tabIndex={0}
                    onClick={() => setSelectedId(s.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedId(s.id);
                      }
                    }}
                    aria-label={`View ${s.name}`}
                  >
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-2.5">
                        <Portrait avatar={s.avatar} name={s.name} className="size-8" />
                        <div className="min-w-0">
                          <p className="font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.rollNo}</TableCell>
                    <TableCell>
                      <p>{s.department}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.year}
                        {s.cohortId ? ` · ${cohortShort(s.cohortId)}` : ""}
                      </p>
                    </TableCell>
                    <TableCell>
                      <ProgramDots student={s} brandColor={college.brandColor} />
                    </TableCell>
                    <TableCell>
                      <ProgressCell value={overallProgress(s)} />
                    </TableCell>
                    <TableCell>
                      <LastActive student={s} />
                    </TableCell>
                    <TableCell className="pr-4">
                      <AssessmentStatus done={s.assessmentCompleted} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-2 md:hidden">
            {filtered.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => setSelectedId(s.id)} className="w-full rounded-xl border bg-card p-3 text-left shadow-xs">
                  <div className="flex items-center gap-3">
                    <Portrait avatar={s.avatar} name={s.name} className="size-10" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{s.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {s.rollNo} · {s.department}
                      </p>
                    </div>
                    <AssessmentStatus done={s.assessmentCompleted} compact />
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <ProgressCell value={overallProgress(s)} className="flex-1" />
                    <LastActive student={s} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <StudentSheet student={selected} college={college} onOpenChange={(o) => !o && setSelectedId(null)} />
      <InviteStudentsDialog open={inviteOpen} onOpenChange={setInviteOpen} college={college} onInvited={(inv) => setInvites((list) => [inv, ...list])} />
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("h-9 min-w-32", value !== ALL && "border-primary/40 bg-secondary text-primary")} aria-label={`Filter by ${label.toLowerCase()}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {label === "Progress" ? "progress" : label.toLowerCase() + (label.endsWith("s") ? "" : "s")}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ProgressCell({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Progress
        value={value}
        className={cn("h-1.5 w-full", value < 35 ? "[&>[data-slot=progress-indicator]]:bg-warning" : "[&>[data-slot=progress-indicator]]:bg-brand")}
      />
      <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums">{value}%</span>
    </div>
  );
}

function LastActive({ student }: { student: CollegeStudent }) {
  const stale = daysSinceActive(student) > 7;
  return <span className={cn("text-xs whitespace-nowrap", stale ? "font-medium text-warning" : "text-muted-foreground")}>{relativeDay(student.lastActive)}</span>;
}

function AssessmentStatus({ done, compact }: { done: boolean; compact?: boolean }) {
  return done ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
      <CheckCircle2 className="size-3.5" />
      {!compact && "Completed"}
      <span className={compact ? "sr-only" : "hidden"}>Assessment completed</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <CircleDashed className="size-3.5" />
      {!compact && "Pending"}
      <span className={compact ? "sr-only" : "hidden"}>Assessment pending</span>
    </span>
  );
}

function ProgramDots({ student, brandColor }: { student: CollegeStudent; brandColor: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-1">
        {student.assignedCourseIds.map((id) => (
          <span
            key={id}
            className={cn("size-3 rounded-full ring-2 ring-card", getCourse(id)?.collegeId ? "" : "bg-chart-1")}
            style={getCourse(id)?.collegeId ? { backgroundColor: brandColor } : undefined}
            title={getCourse(id)?.title ?? id}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{student.assignedCourseIds.length}</span>
    </div>
  );
}
