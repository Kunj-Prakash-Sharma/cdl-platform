"use client";

import {
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FolderDown,
  LayoutDashboard,
  Library,
  LifeBuoy,
  ListChecks,
  MessagesSquare,
  Receipt,
  Settings,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { STAGE_META } from "@/data/constants";
import { NavCount, PortalShell, type NavSection } from "@/components/layout/portal-shell";
import { useCurrentUser, useUnreadCount } from "@/store/hooks";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isParent } = useCurrentUser();
  const unread = useUnreadCount();

  const sections: NavSection[] = [
    {
      items: [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
        { href: "/dashboard/learning", label: "My Learning", icon: BookOpen },
        { href: "/dashboard/development", label: "My Development", icon: Target },
        { href: "/dashboard/assessments", label: "Assessments", icon: ListChecks },
      ],
    },
    {
      label: "Learn",
      items: [
        { href: "/dashboard/library", label: "Video Library", icon: Library },
        { href: "/dashboard/resources", label: "Learning Resources", icon: FolderDown },
        { href: "/dashboard/assignments", label: "Assignments & Quizzes", icon: ClipboardCheck },
        { href: "/dashboard/sessions", label: "Live Sessions", icon: CalendarDays },
        { href: "/dashboard/mentoring", label: "One-to-One Mentoring", icon: UserRound },
        { href: "/dashboard/discussions", label: "Discussions & Doubts", icon: MessagesSquare },
        { href: "/dashboard/certificates", label: "Certificates", icon: Award },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/dashboard/notifications", label: "Notifications", icon: Bell, badge: unread ? <NavCount tone="primary">{unread}</NavCount> : undefined },
        { href: "/dashboard/orders", label: "Purchases", icon: Receipt },
        { href: "/dashboard/help", label: "FAQs & Helpdesk", icon: LifeBuoy },
        { href: "/dashboard/profile", label: "Profile Settings", icon: Settings },
      ],
    },
    {
      label: "Phase 2 preview",
      items: [{ href: "/dashboard/ai", label: "My Self AI", icon: Sparkles, badge: <NavCount tone="brand">Soon</NavCount> }],
    },
  ];

  return (
    <PortalShell
      portalLabel={isParent ? "My Self · Parent" : "My Self"}
      sections={sections}
      user={{ name: user.name, subtitle: isParent ? `Parent of ${user.childName ?? "learner"}` : STAGE_META[user.stage].label, avatar: user.avatar }}
      roles={["learner", "parent"]}
      homeHref="/dashboard"
      notificationsHref="/dashboard/notifications"
      unreadCount={unread}
    >
      {children}
    </PortalShell>
  );
}
