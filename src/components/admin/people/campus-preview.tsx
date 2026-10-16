"use client";

import { Bell, BookOpen, CalendarDays, ClipboardCheck, House, Lock, TrendingUp } from "lucide-react";
import { CourseIcon } from "@/components/shared/course-thumbnail";
import { Portrait } from "@/components/shared/portrait";
import { getCourse } from "@/data";
import { cn } from "@/lib/utils";

const SAMPLE_PROGRESS = [62, 35, 18, 0, 0, 0];

/**
 * Realistic mini mock of an institution's branded student portal, used in the onboarding wizard and the
 * college detail panel. Pure presentation — no tenant is created.
 */
export function CampusPreview({
  name,
  shortName,
  brandColor,
  courseIds,
  departments,
  allowInstitutionContent,
  className,
}: {
  name: string;
  shortName: string;
  brandColor: string;
  courseIds: string[];
  departments: string[];
  allowInstitutionContent?: boolean;
  className?: string;
}) {
  const courses = courseIds.map((id) => getCourse(id)).filter((c) => c !== undefined);
  const shown = courses.slice(0, 4);
  const slug = (shortName || "campus").toLowerCase().replace(/[^a-z0-9]/g, "");
  const avg = shown.length ? Math.round(shown.reduce((n, _, i) => n + SAMPLE_PROGRESS[i], 0) / shown.length) : 0;

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-background shadow-md", className)} aria-label={`Preview of the ${name || "institution"} student portal`}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b bg-muted/70 px-3 py-2">
        <span className="flex gap-1">
          <span className="size-2.5 rounded-full bg-rose-300" />
          <span className="size-2.5 rounded-full bg-amber-300" />
          <span className="size-2.5 rounded-full bg-emerald-300" />
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
          <Lock className="size-3 shrink-0" />
          <span className="truncate">campus.careerdesignlab.demo/{slug}</span>
        </span>
      </div>

      {/* Branded header */}
      <div className="flex items-center gap-3 px-4 py-3 text-white" style={{ backgroundColor: brandColor }}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-xs font-bold ring-1 ring-white/30">{(shortName || "—").slice(0, 4)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name || "Institution name"}</p>
          <p className="truncate text-[11px] text-white/75">Student portal · powered by Career Design Lab</p>
        </div>
        <Bell className="size-4 text-white/80" />
        <Portrait name="Student preview" avatar={{ skin: 2, hair: "short", hairColor: 0, bg: 0, shirt: 1 }} className="size-7 ring-2 ring-white/30" />
      </div>

      <div className="grid grid-cols-[auto_1fr]">
        {/* Side nav */}
        <nav className="hidden w-32 space-y-0.5 border-r bg-muted/30 p-2 text-[11px] sm:block" aria-hidden="true">
          {[
            { icon: House, label: "Home", active: true },
            { icon: BookOpen, label: "My programs" },
            { icon: CalendarDays, label: "Sessions" },
            { icon: ClipboardCheck, label: "Assignments" },
            { icon: TrendingUp, label: "Progress" },
          ].map((item) => (
            <span
              key={item.label}
              className={cn("flex items-center gap-1.5 rounded-md px-2 py-1.5", item.active ? "font-semibold" : "text-muted-foreground")}
              style={item.active ? { backgroundColor: `${brandColor}14`, color: brandColor } : undefined}
            >
              <item.icon className="size-3.5" />
              {item.label}
            </span>
          ))}
        </nav>

        <div className="col-span-2 min-w-0 space-y-3 p-3 sm:col-span-1">
          <div>
            <p className="text-[13px] font-semibold">Welcome, Aanya 👋</p>
            <p className="text-[11px] text-muted-foreground">
              {departments[0] ?? "Your department"} · Final year · Placement season starts in 3 weeks
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { k: "Programs", v: String(courses.length) },
              { k: "Progress", v: `${avg}%` },
              { k: "Next class", v: "Mon" },
            ].map((s) => (
              <div key={s.k} className="rounded-lg border bg-card px-2 py-1.5">
                <p className="text-[10px] text-muted-foreground">{s.k}</p>
                <p className="text-sm font-semibold">{s.v}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground uppercase">Assigned programs</p>
            {shown.length === 0 ? (
              <p className="rounded-lg border border-dashed px-2 py-3 text-center text-[11px] text-muted-foreground">Programs you select will appear here.</p>
            ) : (
              <ul className="space-y-1.5">
                {shown.map((c, i) => (
                  <li key={c.id} className="flex items-center gap-2 rounded-lg border bg-card px-2 py-1.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md" style={{ backgroundImage: `linear-gradient(135deg, ${c.thumbnail.from}, ${c.thumbnail.to})` }}>
                      <CourseIcon theme={c.thumbnail} className="size-3.5 text-white" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium">{c.title}</p>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${SAMPLE_PROGRESS[i]}%`, backgroundColor: brandColor }} />
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{SAMPLE_PROGRESS[i]}%</span>
                  </li>
                ))}
                {courses.length > shown.length && <li className="text-center text-[10px] text-muted-foreground">+{courses.length - shown.length} more</li>}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px]" style={{ backgroundColor: `${brandColor}12` }}>
            <CalendarDays className="size-3.5 shrink-0" style={{ color: brandColor }} />
            <span className="min-w-0 truncate">
              <span className="font-semibold">Orientation with the placement cell</span> · Mon, 6:00 PM IST
            </span>
          </div>
          {allowInstitutionContent && (
            <p className="text-[10px] text-muted-foreground">Includes a “From your institution” shelf for faculty-uploaded content.</p>
          )}
        </div>
      </div>
    </div>
  );
}
