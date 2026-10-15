"use client";

import { BookOpen, CalendarCheck, CalendarDays, Clapperboard, LayoutDashboard, MessageCircleQuestion, UserRound } from "lucide-react";
import { DEMO_MENTOR_ID } from "@/data/constants";
import { coursesByMentor, getMentor } from "@/data";
import { NavCount, PortalShell, type NavSection } from "@/components/layout/portal-shell";
import { useDemoStore } from "@/store/demo-store";

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  const mentor = getMentor(DEMO_MENTOR_ID)!;
  const myCourseIds = coursesByMentor(DEMO_MENTOR_ID).map((c) => c.id);
  const openQuestions = useDemoStore((s) => s.threads.filter((t) => t.channel === "doubt" && t.status === "unanswered" && myCourseIds.includes(t.courseId)).length);

  const sections: NavSection[] = [
    {
      items: [
        { href: "/mentor", label: "Dashboard", icon: LayoutDashboard, exact: true },
        { href: "/mentor/schedule", label: "Schedule & Availability", icon: CalendarDays },
        { href: "/mentor/bookings", label: "Student Bookings", icon: CalendarCheck },
      ],
    },
    {
      label: "Teaching",
      items: [
        { href: "/mentor/courses", label: "My Courses", icon: BookOpen },
        { href: "/mentor/content", label: "Content Library", icon: Clapperboard },
        {
          href: "/mentor/questions",
          label: "Student Questions",
          icon: MessageCircleQuestion,
          badge: openQuestions ? <NavCount tone="primary">{openQuestions}</NavCount> : undefined,
        },
      ],
    },
    { label: "Account", items: [{ href: "/mentor/profile", label: "Mentor Profile", icon: UserRound }] },
  ];

  return (
    <PortalShell
      portalLabel="Mentor Portal"
      sections={sections}
      user={{ name: mentor.name, subtitle: mentor.title, avatar: mentor.avatar }}
      roles={["mentor"]}
      homeHref="/mentor"
    >
      {children}
    </PortalShell>
  );
}
