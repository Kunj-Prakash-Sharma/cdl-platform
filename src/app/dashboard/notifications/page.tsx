"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, subDays } from "date-fns";
import { BellOff, BellRing, CheckCheck, ChevronRight, UserCog } from "lucide-react";
import { toast } from "sonner";
import { DEMO_TODAY } from "@/data/constants";
import type { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useCurrentUser } from "@/store/hooks";
import { NOTIFICATION_META, timeAgo } from "@/components/engagement/engagement-utils";
import { EmptyState, PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

type FilterKey = "all" | "unread" | AppNotification["kind"];

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "session", label: "Sessions" },
  { key: "assignment", label: "Assignments" },
  { key: "enrollment", label: "Enrollments" },
  { key: "mentoring", label: "Mentoring" },
  { key: "announcement", label: "Announcements" },
  { key: "profile", label: "Profile" },
  { key: "recommendation", label: "Recommendations" },
];

const CHANNELS = [
  { id: "inapp", label: "In-app", hint: "Always on in the dashboard", locked: true },
  { id: "email", label: "Email", hint: "Session reminders & receipts" },
  { id: "whatsapp", label: "WhatsApp", hint: "Live class reminders 1 hour before" },
  { id: "sms", label: "SMS", hint: "Only critical account alerts" },
];

const YESTERDAY = format(subDays(parseISO(DEMO_TODAY), 1), "yyyy-MM-dd");

function groupOf(n: AppNotification) {
  const day = n.createdAt.slice(0, 10);
  if (day >= DEMO_TODAY) return "Today";
  if (day === YESTERDAY) return "Yesterday";
  return "Earlier";
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const notifications = useDemoStore((s) => s.notifications);
  const markRead = useDemoStore((s) => s.markNotificationRead);
  const markAll = useDemoStore((s) => s.markAllNotificationsRead);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ inapp: true, email: true, whatsapp: true, sms: false });

  const sorted = useMemo(() => [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [notifications]);
  const unread = sorted.filter((n) => !n.read).length;
  const count = (k: FilterKey) => (k === "all" ? sorted.length : k === "unread" ? unread : sorted.filter((n) => n.kind === k).length);
  const showPinned = filter === "all" || filter === "unread" || filter === "profile";
  const pinned = showPinned ? sorted.filter((n) => n.kind === "profile" && !n.read) : [];
  const list = sorted
    .filter((n) => (filter === "all" ? true : filter === "unread" ? !n.read : n.kind === filter))
    .filter((n) => !pinned.includes(n));
  const groups = (["Today", "Yesterday", "Earlier"] as const).map((g) => ({ label: g, items: list.filter((n) => groupOf(n) === g) })).filter((g) => g.items.length);

  const open = (n: AppNotification) => {
    markRead(n.id);
    if (n.href) router.push(n.href);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Notifications"
        description="Session reminders, assignment deadlines, mentoring updates, announcements and recommendations — all in one place."
        actions={
          <Button
            variant="outline"
            className="h-9"
            disabled={!unread}
            onClick={() => {
              markAll();
              toast.success("All caught up", { description: "Every notification is marked as read." });
            }}
          >
            <CheckCheck /> Mark all as read
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
            {FILTERS.map((f) => {
              const n = count(f.key);
              return (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium whitespace-nowrap transition",
                    filter === f.key ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {f.label}
                  <span className={cn("text-xs tabular-nums", filter === f.key ? "text-primary-foreground/75" : "text-muted-foreground/80")}>{n}</span>
                </button>
              );
            })}
          </div>

          {pinned.map((n) => (
            <div key={n.id} className="relative overflow-hidden rounded-2xl border border-warning/30 bg-gradient-to-br from-warning-soft via-card to-card p-5 shadow-xs">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning text-white shadow-xs">
                  <UserCog className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold tracking-wide text-warning uppercase">Action needed · Profile</p>
                  <p className="font-heading font-semibold">{n.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={user.profileCompletion} className="h-1.5 max-w-40 [&>[data-slot=progress-indicator]]:bg-warning" />
                    <span className="text-xs text-muted-foreground">Profile {user.profileCompletion}% complete</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      markRead(n.id);
                      toast("We'll remind you later", { description: "You can update your profile anytime from Profile Settings." });
                    }}
                  >
                    Later
                  </Button>
                  <Button onClick={() => open(n)}>Update profile</Button>
                </div>
              </div>
            </div>
          ))}

          {groups.length === 0 && pinned.length > 0 ? null : groups.length === 0 ? (
            <EmptyState
              icon={filter === "unread" ? CheckCheck : BellOff}
              title={filter === "unread" ? "You're all caught up" : "No notifications here"}
              description={filter === "unread" ? "New reminders and updates will appear here." : "Nothing in this category yet."}
              action={
                filter !== "all" ? (
                  <Button variant="outline" onClick={() => setFilter("all")}>
                    Show all notifications
                  </Button>
                ) : undefined
              }
            />
          ) : (
            groups.map((g) => (
              <section key={g.label} className="space-y-2">
                <h2 className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{g.label}</h2>
                <ul className="divide-y overflow-hidden rounded-2xl border bg-card shadow-xs">
                  {g.items.map((n) => {
                    const meta = NOTIFICATION_META[n.kind];
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => open(n)}
                          className={cn(
                            "group flex w-full items-start gap-3.5 px-4 py-3.5 text-left transition hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none sm:px-5",
                            !n.read && "bg-secondary/40",
                          )}
                        >
                          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", meta.className)}>
                            <meta.icon className="size-4.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-3">
                              <span className={cn("text-sm leading-snug", n.read ? "font-medium" : "font-semibold")}>{n.title}</span>
                              <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
                                {g.label === "Earlier" ? format(parseISO(n.createdAt), "d MMM") : timeAgo(n.createdAt)}
                              </span>
                            </span>
                            <span className="mt-0.5 block text-sm text-muted-foreground">{n.body}</span>
                            <span className="mt-1.5 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                              <span>{meta.label}</span>
                              {n.href && (
                                <span className="inline-flex items-center gap-0.5 text-primary opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                                  Open <ChevronRight className="size-3" />
                                </span>
                              )}
                            </span>
                          </span>
                          {!n.read && <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <BellRing className="size-5" />
              </span>
              <div>
                <p className="font-heading text-2xl leading-none font-semibold tabular-nums">{unread}</p>
                <p className="text-xs text-muted-foreground">unread of {sorted.length}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Announcements from the CDL team and updates from your mentors appear here as soon as they&apos;re sent.</p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-xs">
            <p className="text-sm font-semibold">Delivery preferences</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Choose how we reach you (demo only — nothing is sent).</p>
            <ul className="mt-4 space-y-3.5">
              {CHANNELS.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3">
                  <Label htmlFor={`pref-${c.id}`} className="flex flex-col items-start gap-0.5 font-normal">
                    <span className="text-sm font-medium">{c.label}</span>
                    <span className="text-xs text-muted-foreground">{c.hint}</span>
                  </Label>
                  <Switch
                    id={`pref-${c.id}`}
                    checked={prefs[c.id]}
                    disabled={c.locked}
                    onCheckedChange={(v) => {
                      setPrefs((p) => ({ ...p, [c.id]: v }));
                      toast.success(`${c.label} notifications ${v ? "on" : "off"}`);
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
