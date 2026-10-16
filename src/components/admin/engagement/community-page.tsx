"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Clock3, Flag, HelpCircle, LifeBuoy, MessageSquareReply, ThumbsUp, UserCheck } from "lucide-react";
import { getMentor, getUser } from "@/data";
import { formatDate } from "@/lib/format";
import type { SupportTicket } from "@/lib/types";
import { useDemoStore } from "@/store/demo-store";
import { useMentors } from "@/store/hooks";
import { EmptyState, PageHeader, StatCard } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DemoBadge } from "@/components/shared/badges";
import {
  ClearFiltersButton,
  DetailRow,
  Field,
  FilterBar,
  FilterSelect,
  InfoNote,
  ResultsMeta,
  SearchField,
  TableCard,
  TableEmptyRow,
} from "@/components/admin/content/admin-kit";
import { DiscussionsTab } from "./discussions-tab";
import { AVG_FIRST_RESPONSE, ageHours, ageLabel } from "./engagement-data";
import { useEngagementStore } from "./engagement-store";
import { avatarFor, PRIORITY_RANK, PriorityPill, TICKET_STATUS_OPTIONS, TicketStatusPill } from "./engagement-ui";
import { ThreadSheet, threadContext } from "./thread-sheet";

const CATEGORY_OPTIONS: SupportTicket["category"][] = ["Account", "Payments", "Course access", "Live sessions", "Certificates", "Other"];

