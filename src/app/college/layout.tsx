"use client";

import { BookOpen, CalendarDays, ChartColumn, Clapperboard, LayoutDashboard, MonitorPlay, Users } from "lucide-react";
import { DEMO_COLLEGE_ID } from "@/data/constants";
import { PortalShell, type NavSection } from "@/components/layout/portal-shell";
import { useDemoStore } from "@/store/demo-store";

const sections: NavSection[] = [
  {
    items: [
      { href: "/college", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/college/programs", label: "Assigned Programs", icon: BookOpen },
      { href: "/college/students", label: "Students", icon: Users },
      { href: "/college/cohorts", label: "Cohorts & Sessions", icon: CalendarDays },
      { href: "/college/content", label: "College Content", icon: Clapperboard },
      { href: "/college/reports", label: "Engagement Reports", icon: ChartColumn },
    ],
  },
  {
    label: "Student experience",
    items: [{ href: "/campus", label: "Student portal preview", icon: MonitorPlay }],
  },
];

export default function CollegeLayout({ children }: { children: React.ReactNode }) {
  const college = useDemoStore((s) => s.colleges.find((c) => c.id === DEMO_COLLEGE_ID))!;
  return (
    <PortalShell
      portalLabel="College Portal"
      sections={sections}
      user={{ name: college.contactName, subtitle: "Training & Placement Officer", avatar: { skin: 2, hair: "short", hairColor: 3, bg: 3, shirt: 7, glasses: true } }}
      roles={["college-admin"]}
      homeHref="/college"
      coBrand={{ name: college.name, shortName: college.shortName, color: college.brandColor }}
    >
      {children}
    </PortalShell>
  );
}
