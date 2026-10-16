import type { Metadata } from "next";
import { CourseCatalog } from "@/components/site/courses/course-catalog";

export const metadata: Metadata = {
  title: "Courses",
  description: "Browse CDL courses in career discovery, communication, employability, leadership and personal growth.",
};

export default function CoursesPage() {
  return <CourseCatalog />;
}
