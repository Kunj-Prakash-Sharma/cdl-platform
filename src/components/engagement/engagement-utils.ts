import { differenceInMinutes, format, parseISO } from "date-fns";
import {
  Bell,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Megaphone,
  MessagesSquare,
  Mic,
  Presentation,
  Sparkles,
  UserCog,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { DEMO_NOW, DEMO_TODAY } from "@/data/constants";
import type { AppNotification, LiveSession } from "@/lib/types";

export type SessionType = LiveSession["type"];

export const SESSION_TYPE_META: Record<SessionType, { label: string; plural: string; icon: LucideIcon; className: string; blurb: string }> = {
  "cohort-class": {
    label: "Cohort class",
    plural: "Cohort classes",
    icon: Users,
    className: "bg-secondary text-primary ring-primary/15",
    blurb: "Scheduled live classes for your Live Cohort",
  },
  "doubt-clearing": {
    label: "Doubt-clearing",
    plural: "Doubt-clearing hours",
    icon: MessagesSquare,
    className: "bg-brand-soft text-brand ring-brand/25",
    blurb: "Open Q&A with the instructor — bring any question from your programme",
  },
  workshop: {
    label: "Workshop",
    plural: "Workshops",
    icon: Presentation,
    className: "bg-info-soft text-info ring-info/20",
    blurb: "Hands-on practice sessions with live feedback and takeaways",
  },
  webinar: {
    label: "Webinar",
    plural: "Webinars & AMAs",
    icon: Mic,
    className: "bg-warning-soft text-warning ring-warning/25",
    blurb: "Expert talks and ask-me-anything sessions open to everyone",
  },
};

export const SESSION_TYPES = Object.keys(SESSION_TYPE_META) as SessionType[];

/** Workshops, webinars and doubt-clearing hours that any learner can book (not institution-only). */
export const isOpenSession = (s: LiveSession) => s.type !== "cohort-class" && !s.collegeId;

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** "19:00" + 75 → "8:15 PM" */
export function endTime(time: string, durationMin: number) {
  const total = toMinutes(time) + durationMin;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "Starts in 8h 30m" relative to the fixed demo clock (DEMO_NOW). */
export function startsIn(date: string, time: string) {
  const mins = differenceInMinutes(parseISO(`${date}T${time}:00`), parseISO(DEMO_NOW));
  if (mins <= 0) return "Live now";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h >= 24) return `Starts in ${Math.round(h / 24)} days`;
  return `Starts in ${h ? `${h}h ` : ""}${m}m`;
}

/** Relative time against DEMO_NOW: "Just now", "35m ago", "5h ago", "Yesterday", "3 days ago", "2 Oct". */
export function timeAgo(iso: string) {
  const mins = differenceInMinutes(parseISO(DEMO_NOW), parseISO(iso));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const day = iso.slice(0, 10);
  if (day === DEMO_TODAY) return `${Math.floor(mins / 60)}h ago`;
  const days = Math.round((parseISO(DEMO_TODAY).getTime() - parseISO(day).getTime()) / 86_400_000);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return format(parseISO(iso), "d MMM");
}

export const NOTIFICATION_META: Record<AppNotification["kind"], { label: string; filter: string; icon: LucideIcon; className: string }> = {
  session: { label: "Session", filter: "Sessions", icon: CalendarDays, className: "bg-brand-soft text-brand" },
  assignment: { label: "Assignment", filter: "Assignments", icon: ClipboardCheck, className: "bg-warning-soft text-warning" },
  enrollment: { label: "Enrolment", filter: "Enrollments", icon: GraduationCap, className: "bg-success-soft text-success" },
  mentoring: { label: "Mentoring", filter: "Mentoring", icon: UserRound, className: "bg-secondary text-primary" },
  announcement: { label: "Announcement", filter: "Announcements", icon: Megaphone, className: "bg-info-soft text-info" },
  profile: { label: "Profile", filter: "Profile", icon: UserCog, className: "bg-warning-soft text-warning" },
  recommendation: { label: "Recommendation", filter: "Recommendations", icon: Sparkles, className: "bg-brand-soft text-brand" },
};

export const NOTIFICATION_FALLBACK = { icon: Bell, className: "bg-muted text-muted-foreground" };

/** Simple "add to calendar" simulation used by session and mentoring screens. */
export const CALENDAR_TOAST = {
  title: "Added to your calendar",
  description: "A calendar invite (.ics) would be downloaded in the full product — simulated in this prototype.",
};
