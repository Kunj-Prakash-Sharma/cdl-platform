"use client";

import {
  Award,
  BookOpen,
  Building,
  CalendarDays,
  ChartColumn,
  Clapperboard,
  Funnel,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  MessagesSquare,
  Receipt,
  Tag,
  UserCheck,
  Users,
} from "lucide-react";
import { NavCount, PortalShell, type NavSection } from "@/components/layout/portal-shell";
import { useDemoStore } from "@/store/demo-store";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const inReview = useDemoStore((s) => s.contentItems.filter((c) => c.status === "in-review").length);
  const openTickets = useDemoStore((s) => s.supportTickets.filter((t) => t.status !== "resolved").length);

  const sections: NavSection[] = [
    { items: [{ href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true }] },
    {
      label: "Insights",
      items: [
        { href: "/admin/conversations", label: "Conversion & Conversations", icon: Funnel },
        { href: "/admin/analytics", label: "Analytics", icon: ChartColumn },
      ],
    },
    {
      label: "People",
      items: [
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/colleges", label: "Colleges", icon: Building },
        { href: "/admin/mentors", label: "Mentors", icon: UserCheck },
      ],
    },
    {
      label: "Content",
      items: [
        { href: "/admin/courses", label: "Courses", icon: BookOpen },
        { href: "/admin/content", label: "Video Library", icon: Clapperboard, badge: inReview ? <NavCount tone="primary">{inReview}</NavCount> : undefined },
        { href: "/admin/assessments", label: "Assessments", icon: ListChecks },
        { href: "/admin/sessions", label: "Live Sessions", icon: CalendarDays },
      ],
    },
    {
      label: "Commerce",
      items: [
        { href: "/admin/pricing", label: "Pricing & Promos", icon: Tag },
        { href: "/admin/enrollments", label: "Enrollments & Orders", icon: Receipt },
      ],
    },
    {
      label: "Engagement",
      items: [
        { href: "/admin/community", label: "Community & Support", icon: MessagesSquare, badge: openTickets ? <NavCount>{openTickets}</NavCount> : undefined },
        { href: "/admin/certificates", label: "Certificates", icon: Award },
        { href: "/admin/notifications", label: "Notifications", icon: Megaphone },
      ],
    },
  ];

  return (
    <PortalShell
      portalLabel="Admin Console"
      sections={sections}
      user={{ name: "Aditi Kulkarni", subtitle: "Platform Administrator", avatar: { skin: 1, hair: "bun", hairColor: 1, bg: 5, shirt: 0 } }}
      roles={["admin"]}
      homeHref="/admin"
    >
      {children}
    </PortalShell>
  );
}
