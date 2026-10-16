"use client";

import { blankCourse, CourseEditor } from "@/components/admin/content/course-editor";

export default function NewCoursePage() {
  return <CourseEditor mode="new" initial={blankCourse()} />;
}
