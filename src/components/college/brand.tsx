"use client";

import { useMemo } from "react";
import { Building2, Lock } from "lucide-react";
import { getCollege } from "@/data";
import { DEMO_COLLEGE_ID } from "@/data/constants";
import type { College, Course } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { LogoMark } from "@/components/brand/logo";
import { coursesFromIds } from "./college-data";

/** The demo college (Aravali Institute of Technology), with any admin edits from the store applied. */
export function useAitCollege(): College {
  const college = useDemoStore((s) => s.colleges.find((c) => c.id === DEMO_COLLEGE_ID));
  return college ?? getCollege(DEMO_COLLEGE_ID)!;
}

/** Courses assigned to the college under its licence (CDL programs + institution-provided courses). */
export function useCollegePrograms() {
  const college = useAitCollege();
  return useMemo(() => coursesFromIds(college.assignedCourseIds), [college.assignedCourseIds]);
}

/** Tint of the college brand colour mixed with white (or a CSS colour). */
export const tint = (color: string, amount: number, base = "white") => `color-mix(in oklch, ${color} ${amount}%, ${base})`;

/** Co-branded gradient band: college colour blending into CDL navy. */
export const brandGradient = (color: string) =>
  `radial-gradient(120% 140% at 100% 0%, ${tint(color, 40, "transparent")} 0%, transparent 55%), linear-gradient(115deg, ${color} 0%, color-mix(in oklch, ${color} 55%, var(--navy)) 55%, var(--navy) 100%)`;

/** Square institution mark with the college short name. */
export function CollegeMark({ college, className, inverted }: { college: Pick<College, "shortName" | "brandColor" | "name">; className?: string; inverted?: boolean }) {
  return (
    <span
      className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl font-heading text-sm font-bold tracking-tight", className)}
      style={inverted ? { backgroundColor: "white", color: college.brandColor } : { backgroundColor: college.brandColor, color: "white" }}
      aria-label={`${college.name} logo`}
      role="img"
    >
      {college.shortName}
    </span>
  );
}

/** "AIT × CDL" lockup used on co-branded hero bands. */
export function CoBrandLockup({ college, className }: { college: College; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <CollegeMark college={college} inverted className="size-9 rounded-[11px] text-xs ring-1 ring-white/30" />
      <span className="text-sm font-medium text-white/70">×</span>
      <LogoMark className="size-9 rounded-[11px] ring-1 ring-white/25" />
    </span>
  );
}

/** Distinguishes institution-provided content from CDL programs. */
export function ProviderBadge({
  course,
  college,
  className,
  size = "default",
}: {
  course: Pick<Course, "collegeId">;
  college: Pick<College, "shortName" | "brandColor">;
  className?: string;
  size?: "default" | "sm";
}) {
  const base = cn(
    "inline-flex shrink-0 items-center gap-1.5 rounded-full font-medium whitespace-nowrap ring-1 ring-inset",
    size === "sm" ? "h-5 px-2 text-[11px]" : "h-6 px-2.5 text-xs",
    className,
  );
  if (course.collegeId) {
    return (
      <span className={base} style={{ backgroundColor: tint(college.brandColor, 9), color: college.brandColor, boxShadow: `inset 0 0 0 1px ${tint(college.brandColor, 28, "transparent")}` }}>
        <Building2 className="size-3.5" />
        Provided by {college.shortName}
      </span>
    );
  }
  return (
    <span className={cn(base, "bg-secondary text-primary ring-primary/15")}>
      <LogoMark className="size-3.5 rounded-[3px]" />
      CDL program
    </span>
  );
}

/** Small "visible only to <college> students" chip. */
export function CollegeOnlyChip({ college, className }: { college: Pick<College, "shortName">; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full bg-muted px-2.5 text-xs font-medium text-muted-foreground ring-1 ring-border ring-inset", className)}>
      <Lock className="size-3" />
      {college.shortName} students only
    </span>
  );
}
