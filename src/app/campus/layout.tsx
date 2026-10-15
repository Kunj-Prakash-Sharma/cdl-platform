"use client";

import { BookOpen, CalendarDays, ClipboardCheck, LayoutDashboard, TrendingUp } from "lucide-react";
import { DEMO_COLLEGE_ID, DEMO_COLLEGE_STUDENT_ID } from "@/data/constants";
import { getCollegeStudent } from "@/data";
import { PortalShell, type NavSection } from "@/components/layout/portal-shell";
import { useDemoStore } from "@/store/demo-store";

const sections: NavSection[] = [
  {
    items: [
      { href: "/campus", label: "Home", icon: LayoutDashboard, exact: true },
      { href: "/campus/courses", label: "My Programs", icon: BookOpen },
      { href: "/campus/sessions", label: "Live Sessions", icon: CalendarDays },
      { href: "/campus/assignments", label: "Assignments & Quizzes", icon: ClipboardCheck },
      { href: "/campus/progress", label: "My Progress", icon: TrendingUp },
    ],
  },
];

export default function CampusLayout({ children }: { children: React.ReactNode }) {
  const college = useDemoStore((s) => s.colleges.find((c) => c.id === DEMO_COLLEGE_ID))!;
  const student = getCollegeStudent(DEMO_COLLEGE_STUDENT_ID)!;
  return (
    <PortalShell
      portalLabel="Student Portal"
      sections={sections}
      user={{ name: student.name, subtitle: `${student.department} · ${student.year}`, avatar: student.avatar }}
      roles={["college-student"]}
      homeHref="/campus"
      coBrand={{ name: college.name, shortName: college.shortName, color: college.brandColor }}
    >
      {children}
    </PortalShell>
  );
}
