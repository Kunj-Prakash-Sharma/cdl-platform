"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { getCourse } from "@/data";
import { CourseDetail } from "@/components/site/course/course-detail";

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  if (!getCourse(id)) notFound();
  return <CourseDetail key={id} courseId={id} />;
}
