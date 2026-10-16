"use client";

import { useMemo } from "react";
import { getCourse } from "@/data";
import { FORMATS } from "@/data/constants";
import { formatINR } from "@/lib/format";
import type { Course, LearningFormat, ThumbnailTheme } from "@/lib/types";
import { useCourses } from "@/store/hooks";
import { useDemoStore } from "@/store/demo-store";
import { useAdminContent } from "./admin-content-store";

export type AdminCourse = Course & { custom?: boolean };

/** Catalog as the admin sees it: admin-created drafts first, then seed courses with status overrides and session edits. */
export function useAdminCourses(): AdminCourse[] {
  const seed = useCourses();
  const custom = useDemoStore((s) => s.customCourses);
  const edits = useAdminContent((s) => s.courseEdits);
  const removed = useAdminContent((s) => s.removedCourseIds);
  return useMemo(
    () =>
      [
        ...custom.map((c): AdminCourse => ({ ...c, custom: true })),
        ...seed.map((c): AdminCourse => ({ ...c, ...edits[c.id], status: c.status })),
      ].filter((c) => !removed.includes(c.id)),
    [seed, custom, edits, removed],
  );
}

/** Course lookup that also knows about admin-created courses. */
export function useCourseLookup() {
  const custom = useDemoStore((s) => s.customCourses);
  return useMemo(() => {
    const map = new Map(custom.map((c) => [c.id, c]));
    return (id: string): Course | undefined => getCourse(id) ?? map.get(id);
  }, [custom]);
}

export function offeredFormats(course: Pick<Course, "formats">): LearningFormat[] {
  return FORMATS.filter((f) => course.formats.includes(f));
}

/** "Free – ₹3,499", "₹1,999", "—" */
export function priceRange(course: Pick<Course, "formats" | "pricing">) {
  const prices = offeredFormats(course)
    .map((f) => course.pricing[f])
    .filter((p): p is number => typeof p === "number");
  if (!prices.length) return "—";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const fmt = (v: number) => formatINR(v, { free: true });
  return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
}

/** Artwork presets for admin-created courses. */
export const THUMBNAIL_PRESETS: ThumbnailTheme[] = [
  { from: "#312e81", to: "#0f766e", icon: "compass", pattern: "rings" },
  { from: "#1e1b4b", to: "#6d28d9", icon: "crown", pattern: "bars" },
  { from: "#0c4a6e", to: "#0891b2", icon: "messages", pattern: "waves" },
  { from: "#134e4a", to: "#0d9488", icon: "briefcase", pattern: "grid" },
  { from: "#7c2d12", to: "#c2410c", icon: "mic", pattern: "dots" },
  { from: "#3b0764", to: "#be185d", icon: "sparkles", pattern: "rings" },
  { from: "#1e3a8a", to: "#4338ca", icon: "graduation", pattern: "grid" },
  { from: "#14532d", to: "#15803d", icon: "route", pattern: "waves" },
];

export const COURSE_STATUS_META: Record<Course["status"], { label: string; description: string }> = {
  draft: { label: "Draft", description: "Only visible to admins and the assigned mentor." },
  "in-review": { label: "In review", description: "Submitted for content & quality review before publishing." },
  published: { label: "Published", description: "Live in the catalog and open for enrolment." },
  unpublished: { label: "Unpublished", description: "Hidden from the catalog; existing learners keep access." },
};

/** URL-safe slug from a title. */
export function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
