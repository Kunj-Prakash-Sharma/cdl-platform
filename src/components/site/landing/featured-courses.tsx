"use client";

import { useMemo } from "react";
import { useCourses } from "@/store/hooks";
import { CourseCard } from "@/components/shared/cards";

/** Featured, published public courses (respects admin status overrides). */
export function FeaturedCourses() {
  const courses = useCourses();
  const featured = useMemo(() => courses.filter((c) => c.featured && c.status === "published" && !c.collegeId).slice(0, 6), [courses]);
  return (
    <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {featured.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