export function CommunityPage() {
  const threads = useDemoStore((s) => s.threads);
  const tickets = useDemoStore((s) => s.supportTickets);
  const [tab, setTab] = useState("discussions");

  const stats = useMemo(
    () => ({
      flagged: threads.filter((t) => t.flagged).length,
      doubts: threads.filter((t) => t.channel === "doubt" && t.status === "unanswered").length,
      open: tickets.filter((t) => t.status !== "resolved").length,
      high: tickets.filter((t) => t.status !== "resolved" && t.priority === "high").length,
    }),
    [threads, tickets],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Engagement"
        title="Community & Support"
        description="Moderate course discussions, route unanswered doubts to mentors and resolve learner support requests."
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Flagged posts" value={stats.flagged} icon={Flag} accent="warning" hint={stats.flagged ? "Need moderation" : "Nothing flagged"} />
        <StatCard label="Unanswered doubts" value={stats.doubts} icon={HelpCircle} accent="info" hint="Across all courses" />
        <StatCard label="Open support requests" value={stats.open} icon={LifeBuoy} hint={`${stats.high} high priority`} />
        <StatCard label="Avg first response" value={AVG_FIRST_RESPONSE} icon={Clock3} accent="brand" hint={<DemoBadge className="h-5">Illustrative</DemoBadge>} />
      </div>
      <InfoNote>Moderation and ticket changes are shared with the learner portal — removed posts and replies disappear there too.</InfoNote>
      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList className="h-9!">
          <TabsTrigger value="discussions" className="px-3">
            Discussions moderation
          </TabsTrigger>
          <TabsTrigger value="doubts" className="px-3">
            Doubts queue
            <span className="ml-1 rounded-full bg-info-soft px-1.5 text-[11px] font-semibold text-info tabular-nums">{stats.doubts}</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="px-3">
            Support requests
            <span className="ml-1 rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground tabular-nums">{stats.open}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="discussions">
          <DiscussionsTab />
        </TabsContent>
        <TabsContent value="doubts">
          <DoubtsQueue />
        </TabsContent>
        <TabsContent value="support">
          <SupportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DoubtsQueue() {
  const threads = useDemoStore((s) => s.threads);
  const assignments = useEngagementStore((s) => s.doubtAssignments);
  const assignDoubt = useEngagementStore((s) => s.assignDoubt);
  const mentors = useMentors();
  const [openId, setOpenId] = useState<string | null>(null);
  const [picks, setPicks] = useState<Record<string, string>>({});

  const queue = useMemo(
    () => threads.filter((t) => t.channel === "doubt" && t.status === "unanswered").sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [threads],
  );

  if (!queue.length) {
    return <EmptyState icon={HelpCircle} title="No unanswered doubts" description="Every doubt has a reply. New questions from learners appear here." />;
  }

  return (
    <>
      <ul className="grid gap-3 lg:grid-cols-2">
        {queue.map((t) => {
          const { course, lesson } = threadContext(t);
          const assigned = assignments[t.id];
          const pick = picks[t.id] ?? assigned ?? course?.instructorId ?? "";
          const overdue = ageHours(t.createdAt) > 24;
          return (
            <li key={t.id} className="flex flex-col rounded-2xl border bg-card p-4 shadow-xs">
              <div className="flex items-start gap-3">
                <Portrait avatar={avatarFor(t.authorId)} name={t.authorName} className="size-9" />
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => setOpenId(t.id)} className="text-left text-sm leading-snug font-medium hover:text-primary hover:underline">
                    {t.title}
                  </button>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {t.authorName} · {course?.title}
                    {lesson ? ` · ${lesson.title}` : ""}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${overdue ? "bg-destructive/10 text-destructive" : "bg-warning-soft text-warning"}`}>
                  {ageLabel(t.createdAt)} old
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-[13px] text-muted-foreground">{t.body}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                <span className="mr-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ThumbsUp className="size-3.5" /> {t.upvotes}
                  {assigned && (
                    <span className="ml-2 inline-flex items-center gap-1 font-medium text-brand">
                      <UserCheck className="size-3.5" /> {getMentor(assigned)?.name}
                    </span>
                  )}
                </span>
                <Select value={pick || undefined} onValueChange={(v) => setPicks((p) => ({ ...p, [t.id]: v }))}>
                  <SelectTrigger size="sm" className="w-40" aria-label="Mentor to assign">
                    <SelectValue placeholder="Choose mentor" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentors
                      .filter((m) => m.status === "active")
                      .map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  disabled={!pick}
                  onClick={() => {
                    assignDoubt(t.id, pick);
                    toast.success(`Assigned to ${getMentor(pick)?.name}`, { description: "They'll see it in Mentor Portal → Student questions (simulated)." });
                  }}
                >
                  {assigned ? "Reassign" : "Assign to mentor"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setOpenId(t.id)}>
                  View
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <ThreadSheet threadId={openId} onOpenChange={(o) => !o && setOpenId(null)} />
    </>
  );
}

function SupportTab() {
  const tickets = useDemoStore((s) => s.supportTickets);
  const setTicketStatus = useDemoStore((s) => s.setTicketStatus);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [priority, setPriority] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return tickets
      .filter((t) => (status === "all" || t.status === status) && (category === "all" || t.category === category) && (priority === "all" || t.priority === priority))
      .filter((t) => !term || `${t.id} ${t.subject} ${t.userName} ${t.description}`.toLowerCase().includes(term))
      .sort((a, b) => Number(a.status === "resolved") - Number(b.status === "resolved") || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.createdAt.localeCompare(a.createdAt));
  }, [tickets, q, status, category, priority]);
  const hasFilters = q !== "" || status !== "all" || category !== "all" || priority !== "all";
  const reset = () => {
    setQ("");
    setStatus("all");
    setCategory("all");
    setPriority("all");
  };
  const changeStatus = (t: SupportTicket, s: SupportTicket["status"]) => {
    setTicketStatus(t.id, s);
    toast.success(`${t.id} → ${TICKET_STATUS_OPTIONS.find((o) => o.value === s)?.label}`, { description: t.subject });
  };
  const open = tickets.find((t) => t.id === openId);

  return (
    <div className="space-y-3">
      <FilterBar right={<ResultsMeta shown={rows.length} total={tickets.length} noun="requests" onReset={reset} />}>
        <SearchField value={q} onChange={setQ} placeholder="Search ID, subject, learner…" label="Search support requests" />
        <FilterSelect label="Status" allLabel="All statuses" value={status} onValueChange={setStatus} options={TICKET_STATUS_OPTIONS} className="sm:w-36" />
        <FilterSelect label="Category" allLabel="All categories" value={category} onValueChange={setCategory} options={CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }))} />
        <FilterSelect
          label="Priority"
          allLabel="Any priority"
          value={priority}
          onValueChange={setPriority}
          options={[
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" },
          ]}
          className="sm:w-36"
        />
        <ClearFiltersButton visible={hasFilters} onClick={reset} />
      </FilterBar>
      <TableCard>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Request</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && <TableEmptyRow colSpan={6} icon={LifeBuoy} />}
            {rows.map((t) => (
              <TableRow key={t.id} className="cursor-pointer" onClick={() => setOpenId(t.id)}>
                <TableCell>
                  <div className="min-w-[240px]">
                    <p className="font-medium">{t.subject}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{t.id}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Portrait avatar={avatarFor(t.userId)} name={t.userName} className="size-7" />
                    <span className="text-[13px] whitespace-nowrap">{t.userName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-[13px] whitespace-nowrap text-muted-foreground">{t.category}</TableCell>
                <TableCell>
                  <PriorityPill priority={t.priority} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select value={t.status} onValueChange={(v) => changeStatus(t, v as SupportTicket["status"])}>
                    <SelectTrigger size="sm" className="w-32" aria-label={`Status of ${t.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TICKET_STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{ageLabel(t.updatedAt)} ago</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full gap-0 p-0 data-[side=right]:sm:max-w-xl">{open && <TicketDetail key={open.id} ticket={open} onStatus={(s) => changeStatus(open, s)} />}</SheetContent>
      </Sheet>
    </div>
  );
}

function TicketDetail({ ticket, onStatus }: { ticket: SupportTicket; onStatus: (s: SupportTicket["status"]) => void }) {
  const replies = useEngagementStore((s) => s.ticketReplies[ticket.id]);
  const addTicketReply = useEngagementStore((s) => s.addTicketReply);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string>();
  const user = getUser(ticket.userId);

  return (
    <>
      <SheetHeader className="border-b px-5 pt-5 pb-4 pr-12">
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          <TicketStatusPill status={ticket.status} />
          <PriorityPill priority={ticket.priority} />
        </div>
        <SheetTitle className="text-lg font-semibold">{ticket.subject}</SheetTitle>
        <SheetDescription>
          <span className="font-mono">{ticket.id}</span> · {ticket.category}
        </SheetDescription>
      </SheetHeader>
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
          <Portrait avatar={user?.avatar} name={ticket.userName} className="size-10" />
          <div className="min-w-0">
            <p className="text-sm font-medium">{ticket.userName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email ?? "—"} · {user?.phone ?? ""}
            </p>
          </div>
        </div>
        <div className="divide-y rounded-xl border px-4">
          <DetailRow label="Opened">{formatDate(ticket.createdAt, "d MMM yyyy, h:mm a")}</DetailRow>
          <DetailRow label="Last update">{formatDate(ticket.updatedAt, "d MMM yyyy, h:mm a")}</DetailRow>
        </div>
        <section>
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Conversation</h3>
          <ul className="space-y-2.5">
            <li className="rounded-xl border bg-card p-3.5 text-sm leading-relaxed">
              <p className="mb-1 text-xs font-medium text-muted-foreground">{ticket.userName} wrote</p>
              {ticket.description}
            </li>
            {(replies ?? []).map((r) => (
              <li key={r.id} className="ml-6 rounded-xl border bg-secondary/50 p-3.5 text-sm leading-relaxed">
                <p className="mb-1 text-xs font-medium text-primary">
                  {r.author} · CDL Support · {formatDate(r.at, "d MMM, h:mm a")}
                </p>
                {r.body}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border bg-muted/30 p-4">
          <Field id={`tr-${ticket.id}`} label="Reply to learner" error={error} hint="Sent by email and in-app (simulated).">
            <Textarea
              id={`tr-${ticket.id}`}
              value={body}
              rows={3}
              maxLength={800}
              onChange={(e) => {
                setBody(e.target.value);
                if (error) setError(undefined);
              }}
              placeholder="Hi, thanks for reaching out…"
              aria-invalid={!!error}
              className="bg-background"
            />
          </Field>
          <div className="mt-3 flex justify-end">
            <Button
              className="bg-brand text-brand-foreground hover:bg-brand/90"
              onClick={() => {
                if (body.trim().length < 5) return setError("Write a reply before sending.");
                addTicketReply(ticket.id, body.trim());
                setBody("");
                if (ticket.status === "open") onStatus("in-progress");
                toast.success("Reply sent (simulated)", { description: `${ticket.userName} will receive it by email and in-app.` });
              }}
            >
              <MessageSquareReply className="size-4" />
              Send reply
            </Button>
          </div>
        </section>
      </div>
      <div className="flex flex-wrap gap-2 border-t bg-muted/30 px-5 py-3.5">
        {TICKET_STATUS_OPTIONS.map((o) => (
          <Button key={o.value} variant={ticket.status === o.value ? "secondary" : "outline"} disabled={ticket.status === o.value} onClick={() => onStatus(o.value)}>
            {o.value === "resolved" ? "Resolve" : `Mark ${o.label.toLowerCase()}`}
          </Button>
        ))}
      </div>
    </>
  );
}
