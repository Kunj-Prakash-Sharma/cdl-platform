import type { Metadata } from "next";
import { getCourse } from "@/data";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const course = getCourse(id);
  return course ? { title: course.title, description: course.subtitle } : { title: "Course not found" };
}

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
