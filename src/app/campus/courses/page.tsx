"use client";

import Link from "next/link";
import { ExternalLink, Lock } from "lucide-react";
import { publicCourses } from "@/data";
import { PageHeader, SectionHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CollegeMark, useAitCollege } from "@/components/college/brand";
import { overallProgress } from "@/components/college/college-data";
import { STUDENT, STUDENT_COURSES } from "@/components/campus/campus-data";
import { CampusEyebrow, CampusProgramCard } from "@/components/campus/ui";

export default function CampusCoursesPage() {
  const college = useAitCollege();
  const own = STUDENT_COURSES.filter((c) => c.collegeId);
  const cdl = STUDENT_COURSES.filter((c) => !c.collegeId);
  const notIncluded = publicCourses.filter((c) => !STUDENT.assignedCourseIds.includes(c.id)).slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow={<CampusEyebrow college={college} />}
        title="My programs"
        description={`${STUDENT_COURSES.length} programs assigned to you by ${college.name}. Overall completion: ${overallProgress(STUDENT)}%.`}
      />

      {own.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <CollegeMark college={college} className="size-9 rounded-lg text-xs" />
            <SectionHeader title={`From ${college.name}`} description="Institution-provided content, visible only to students on your campus." className="flex-1" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {own.map((c) => (
              <CampusProgramCard key={c.id} course={c} progress={STUDENT.progress[c.id] ?? 0} college={college} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <SectionHeader title="CDL programs assigned to you" description={`Career Design Lab programs included in ${college.shortName}'s ${college.plan} licence.`} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cdl.map((c) => (
            <CampusProgramCard key={c.id} course={c} progress={STUDENT.progress[c.id] ?? 0} college={college} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed bg-muted/40 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border">
              <Lock className="size-4" />
            </span>
            <div>
              <h2 className="font-heading font-semibold text-muted-foreground">Not included in your college plan</h2>
              <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
                Your access is limited to programs {college.shortName} has assigned to you. Other CDL programs can be explored in the public catalog or requested through your T&amp;P cell.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/courses">
              Browse public catalog <ExternalLink />
            </Link>
          </Button>
        </div>
        <ul className="mt-4 flex flex-wrap gap-2">
          {notIncluded.map((c) => (
            <li key={c.id}>
              <Link
                href={`/campus/learn/${c.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
              >
                <Lock className="size-3" />
                {c.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
