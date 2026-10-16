"use client";

import { HelpCircle, MessagesSquare, Signal, SignalHigh, SignalLow } from "lucide-react";
import { getMentor, getUser } from "@/data";
import { StatusPill } from "@/components/shared/badges";
import type { AvatarSpec, DiscussionThread, SupportTicket, ThreadReply } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Stored avatar for a learner or mentor id, if we have one. */
export function avatarFor(id?: string): AvatarSpec | undefined {
  if (!id) return undefined;
  return getUser(id)?.avatar ?? getMentor(id)?.avatar;
}

export function ChannelPill({ channel, className }: { channel: DiscussionThread["channel"]; className?: string }) {
  const doubt = channel === "doubt";
  const Icon = doubt ? HelpCircle : MessagesSquare;
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        doubt ? "bg-info-soft text-info ring-info/20" : "bg-secondary text-primary ring-primary/15",
        className,
      )}
    >
      <Icon className="size-3.5" />
      {doubt ? "Doubt" : "Community"}
    </span>
  );
}

const ROLE_STYLE: Record<ThreadReply["authorRole"], { label: string; className: string }> = {
  learner: { label: "Learner", className: "bg-muted text-muted-foreground" },
  mentor: { label: "Mentor", className: "bg-brand-soft text-brand" },
  admin: { label: "Admin", className: "bg-secondary text-primary" },
};

export function RoleTag({ role }: { role: ThreadReply["authorRole"] }) {
  const s = ROLE_STYLE[role];
  return <span className={cn("rounded px-1.5 py-0.5 text-[10.5px] font-semibold tracking-wide uppercase", s.className)}>{s.label}</span>;
}

const TICKET_STATUS: Record<SupportTicket["status"], { label: string; tone: "info" | "warning" | "success" }> = {
  open: { label: "Open", tone: "info" },
  "in-progress": { label: "In progress", tone: "warning" },
  resolved: { label: "Resolved", tone: "success" },
};

export const TICKET_STATUS_OPTIONS = (Object.keys(TICKET_STATUS) as SupportTicket["status"][]).map((value) => ({
  value,
  label: TICKET_STATUS[value].label,
}));

export function TicketStatusPill({ status }: { status: SupportTicket["status"] }) {
  const s = TICKET_STATUS[status];
  return <StatusPill tone={s.tone}>{s.label}</StatusPill>;
}

const PRIORITY: Record<SupportTicket["priority"], { label: string; tone: "danger" | "warning" | "neutral"; icon: typeof Signal }> = {
  high: { label: "High", tone: "danger", icon: SignalHigh },
  medium: { label: "Medium", tone: "warning", icon: Signal },
  low: { label: "Low", tone: "neutral", icon: SignalLow },
};

export const PRIORITY_RANK: Record<SupportTicket["priority"], number> = { high: 0, medium: 1, low: 2 };

export function PriorityPill({ priority }: { priority: SupportTicket["priority"] }) {
  const p = PRIORITY[priority];
  return (
    <StatusPill tone={p.tone} dot={false}>
      <p.icon className="size-3.5" />
      {p.label}
    </StatusPill>
  );
}
