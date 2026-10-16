"use client";

import { useMemo, useState } from "react";
import { BookCheck, CalendarCheck, ClipboardCheck, Clock, Download, Users } from "lucide-react";
import { toast } from "sonner";
import { formatNumber } from "@/lib/format";
import { DemoBadge } from "@/components/shared/badges";
import { PageHeader, StatCard } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAitCollege, useCollegePrograms } from "@/components/college/brand";
import { assessmentSummary, departmentComparison, programProgressWindow, programShort, weeksFor } from "@/components/college/college-data";
import { AssessmentDonut, AttendanceTrendChart, DepartmentChart, ProgramWindowChart, WeeklyActiveChart } from "@/components/college/charts";

const RANGES = [4, 8, 12];

export default function CollegeReportsPage() {
  const college = useAitCollege();
  const programs = useCollegePrograms();
  const [range, setRange] = useState(8);

  const weeks = weeksFor(range);
  const avgActive = Math.round(weeks.reduce((s, w) => s + w.active, 0) / weeks.length);
  const lessons = weeks.reduce((s, w) => s + w.lessons, 0);
  const hours = weeks.reduce((s, w) => s + w.hours, 0);
  const attendanceWeeks = weeks.flatMap((w) => [w.attendanceA, w.attendanceB]).filter((v): v is number => v !== null);
  const avgAttendance = attendanceWeeks.length ? Math.round(attendanceWeeks.reduce((s, v) => s + v, 0) / attendanceWeeks.length) : 0;
  const assessment = assessmentSummary(range);

  const programRows = useMemo(() => programs.map((c) => ({ name: programShort(c), ...programProgressWindow(c.id, range) })), [programs, range]);
  const deptRows = useMemo(() => departmentComparison(college.departments, range), [college.departments, range]);
  const firstWeek = weeks[0];
  const lastWeek = weeks[weeks.length - 1];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow={college.name}
        title="Engagement reports"
        description="How actively your students are learning, completing programs and attending live classes."
        actions={
          <>
            <Select value={String(range)} onValueChange={(v) => setRange(Number(v))}>
              <SelectTrigger className="h-10 w-40" aria-label="Date range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGES.map((r) => (
                  <SelectItem key={r} value={String(r)}>
                    Last {r} weeks
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="h-10 px-4"
              onClick={() =>
                toast.success("CSV export ready (simulated)", {
                  description: `${college.shortName}-engagement-${range}w.csv · ${weeks.length} weekly rows, ${programRows.length} programs, ${deptRows.length} departments.`,
                })
              }
            >
              <Download /> Export CSV
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>
          Week of {firstWeek.label} – week of {lastWeek.label} 2026
        </span>
        <DemoBadge>Synthetic engagement data</DemoBadge>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Avg weekly active" value={avgActive} icon={Users} hint={`${Math.round((avgActive / college.activeStudents) * 100)}% of enrolled`} />
        <StatCard label="Lessons completed" value={formatNumber(lessons)} icon={BookCheck} accent="brand" />
        <StatCard label="Learning hours" value={formatNumber(hours)} icon={Clock} accent="info" />
        <StatCard label="Assessments taken" value={assessment.inPeriod} icon={ClipboardCheck} accent="success" hint="in this period" />
        <StatCard label="Class attendance" value={`${avgAttendance}%`} icon={CalendarCheck} accent="warning" hint="avg across batches" className="col-span-2 lg:col-span-1" />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ReportCard title="Weekly active students" description="Students who watched a lesson, attended a class or submitted work.">
          <WeeklyActiveChart data={weeks} className="h-64" />
        </ReportCard>
        <ReportCard title="Session attendance trend" description="Average attendance of live classes, by batch. Gaps are weeks without a class.">
          <AttendanceTrendChart data={weeks} />
        </ReportCard>
        <ReportCard title="Completion by program" description="Average progress at the start of the period vs now.">
          <ProgramWindowChart rows={programRows} />
        </ReportCard>
        <ReportCard title="Department comparison" description="Average program progress and weekly-active rate, by department.">
          <DepartmentChart rows={deptRows} />
        </ReportCard>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <ReportCard title="Career assessment completion" description={`${assessment.inPeriod} students completed it in the last ${range} weeks.`}>
          <AssessmentDonut completed={assessment.completed} inProgress={assessment.inProgress} notStarted={assessment.notStarted} rate={assessment.rate} />
          <p className="mt-4 text-xs text-muted-foreground">Colleges see completion status only. Individual answers and reports remain private to each student.</p>
        </ReportCard>
        <ReportCard title="Weekly data" description="The numbers behind the charts above.">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="pl-3">Week of</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                  <TableHead className="text-right">Lessons</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">Assessments</TableHead>
                  <TableHead className="text-right">Batch A</TableHead>
                  <TableHead className="pr-3 text-right">Batch B</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...weeks].reverse().map((w) => (
                  <TableRow key={w.week}>
                    <TableCell className="pl-3 font-medium">{w.label}</TableCell>
                    <TableCell className="text-right tabular-nums">{w.active}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(w.lessons)}</TableCell>
                    <TableCell className="text-right tabular-nums">{w.hours}</TableCell>
                    <TableCell className="text-right tabular-nums">{w.assessments}</TableCell>
                    <TableCell className="text-right tabular-nums">{w.attendanceA === null ? "—" : `${w.attendanceA}%`}</TableCell>
                    <TableCell className="pr-3 text-right tabular-nums">{w.attendanceB === null ? "—" : `${w.attendanceB}%`}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ReportCard>
      </section>
    </div>
  );
}

function ReportCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border bg-card p-5 shadow-xs">
      <h2 className="font-heading text-base font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}
