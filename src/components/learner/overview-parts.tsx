"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  Bell,
  BookOpenCheck,
  CalendarDays,
  Check,
  ClipboardCheck,
  Compass,
  FolderDown,
  History,
  Library,
  LifeBuoy,
  MessagesSquare,
  Receipt,
  Settings,
  Sparkles,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { getAssessment } from "@/data";
import { FORMAT_META, FORMATS } from "@/data/constants";
import { formatDate, relativeDay } from "@/lib/format";
import type { AssessmentResult, DiscoveryResult, LearningFormat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { DemoBadge, FormatBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import type { ActivityItem, ActivityKind } from "./hooks";
import { LEVEL_EXPLAINER } from "./utils";

export function Panel({ title, description, action, children, className, bodyClassName }: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={cn("flex flex-col rounded-2xl border bg-card shadow-xs", className)}>
      <header className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="min-w-0">
          <h2 className="font-heading text-base font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={cn("flex-1 p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function ProfileReminderBanner() {
  const dismissed = useDemoStore((s) => s.profileReminderDismissed);
  const dismiss = useDemoStore((s) => s.dismissProfileReminder);
  if (dismissed) return null;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-info/20 bg-info-soft px-4 py-3 sm:flex-row sm:items-center">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background text-info shadow-xs">
        <History className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">It&apos;s been a while — has your education, job or career situation changed?</p>
        <p className="text-xs text-muted-foreground">Keeping your profile current helps us recommend the right programmes, sessions and mentors.</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button asChild size="sm" className="h-8 px-3">
          <Link href="/dashboard/profile">Update profile</Link>
        </Button>
        <Button size="sm" variant="ghost" className="h-8" onClick={dismiss}>
          <X /> Dismiss
        </Button>
      </div>
    </div>
  );
}

const QUICK_LINKS: { href: string; label: string; hint: string; icon: LucideIcon }[] = [
  { href: "/dashboard/library", label: "Video Library", hint: "All recorded lessons", icon: Library },
  { href: "/dashboard/resources", label: "Learning Resources", hint: "Worksheets & templates", icon: FolderDown },
  { href: "/dashboard/assignments", label: "Assignments & Quizzes", hint: "Due work & feedback", icon: ClipboardCheck },
  { href: "/dashboard/sessions", label: "Live Sessions", hint: "Classes & recordings", icon: CalendarDays },
  { href: "/dashboard/discussions", label: "Discussion & Doubts", hint: "Ask mentors & peers", icon: MessagesSquare },
  { href: "/dashboard/certificates", label: "Certificates", hint: "Completed programmes", icon: Award },
  { href: "/dashboard/notifications", label: "Notifications", hint: "Updates & reminders", icon: Bell },
  { href: "/dashboard/help", label: "FAQs & Helpdesk", hint: "Get support", icon: LifeBuoy },
  { href: "/dashboard/profile", label: "Profile Settings", hint: "Details & preferences", icon: Settings },
  { href: "/dashboard/ai", label: "My Self AI", hint: "Phase 2 preview", icon: Sparkles },
];

export function QuickAccessGrid({ gridClassName }: { gridClassName?: string }) {
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-base font-semibold md:text-lg">Quick access</h2>
      <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5", gridClassName)}>
        {QUICK_LINKS.map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="group flex items-center gap-3 rounded-xl border bg-card p-3 shadow-xs transition hover:border-primary/25 hover:shadow-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", q.href.endsWith("/ai") ? "bg-brand-soft text-brand" : "bg-secondary text-primary")}>
              <q.icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium group-hover:text-primary">{q.label}</span>
              <span className="block truncate text-xs text-muted-foreground">{q.hint}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

const ACTIVITY_ICON: Record<ActivityKind, { icon: LucideIcon; className: string }> = {
  lesson: { icon: BookOpenCheck, className: "bg-brand-soft text-brand" },
  submission: { icon: ClipboardCheck, className: "bg-info-soft text-info" },
  booking: { icon: UserRound, className: "bg-secondary text-primary" },
  order: { icon: Receipt, className: "bg-warning-soft text-warning" },
  result: { icon: Compass, className: "bg-success-soft text-success" },
  thread: { icon: MessagesSquare, className: "bg-muted text-muted-foreground" },
};

export function RecentActivityCard({ items, className }: { items: ActivityItem[]; className?: string }) {
  return (
    <Panel title="Recent activity" description="What you've been up to" className={className}>
      {items.length === 0 ? (
        <EmptyState icon={History} title="No activity yet" description="Start a lesson or book a session — it will show up here." />
      ) : (
        <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-px before:bg-border">
          {items.map((item) => {
            const meta = ACTIVITY_ICON[item.kind];
            return (
              <li key={item.id} className="relative flex gap-3">
                <span className={cn("relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-card", meta.className)}>
                  <meta.icon className="size-3.5" />
                </span>
                <Link href={item.href} className="group min-w-0 flex-1 pt-0.5">
                  <p className="line-clamp-2 text-sm leading-snug font-medium group-hover:text-primary">{item.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {item.detail} · {relativeDay(item.at)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}

/** Interest/strength snapshot from the latest Career Compass result. */
export function CareerSnapshotCard({
  result,
  discovery,
  title = "Career snapshot",
  subjectName,
  className,
}: {
  result?: AssessmentResult;
  discovery?: DiscoveryResult;
  title?: string;
  subjectName?: string;
  className?: string;
}) {
  const assessment = result ? getAssessment(result.assessmentId) : undefined;
  return (
    <Panel
      title={title}
      description={result ? `${assessment?.title} · ${formatDate(result.completedOn)}` : "Discover your interests and strengths"}
      action={<DemoBadge>Illustrative</DemoBadge>}
      className={className}
    >
      {result ? (
        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Top interests</p>
            <div className="flex flex-wrap gap-1.5">
              {result.topInterests.map((t, i) => (
                <span key={t} className={cn("rounded-full px-2.5 py-1 text-xs font-medium", i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-primary")}>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Strengths</p>
            <ul className="grid gap-1 text-sm">
              {result.strengths.slice(0, 3).map((s) => (
                <li key={s} className="flex items-center gap-2">
                  <Check className="size-3.5 text-success" /> {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{subjectName ? `${subjectName} is working on` : "Working on"}</p>
            <div className="flex flex-wrap gap-1.5">
              {result.developmentAreas.slice(0, 3).map((d) => (
                <span key={d} className="rounded-full bg-warning-soft px-2.5 py-1 text-xs font-medium text-warning">
                  {d}
                </span>
              ))}
            </div>
          </div>
          {discovery && (
            <div className="rounded-lg bg-muted/70 px-3 py-2 text-xs">
              <span className="font-medium">From your career discovery: </span>
              <span className="text-muted-foreground">{discovery.headline}</span>
            </div>
          )}
          <Button asChild variant="outline" className="w-full">
            <Link href={`/assessment/report/${result.id}`}>
              View full report <ArrowRight />
            </Link>
          </Button>
        </div>
      ) : (
        <EmptyState
          icon={Compass}
          title="No assessment yet"
          description="Take the 12-minute Career Compass to see your interests and strengths."
          action={
            <Button asChild size="sm">
              <Link href="/assessment/career-compass">Start Career Compass</Link>
            </Button>
          }
        />
      )}
    </Panel>
  );
}

export function LearningLevelCard({ level, mentoringNote, className }: { level?: LearningFormat; mentoringNote?: string; className?: string }) {
  const currentRank = level ? FORMAT_META[level].level : 0;
  return (
    <Panel title="Current learning level" description="Based on your highest active enrolment" className={className}>
      {level ? (
        <div className="space-y-4">
          <FormatBadge format={level} showLevel className="h-7 px-3 text-sm" />
          <p className="text-sm text-muted-foreground">{LEVEL_EXPLAINER[level]}</p>
          <ol className="space-y-2">
            {FORMATS.map((f) => {
              const meta = FORMAT_META[f];
              const state = meta.level < currentRank ? "done" : meta.level === currentRank ? "current" : "next";
              return (
                <li
                  key={f}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-2.5",
                    state === "current" ? "border-brand/40 bg-brand-soft/60" : "bg-card",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      state === "done" && "bg-success-soft text-success",
                      state === "current" && "bg-brand text-brand-foreground",
                      state === "next" && "bg-muted text-muted-foreground",
                    )}
                  >
                    {state === "done" ? <Check className="size-3.5" /> : meta.level}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{meta.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{meta.tagline}</span>
                  </span>
                  {state === "current" && <span className="text-[11px] font-semibold text-brand">You&apos;re here</span>}
                </li>
              );
            })}
          </ol>
          {mentoringNote && <p className="text-xs text-muted-foreground">{mentoringNote}</p>}
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard/mentoring">
              Explore One-to-One Mentoring <ArrowRight />
            </Link>
          </Button>
        </div>
      ) : (
        <EmptyState icon={Library} title="Not enrolled yet" description="Pick a programme to start your learning journey." action={<Button asChild size="sm"><Link href="/courses">Browse courses</Link></Button>} />
      )}
    </Panel>
  );
}
