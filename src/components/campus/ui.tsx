"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { College, Course } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { FormatBadge } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProviderBadge } from "@/components/college/brand";
import { studentFormat } from "./campus-data";

/** Circular progress ring. */
export function ProgressRing({ value, size = 96, stroke = 8, color = "var(--brand)", track = "var(--muted)", className, children }: { value: number; size?: number; stroke?: number; color?: string; track?: string; className?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, value) / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/** Eyebrow text in the college brand colour for campus page headers. */
export function CampusEyebrow({ college }: { college: Pick<College, "name" | "shortName" | "brandColor"> }) {
  return <span style={{ color: college.brandColor }}>{college.shortName} × Career Design Lab</span>;
}

/** Program card used on campus Home and My Programs. */
export function CampusProgramCard({ course, progress, college, compact }: { course: Course; progress: number; college: College; compact?: boolean }) {
  const status = progress >= 100 ? "Completed" : progress === 0 ? "Not started" : "In progress";
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-xs transition hover:shadow-md">
      {!compact && (
        <div className="p-2 pb-0">
          <CourseThumbnail course={course} />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <ProviderBadge course={course} college={college} size="sm" />
          <FormatBadge format={studentFormat(course.id)} short className="h-5 px-2 text-[11px]" />
        </div>
        <div className="flex items-start gap-3">
          {compact && <CourseThumbnail course={course} size="sm" className="w-16 shrink-0" />}
          <div className="min-w-0">
            <h3 className="font-heading leading-snug font-semibold">{course.title}</h3>
            {!compact && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{course.subtitle}</p>}
          </div>
        </div>
        <div className="mt-auto space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{status}</span>
            <span className="font-semibold tabular-nums">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5 [&>[data-slot=progress-indicator]]:bg-brand" />
        </div>
        <Button asChild className="h-9 w-full" variant={progress >= 100 ? "outline" : "default"}>
          <Link href={`/campus/learn/${course.id}`}>
            {progress >= 100 ? "Review" : progress === 0 ? "Start" : "Continue"} <ArrowRight />
          </Link>
        </Button>
      </div>
    </article>
  );
}
