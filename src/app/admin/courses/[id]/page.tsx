"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { getCourse } from "@/data";
import { useDemoStore } from "@/store/demo-store";
import { useHydrated } from "@/store/hooks";
import { useAdminContent } from "@/components/admin/content/admin-content-store";
import { CourseEditor } from "@/components/admin/content/course-editor";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const hydrated = useHydrated();
  const seed = getCourse(id);
  const customCourses = useDemoStore((s) => s.customCourses);
  const statusOverride = useDemoStore((s) => s.courseStatus[id]);
  const edits = useAdminContent((s) => s.courseEdits[id]);

  if (seed) {
    // Remount once persisted state (status overrides) has been restored.
    return <CourseEditor key={hydrated ? "hydrated" : "seed"} mode="seed" initial={{ ...seed, ...edits, status: statusOverride ?? seed.status }} />;
  }
  const custom = customCourses.find((c) => c.id === id);
  if (custom) return <CourseEditor key={custom.id} mode="custom" initial={custom} />;
  if (!hydrated) {
    return (
      <div className="mx-auto max-w-7xl space-y-6" aria-busy="true" aria-label="Loading course">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-9 w-80" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Skeleton className="h-[520px] rounded-2xl" />
          <Skeleton className="h-[420px] rounded-2xl" />
        </div>
      </div>
    );
  }
  notFound();
}
