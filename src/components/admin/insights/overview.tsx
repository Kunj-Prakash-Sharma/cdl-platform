"use client";

import { useMemo } from "react";
import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import {
  ArrowRight,
  BadgeIndianRupee,
  BookOpen,
  Building,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  Clapperboard,
  ClipboardCheck,
  Funnel,
  LifeBuoy,
  ListChecks,
  Megaphone,
  PhoneCall,
  Receipt,
  ShoppingBag,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { AutoStatus, DemoBadge } from "@/components/shared/badges";
import { PageHeader, StatCard } from "@/components/shared/page-header";
import {
  assessments,
  enrollments as seedEnrollments,
  funnelDays,
  getCollege,
  getCourse,
  getUser,
  liveSessions,
  platformTotals,
  revenueByMonth,
  stageMix,
  users,
} from "@/data";
import { DEMO_TODAY, STAGE_META } from "@/data/constants";
import { formatCompact, formatINR, formatINRCompact, formatNumber, relativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useCourses, useMentors } from "@/store/hooks";
import { HBarChart, TrendChart } from "./charts";
import { FunnelBars } from "./funnel";
import { dailyPoints, fmtPct, funnelRows, pctDelta, sumDays } from "./metrics";
import { ChartCard, tooltipRow } from "./ui";

type FeedItem = {
  id: string;
  icon: LucideIcon;
  tone: "primary" | "brand" | "warning" | "info" | "danger";
  title: string;
  description: string;
  at: string;
  href: string;
  status?: string;
};

const TONE_CLASS: Record<FeedItem["tone"], string> = {
  primary: "bg-secondary text-primary",
  brand: "bg-brand-soft text-brand",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
  danger: "bg-destructive/10 text-destructive",
};

const revenueConfig = {
  b2c: { label: "B2C learners", color: "var(--chart-1)" },
  b2b: { label: "B2B colleges", color: "var(--chart-2)" },
} satisfies ChartConfig;

const purchasesConfig = { purchases: { label: "Purchases", color: "var(--chart-2)" } } satisfies ChartConfig;

function feedTime(at: string) {
  const day = relativeDay(at);
  return at.includes("T") ? `${day} · ${format(parseISO(at), "h:mm a")}` : day;
}

export function OverviewDashboard() {
  const colleges = useDemoStore((s) => s.colleges);
  const enrollments = useDemoStore((s) => s.enrollments);
  const orders = useDemoStore((s) => s.orders);
  const contentItems = useDemoStore((s) => s.contentItems);
  const tickets = useDemoStore((s) => s.supportTickets);
  const callbacks = useDemoStore((s) => s.callbackRequests);
  const customCourses = useDemoStore((s) => s.customCourses);
  const mentors = useMentors();
  const courses = useCourses();

  const totals30 = useMemo(() => sumDays(funnelDays), []);
  const last7 = useMemo(() => sumDays(funnelDays.slice(-7)), []);
  const prev7 = useMemo(() => sumDays(funnelDays.slice(-14, -7)), []);
  const points = useMemo(() => dailyPoints(funnelDays), []);
  const funnel = useMemo(() => funnelRows(totals30), [totals30]);

  const activeMentors = mentors.filter((m) => m.status === "active").length;
  const pendingMentors = mentors.filter((m) => m.status === "pending-approval").length;
  const published = courses.filter((c) => c.status === "published").length;
  const notPublished = courses.length - published + customCourses.length;
  const activeColleges = colleges.filter((c) => c.status === "active").length;
  const enrollmentCount = platformTotals.enrollments + Math.max(0, enrollments.length - seedEnrollments.length);
  const upcoming = liveSessions.filter((s) => s.date >= DEMO_TODAY && s.status === "scheduled");
  const weekAhead = format(addDays(parseISO(DEMO_TODAY), 7), "yyyy-MM-dd");
  const upcomingWeek = upcoming.filter((s) => s.date <= weekAhead).length;
  const oct = revenueByMonth[revenueByMonth.length - 1];
  const assessmentsAllTime = assessments.reduce((n, a) => n + a.completions, 0);
  const conv30 = (totals30.purchases / totals30.visitors) * 100;
  const conv7 = (last7.purchases / last7.visitors) * 100;
  const convPrev7 = (prev7.purchases / prev7.visitors) * 100;

  const inReview = contentItems.filter((c) => c.status === "in-review");
  const openTickets = tickets.filter((t) => t.status !== "resolved");
  const pendingColleges = colleges.filter((c) => c.status === "pending-review" || c.status === "onboarding");
  const paymentIssues = orders.filter((o) => o.paymentStatus === "failed" || o.paymentStatus === "pending");
  const openCallbacks = callbacks.filter((c) => c.status === "requested");

  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];
    [...orders]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 4)
      .forEach((o) => {
        const who = getUser(o.userId)?.name ?? getCollege(o.userId)?.name ?? "Guest checkout";
        items.push({
          id: `o-${o.id}`,
          icon: ShoppingBag,
          tone: o.paymentStatus === "paid" ? "brand" : "danger",
          title: `Order ${o.id} · ${formatINR(o.total)}`,
          description: `${who} — ${o.items[0]?.title ?? "Order"}`,
          at: o.createdAt,
          href: "/admin/enrollments",
          status: o.paymentStatus,
        });
      });
    [...users]
      .sort((a, b) => b.joinedOn.localeCompare(a.joinedOn))
      .slice(0, 3)
      .forEach((u) =>
        items.push({
          id: `u-${u.id}`,
          icon: UserPlus,
          tone: "primary",
          title: `New sign-up: ${u.name}`,
          description: `${STAGE_META[u.stage].label} · ${u.city} · profile ${u.profileCompletion}% complete`,
          at: u.joinedOn,
          href: "/admin/users",
          status: u.status,
        }),
      );
    [...inReview]
      .sort((a, b) => b.uploadedOn.localeCompare(a.uploadedOn))
      .slice(0, 2)
      .forEach((c) =>
        items.push({
          id: `c-${c.id}`,
          icon: Clapperboard,
          tone: "warning",
          title: "Video awaiting approval",
          description: `${c.title} · ${getCourse(c.courseId)?.title ?? "Course"}`,
          at: c.uploadedOn,
          href: "/admin/content",
          status: c.status,
        }),
      );
    [...openTickets]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 2)
      .forEach((t) =>
        items.push({
          id: `t-${t.id}`,
          icon: LifeBuoy,
          tone: t.priority === "high" ? "danger" : "info",
          title: `Support ticket ${t.id} · ${t.priority} priority`,
          description: `${t.userName}: ${t.subject}`,
          at: t.createdAt,
          href: "/admin/community",
          status: t.status,
        }),
      );
    callbacks.slice(0, 3).forEach((c) =>
      items.push({
        id: `cb-${c.id}`,
        icon: PhoneCall,
        tone: "warning",
        title: `Callback requested: ${c.name}`,
        description: `${c.topic} · prefers ${c.preferredTime}`,
        at: c.createdAt,
        href: "/admin/conversations",
        status: c.status,
      }),
    );
    return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 9);
  }, [orders, inReview, openTickets, callbacks]);

  const attention = [
    { label: "Videos awaiting approval", count: inReview.length, href: "/admin/content", icon: Clapperboard },
    { label: "Open support tickets", count: openTickets.length, href: "/admin/community", icon: LifeBuoy },
    { label: "New callback requests", count: openCallbacks.length, href: "/admin/conversations", icon: PhoneCall },
    { label: "Mentors pending approval", count: pendingMentors, href: "/admin/mentors", icon: UserCheck },
    { label: "Colleges onboarding / in review", count: pendingColleges.length, href: "/admin/colleges", icon: Building },
    { label: "Pending or failed payments", count: paymentIssues.length, href: "/admin/enrollments", icon: Receipt },
  ];

  const revenueData = revenueByMonth.map((r, i) => ({ ...r, month: i === revenueByMonth.length - 1 ? `${r.month} (MTD)` : r.month }));
  const totalStage = stageMix.reduce((n, s) => n + s.learners, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Admin console · Thursday, 15 October 2026"
        title="Platform overview"
        description="Learners, colleges, mentors, revenue and the visitor-to-purchase funnel at a glance."
        actions={
          <>
            <DemoBadge>All metrics are synthetic demo data</DemoBadge>
            <Button asChild variant="outline" className="h-9">
              <Link href="/admin/conversations">
                <Funnel /> Conversion analytics
              </Link>
            </Button>
          </>
        }
      />

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total users" value={formatNumber(platformTotals.users)} icon={Users} trend="+4.8%" hint="vs last month" />
        <StatCard
          label="Active learners"
          value={formatNumber(platformTotals.activeLearners)}
          icon={BookOpen}
          accent="brand"
          hint={`${Math.round((platformTotals.activeLearners / platformTotals.users) * 100)}% of users · 30 days`}
        />
        <StatCard label="Colleges" value={colleges.length} icon={Building} accent="info" hint={`${activeColleges} active · ${colleges.length - activeColleges} onboarding / review`} />
        <StatCard label="Mentors" value={`${activeMentors} active`} icon={UserCheck} accent="success" hint={pendingMentors ? `${pendingMentors} pending approval` : "None pending approval"} />
        <StatCard label="Published courses" value={published} icon={ListChecks} hint={`${notPublished} draft / in review / unpublished`} />
        <StatCard label="Enrollments" value={formatNumber(enrollmentCount)} icon={ClipboardCheck} accent="brand" trend="+6.1%" hint="vs last month" />
        <StatCard label="Upcoming sessions" value={upcoming.length} icon={CalendarDays} accent="info" hint={`${upcomingWeek} in the next 7 days`} />
        <StatCard
          label="Revenue (MTD, sample)"
          value={formatINRCompact(platformTotals.revenueMtd)}
          icon={BadgeIndianRupee}
          accent="success"
          hint={`B2C ${formatINRCompact(oct.b2c)} · B2B ${formatINRCompact(oct.b2b)}`}
        />
        <StatCard
          label="Career assessments"
          value={formatNumber(totals30.assessments)}
          icon={ListChecks}
          accent="warning"
          hint={`Completed in 30 days · ${formatCompact(assessmentsAllTime)} all-time`}
        />
        <StatCard
          label="Visitor → purchase"
          value={fmtPct(conv30, 2)}
          icon={Funnel}
          accent="brand"
          trend={pctDelta(conv7, convPrev7)}
          hint="last 7 days vs prior 7"
        />
      </div>

      {/* Trend + funnel */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Visitors, conversations & purchases"
          description="Daily, last 30 days (16 Sep – 15 Oct). Purchases sit on their own scale below."
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/analytics">
                Analytics <ArrowRight />
              </Link>
            </Button>
          }
        >
          <TrendChart
            points={points}
            granularity="daily"
            className="h-56"
            series={[
              { key: "visitors", label: "Visitors", color: "var(--chart-1)" },
              { key: "conversations", label: "Conversations started", color: "var(--chart-3)" },
            ]}
          />
          <div className="mt-3 border-t pt-3">
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="font-medium text-foreground">Purchases per day</span>
              <span className="text-muted-foreground tabular-nums">{formatNumber(totals30.purchases)} in 30 days</span>
            </div>
            <ChartContainer config={purchasesConfig} className="aspect-auto h-24 w-full">
              <BarChart data={points} margin={{ left: 0, right: 8, top: 4, bottom: 0 }} barCategoryGap={2}>
                <XAxis dataKey="label" hide />
                <YAxis tickLine={false} axisLine={false} width={40} tickCount={3} />
                <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent formatter={tooltipRow({ purchases: "Purchases" }, formatNumber)} />} />
                <Bar isAnimationActive={false} dataKey="purchases" fill="var(--color-purchases)" radius={[3, 3, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ChartContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Conversion funnel"
          description="Last 30 days · step conversion shown on the right"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/conversations">
                Details <ArrowRight />
              </Link>
            </Button>
          }
          footer={
            <span>
              <span className="font-semibold text-foreground">{fmtPct(conv30, 2)}</span> of visitors complete a purchase. Biggest leak inside the conversation:
              the open-text <span className="font-medium text-foreground">Background</span> question.
            </span>
          }
        >
          <FunnelBars rows={funnel} compact />
        </ChartCard>
      </div>

      {/* Revenue + stage mix */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Revenue by month"
          description="Sample revenue, April – October 2026 (October is month-to-date). Payments are simulated."
          action={<DemoBadge>Sample revenue</DemoBadge>}
        >
          <ChartContainer config={revenueConfig} className="aspect-auto h-72 w-full">
            <BarChart data={revenueData} margin={{ left: 0, right: 8, top: 8 }} barCategoryGap="32%">
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => formatINRCompact(v)} />
              <ChartTooltip
                cursor={{ fillOpacity: 0.4 }}
                content={<ChartTooltipContent formatter={tooltipRow({ b2c: "B2C learners", b2b: "B2B colleges" }, formatINRCompact)} />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar isAnimationActive={false} dataKey="b2c" stackId="rev" fill="var(--color-b2c)" stroke="var(--card)" strokeWidth={2} maxBarSize={44} />
              <Bar isAnimationActive={false} dataKey="b2b" stackId="rev" fill="var(--color-b2b)" stroke="var(--card)" strokeWidth={2} radius={[4, 4, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard title="Learner stage mix" description={`${formatNumber(totalStage)} learners by current stage`}>
          <HBarChart
            label="Learners"
            categoryWidth={132}
            data={stageMix.map((s) => ({ name: STAGE_META[s.stage].plural, value: s.learners }))}
          />
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {stageMix.map((s) => (
              <li key={s.stage} className="flex justify-between gap-2">
                <span className="truncate">{STAGE_META[s.stage].plural}</span>
                <span className="font-medium text-foreground tabular-nums">{Math.round((s.learners / totalStage) * 100)}%</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>

      {/* Activity + attention */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Recent activity" description="Orders, sign-ups, content and support across the platform">
          <ul className="-my-1 divide-y">
            {feed.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="group flex items-start gap-3 rounded-lg px-1 py-3 transition-colors hover:bg-muted/60">
                  <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", TONE_CLASS[item.tone])}>
                    <item.icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
                  </span>
                  <span className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                    {item.status && <AutoStatus status={item.status} />}
                    <span className="text-[11px] text-muted-foreground">{feedTime(item.at)}</span>
                  </span>
                  <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground/50 transition group-hover:translate-x-0.5 sm:hidden" />
                </Link>
              </li>
            ))}
          </ul>
        </ChartCard>

        <div className="space-y-4">
          <ChartCard title="Needs attention" description="Items waiting on an admin">
            <ul className="-my-1 space-y-0.5">
              {attention.map((a) => (
                <li key={a.label}>
                  <Link href={a.href} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted">
                    <a.icon className="size-4 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{a.label}</span>
                    <span
                      className={cn(
                        "min-w-6 rounded-full px-1.5 text-center text-xs leading-5 font-semibold tabular-nums",
                        a.count ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {a.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </ChartCard>

          <ChartCard title="Quick actions">
            <div className="grid gap-2">
              <QuickAction href="/admin/content" icon={Clapperboard} title="Review content" description={`${inReview.length} video${inReview.length === 1 ? "" : "s"} awaiting approval`} />
              <QuickAction href="/admin/colleges/new" icon={Building} title="Onboard a college" description="5-step guided setup with portal preview" />
              <QuickAction href="/admin/notifications" icon={Megaphone} title="Send a notification" description="Announce to learners, colleges or mentors" />
            </div>
          </ChartCard>

          {openCallbacks.length === 0 && callbacks.length === 0 && (
            <p className="flex items-start gap-2 px-1 text-xs text-muted-foreground">
              <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
              Callback requests from the free career discovery chat appear in the activity feed as they arrive.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, title, description }: { href: string; icon: LucideIcon; title: string; description: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-xl border bg-background p-3 transition hover:border-primary/30 hover:shadow-xs">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{description}</span>
      </span>
      <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}
