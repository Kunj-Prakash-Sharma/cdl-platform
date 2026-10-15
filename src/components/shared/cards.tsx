import Link from "next/link";
import { ArrowRight, Clock, PlayCircle, Star, Users } from "lucide-react";
import { courseDurationSec, courseStartingPrice, courseVideoLessons, getMentor, isFreeCourse } from "@/data";
import { STAGE_META } from "@/data/constants";
import { formatCompact, formatDuration, formatINR } from "@/lib/format";
import type { Course, LearningFormat, Mentor } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FormatBadge } from "./badges";
import { CourseThumbnail } from "./course-thumbnail";
import { Portrait } from "./portrait";

export function Rating({ value, count, className }: { value: number; count?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
      <Star className="size-3.5 fill-amber-400 text-amber-400" />
      <span className="font-semibold text-foreground">{value.toFixed(1)}</span>
      {count !== undefined && <span>({formatCompact(count)})</span>}
    </span>
  );
}

/** Catalog card. Every card links to /courses/[id]. */
export function CourseCard({
  course,
  highlightFormat,
  reason,
  className,
  compact,
}: {
  course: Course;
  /** Show this format's price instead of "From" pricing */
  highlightFormat?: LearningFormat;
  /** Optional recommendation reason shown under the title */
  reason?: string;
  className?: string;
  compact?: boolean;
}) {
  const mentor = getMentor(course.instructorId);
  const free = isFreeCourse(course);
  const price = highlightFormat ? course.pricing[highlightFormat] : courseStartingPrice(course);
  const videos = courseVideoLessons(course).length;
  return (
    <Link
      href={`/courses/${course.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-xs transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      <div className="p-2 pb-0">
        <CourseThumbnail course={course} />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          {(highlightFormat ? [highlightFormat] : course.formats).map((f) => (
            <FormatBadge key={f} format={f} short />
          ))}
        </div>
        <div>
          <h3 className="font-heading leading-snug font-semibold group-hover:text-primary">{course.title}</h3>
          <p className={cn("mt-1 text-sm text-muted-foreground", compact ? "line-clamp-1" : "line-clamp-2")}>{reason ?? course.subtitle}</p>
        </div>
        {mentor && (
          <div className="flex items-center gap-2">
            <Portrait avatar={mentor.avatar} name={mentor.name} className="size-6" />
            <span className="truncate text-xs text-muted-foreground">{mentor.name}</span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {course.durationLabel} · {formatDuration(courseDurationSec(course))}
          </span>
          <span className="inline-flex items-center gap-1">
            <PlayCircle className="size-3.5" />
            {videos} lessons
          </span>
          {!compact && (
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" />
              {course.audience.map((a) => STAGE_META[a].plural.split(" ")[0]).join(", ")}
            </span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
          <div className="flex flex-col">
            <span className="font-heading text-[17px] font-semibold">
              {free && !highlightFormat ? "Free" : `${highlightFormat ? "" : "From "}${formatINR(price ?? 0, { free: true })}`}
            </span>
            <Rating value={course.rating} count={course.reviewCount} />
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            View course <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function MentorCard({ mentor, action, className }: { mentor: Mentor; action?: React.ReactNode; className?: string }) {
  const from = Math.min(...mentor.offers.map((o) => o.price));
  return (
    <div className={cn("flex flex-col rounded-2xl border bg-card p-5 shadow-xs", className)}>
      <div className="flex items-start gap-4">
        <Portrait avatar={mentor.avatar} name={mentor.name} className="size-16" rounded="xl" />
        <div className="min-w-0">
          <h3 className="font-heading font-semibold">{mentor.name}</h3>
          <p className="text-sm text-muted-foreground">{mentor.title}</p>
          {mentor.rating > 0 && <Rating value={mentor.rating} count={mentor.reviewCount} className="mt-1" />}
        </div>
      </div>
      <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{mentor.headline}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {mentor.expertise.slice(0, 3).map((e) => (
          <span key={e} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {e}
          </span>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <span className="text-sm">
          <span className="text-muted-foreground">1:1 from </span>
          <span className="font-semibold">{formatINR(from)}</span>
        </span>
        {action ?? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/mentors/${mentor.id}`}>View profile</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
