"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCourse } from "@/data";
import { CurriculumEditor } from "@/components/mentor/curriculum-editor";
import { isMyCourse } from "@/components/mentor/mentor-data";
import { PageHeader } from "@/components/shared/page-header";

export default function MentorCourseWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const course = getCourse(id);
  if (!course || !isMyCourse(id)) notFound();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link href="/mentor/courses" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> My Courses
      </Link>
      <PageHeader
        eyebrow="Course workspace"
        title={course.title}
        description="Rename, reorder and add chapters and lessons, attach resources and preview what learners see. Your edits are submitted to the CDL team for approval."
      />
      <CurriculumEditor course={course} />
    </div>
  );
}
