import {
  BriefcaseBusiness,
  Building,
  Compass,
  Crown,
  Factory,
  FileText,
  GraduationCap,
  HeartHandshake,
  MessagesSquare,
  Mic,
  Route,
  Sparkles,
  Users,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import { createElement } from "react";
import type { Course, ThumbnailTheme } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  compass: Compass,
  crown: Crown,
  messages: MessagesSquare,
  users: Users,
  briefcase: BriefcaseBusiness,
  file: FileText,
  graduation: GraduationCap,
  sparkles: Sparkles,
  mic: Mic,
  building: Building,
  heart: HeartHandshake,
  route: Route,
  factory: Factory,
};

export const courseIcon = (theme: ThumbnailTheme): LucideIcon => ICONS[theme.icon] ?? Compass;

/** Renders the icon for a course's thumbnail theme. */
export function CourseIcon({ theme, ...props }: { theme: ThumbnailTheme } & LucideProps) {
  return createElement(courseIcon(theme), props);
}

function Pattern({ kind }: { kind: ThumbnailTheme["pattern"] }) {
  const common = { fill: "none", stroke: "white", strokeOpacity: 0.14 } as const;
  switch (kind) {
    case "rings":
      return (
        <g {...common} strokeWidth="1.2">
          {[28, 48, 68, 88, 108].map((r) => (
            <circle key={r} cx="250" cy="150" r={r} />
          ))}
        </g>
      );
    case "grid":
      return (
        <g {...common} strokeWidth="0.8">
          {Array.from({ length: 12 }, (_, i) => (
            <path key={`v${i}`} d={`M${i * 28} 0V200`} />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <path key={`h${i}`} d={`M0 ${i * 28}H320`} />
          ))}
        </g>
      );
    case "waves":
      return (
        <g {...common} strokeWidth="1.4">
          {[0, 18, 36, 54, 72, 90].map((y) => (
            <path key={y} d={`M-10 ${100 + y}C50 ${70 + y} 90 ${130 + y} 160 ${100 + y}S270 ${70 + y} 330 ${100 + y}`} />
          ))}
        </g>
      );
    case "dots":
      return (
        <g fill="white" fillOpacity="0.16">
          {Array.from({ length: 70 }, (_, i) => (
            <circle key={i} cx={(i % 14) * 24 + 8} cy={Math.floor(i / 14) * 24 + 84} r="2" />
          ))}
        </g>
      );
    case "bars":
      return (
        <g fill="white" fillOpacity="0.1">
          {[40, 64, 52, 88, 76, 110, 96].map((h, i) => (
            <rect key={i} x={150 + i * 22} y={190 - h} width="14" height={h} rx="3" />
          ))}
        </g>
      );
  }
}

/**
 * Designed course artwork (gradient + pattern + icon) — consistent across catalog, dashboards and admin.
 * Use `size="sm"` for table rows / compact lists.
 */
export function CourseThumbnail({
  course,
  className,
  size = "md",
  showCategory = true,
}: {
  course: Pick<Course, "title" | "category" | "thumbnail" | "collegeId">;
  className?: string;
  size?: "sm" | "md" | "lg";
  showCategory?: boolean;
}) {
  const t = course.thumbnail;
  return (
    <div
      className={cn("relative isolate aspect-video w-full overflow-hidden", size === "sm" ? "rounded-md" : "rounded-xl", className)}
      style={{ backgroundImage: `linear-gradient(135deg, ${t.from} 0%, ${t.to} 100%)` }}
      role="img"
      aria-label={`${course.title} course artwork`}
    >
      <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 -z-10 size-full" aria-hidden="true">
        <Pattern kind={t.pattern} />
        <circle cx="40" cy="-20" r="90" fill="white" fillOpacity="0.06" />
      </svg>
      {size === "sm" ? (
        <div className="flex size-full items-center justify-center">
          <CourseIcon theme={t} className="size-1/3 text-white/90" strokeWidth={1.6} />
        </div>
      ) : (
        <>
          {showCategory && (
            <span className="absolute top-3 left-3 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              {course.collegeId ? "Institution course" : course.category}
            </span>
          )}
          <div
            className={cn(
              "absolute right-4 bottom-4 flex items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur-sm",
              size === "lg" ? "size-20" : "size-14",
            )}
          >
            <CourseIcon theme={t} className={cn("text-white", size === "lg" ? "size-10" : "size-7")} strokeWidth={1.6} />
          </div>
          <p
            className={cn(
              "absolute bottom-4 left-4 max-w-[62%] font-heading leading-tight font-semibold text-white drop-shadow-sm",
              size === "lg" ? "text-2xl" : "text-[15px]",
            )}
          >
            {course.title}
          </p>
        </>
      )}
    </div>
  );
}
