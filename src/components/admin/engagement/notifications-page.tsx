"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bell, CalendarClock, Megaphone, MailOpen, Plus, Send, Users } from "lucide-react";
import { courses } from "@/data";
import { DEMO_TODAY, STAGE_META, STAGES } from "@/data/constants";
import { formatDate, formatNumber } from "@/lib/format";
import type { LearnerStage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { LogoMark } from "@/components/brand/logo";
import { DemoBadge, StatusPill } from "@/components/shared/badges";
import { PageHeader, StatCard } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Field, FilterBar, FilterSelect, ResultsMeta, SearchField, TableCard, TableEmptyRow } from "@/components/admin/content/admin-kit";
import { audienceLabel, CHANNEL_META, CHANNELS, estimateReach, type AnnouncementChannel, type Audience } from "./engagement-data";
import { useEngagementStore } from "./engagement-store";

const publicCourses = courses.filter((c) => !c.collegeId && c.status === "published");

export function NotificationsPage() {
  const announcements = useEngagementStore((s) => s.announcements);
  const colleges = useDemoStore((s) => s.colleges);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const rows = announcements.filter((a) => (status === "all" || a.status === status) && (!q.trim() || `${a.title} ${a.body}`.toLowerCase().includes(q.trim().toLowerCase())));
  const stats = useMemo(() => {
    const sent = announcements.filter((a) => a.status === "sent");
    const rated = sent.filter((a) => a.openRate !== undefined);
    return {
      month: sent.filter((a) => a.at.startsWith(DEMO_TODAY.slice(0, 7))).length,
      reach: sent.reduce((n, a) => n + a.reach, 0),
      open: rated.length ? Math.round(rated.reduce((n, a) => n + (a.openRate ?? 0), 0) / rated.length) : 0,
      scheduled: announcements.filter((a) => a.status === "scheduled").length,
    };
  }, [announcements]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Engagement"
        title="Notifications"
        description="Announcements to learners by stage, course or college across in-app, email and SMS (email and SMS are simulated)."
        actions={
          <Button className="h-9 bg-brand px-3.5 text-brand-foreground hover:bg-brand/90" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            Create notification
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Sent this month" value={stats.month} icon={Send} />
        <StatCard label="Total reach" value={formatNumber(stats.reach)} icon={Users} accent="brand" hint="Unique learners, all sends" />
        <StatCard label="Avg open rate" value={`${stats.open}%`} icon={MailOpen} accent="info" hint={<DemoBadge className="h-5">Illustrative</DemoBadge>} />
        <StatCard label="Scheduled" value={stats.scheduled} icon={CalendarClock} accent="warning" />
      </div>
      <div className="space-y-3">
        <FilterBar right={<ResultsMeta shown={rows.length} total={announcements.length} noun="announcements" />}>
          <SearchField value={q} onChange={setQ} placeholder="Search announcements…" label="Search announcements" />
          <FilterSelect label="Status" allLabel="Sent & scheduled" value={status} onValueChange={setStatus} options={[{ value: "sent", label: "Sent" }, { value: "scheduled", label: "Scheduled" }]} />
        </FilterBar>
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Announcement</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Channels</TableHead>
                <TableHead>Sent / scheduled</TableHead>
                <TableHead className="text-right">Reach</TableHead>
                <TableHead>Open rate</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && <TableEmptyRow colSpan={7} icon={Megaphone} />}
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="max-w-[320px] min-w-[240px]">
                      <p className="truncate font-medium">{a.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.body}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-[13px]">{audienceLabel(a.audience, colleges)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {a.channels.map((c) => (
                        <span key={c} className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-muted-foreground">
                          {CHANNEL_META[c].short}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-[13px] whitespace-nowrap">{formatDate(a.at, "d MMM, h:mm a")}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(a.reach)}</TableCell>
                  <TableCell>
                    {a.openRate !== undefined ? (
                      <div className="w-24">
                        <div className="mb-1 text-xs font-medium tabular-nums">{a.openRate}%</div>
                        <div className="h-1.5 rounded-full bg-muted">
                          <div className="h-full rounded-full bg-brand" style={{ width: `${a.openRate}%` }} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{a.status === "scheduled" ? "—" : "Collecting…"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={a.status === "sent" ? "success" : "warning"}>{a.status === "sent" ? "Sent" : "Scheduled"}</StatusPill>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      </div>
      <Dialog open={creating} onOpenChange={setCreating}>
        {creating && <ComposeForm onDone={() => setCreating(false)} />}
      </Dialog>
    </div>
  );
}

type AudienceType = Audience["type"];

function ComposeForm({ onDone }: { onDone: () => void }) {
  const colleges = useDemoStore((s) => s.colleges);
  const addNotification = useDemoStore((s) => s.addNotification);
  const addAnnouncement = useEngagementStore((s) => s.addAnnouncement);
  const [audType, setAudType] = useState<AudienceType>("all");
  const [stage, setStage] = useState<LearnerStage>("college");
  const [courseId, setCourseId] = useState(publicCourses[0]?.id ?? "");
  const [collegeId, setCollegeId] = useState(colleges[0]?.id ?? "");
  const [channels, setChannels] = useState<AnnouncementChannel[]>(["in-app"]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [href, setHref] = useState("");
  const [when, setWhen] = useState<"now" | "later">("now");
  const [date, setDate] = useState("2026-10-16");
  const [time, setTime] = useState("10:00");
  const [submitted, setSubmitted] = useState(false);

  const audience: Audience =
    audType === "stage" ? { type: "stage", stage } : audType === "course" ? { type: "course", courseId } : audType === "college" ? { type: "college", collegeId } : { type: "all" };
  const reach = estimateReach(audience, channels, colleges);

  const e: Record<string, string> = {};
  if (!title.trim()) e.title = "Add a title.";
  else if (title.length > 60) e.title = "Keep the title to 60 characters.";
  if (!body.trim()) e.body = "Write a message.";
  else if (body.length > 240) e.body = "Keep the message to 240 characters.";
  if (href.trim() && !href.trim().startsWith("/")) e.href = "Use an in-app path starting with “/”, e.g. /dashboard/sessions.";
  if (!channels.length) e.channels = "Choose at least one channel.";
  if (when === "later") {
    if (!date || date < DEMO_TODAY) e.date = "Pick today or a later date.";
    if (!time) e.date = "Pick a time.";
  }
  const err = submitted ? e : {};

  const submit = () => {
    setSubmitted(true);
    if (Object.keys(e).length) return;
    const link = href.trim() || undefined;
    if (when === "now") {
      if (channels.includes("in-app")) addNotification({ kind: "announcement", title: title.trim(), body: body.trim(), href: link });
      addAnnouncement({ title: title.trim(), body: body.trim(), href: link, audience, channels, status: "sent", at: `${DEMO_TODAY}T10:30:00`, reach });
      toast.success("Announcement sent", { description: `${formatNumber(reach)} learners · ${channels.map((c) => CHANNEL_META[c].label).join(", ")}. It now appears in learners' notification centre.` });
    } else {
      addAnnouncement({ title: title.trim(), body: body.trim(), href: link, audience, channels, status: "scheduled", at: `${date}T${time}:00`, reach });
      toast.success("Announcement scheduled", { description: `${formatDate(date)} at ${time} IST · ${formatNumber(reach)} learners` });
    }
    onDone();
  };

  return (
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>Create notification</DialogTitle>
        <DialogDescription>In-app announcements reach the learner notification centre. Email and SMS delivery is simulated.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="nt-aud" label="Audience" required>
              <Select value={audType} onValueChange={(v) => setAudType(v as AudienceType)}>
                <SelectTrigger id="nt-aud" className="h-9! w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All learners</SelectItem>
                  <SelectItem value="stage">By stage</SelectItem>
                  <SelectItem value="course">By course</SelectItem>
                  <SelectItem value="college">By college</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {audType !== "all" && (
              <Field id="nt-aud2" label={audType === "stage" ? "Stage" : audType === "course" ? "Course" : "College"} required>
                <Select
                  value={audType === "stage" ? stage : audType === "course" ? courseId : collegeId}
                  onValueChange={(v) => (audType === "stage" ? setStage(v as LearnerStage) : audType === "course" ? setCourseId(v) : setCollegeId(v))}
                >
                  <SelectTrigger id="nt-aud2" className="h-9! w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {audType === "stage" &&
                      STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STAGE_META[s].plural}
                        </SelectItem>
                      ))}
                    {audType === "course" &&
                      publicCourses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    {audType === "college" &&
                      colleges.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-[13px] font-medium" id="nt-ch">
              Channels<span className="text-destructive">*</span>
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="nt-ch">
              {CHANNELS.map((c) => {
                const on = channels.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setChannels(on ? channels.filter((x) => x !== c) : [...channels, c])}
                    className={cn(
                      "inline-flex h-8 items-center rounded-full border px-3 text-[13px] font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                      on ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {CHANNEL_META[c].label}
                    {c !== "in-app" && <span className="ml-1 text-[11px] opacity-70">(simulated)</span>}
                  </button>
                );
              })}
            </div>
            {err.channels && <p className="text-xs font-medium text-destructive">{err.channels}</p>}
          </div>
          <Field id="nt-title" label="Title" required error={err.title} hint={`${title.length}/60`}>
            <Input id="nt-title" value={title} onChange={(ev) => setTitle(ev.target.value)} placeholder="e.g. New mock GD slots this weekend" className="h-9" aria-invalid={!!err.title} />
          </Field>
          <Field
            id="nt-body"
            label="Message"
            required
            error={err.body}
            hint={`${body.length}/240${channels.includes("sms") && body.length > 160 ? " · SMS will be split into 2 messages (160-character limit)" : channels.includes("sms") ? " · SMS limit 160" : ""}`}
          >
            <Textarea id="nt-body" value={body} onChange={(ev) => setBody(ev.target.value)} rows={3} aria-invalid={!!err.body} />
          </Field>
          <Field id="nt-link" label="Link" error={err.href} hint="Optional in-app path, e.g. /dashboard/sessions">
            <Input id="nt-link" value={href} onChange={(ev) => setHref(ev.target.value)} placeholder="/dashboard/sessions" className="h-9" aria-invalid={!!err.href} />
          </Field>
          <div className="space-y-2">
            <p className="text-[13px] font-medium">Schedule</p>
            <div className="flex flex-wrap gap-2">
              {(["now", "later"] as const).map((w) => (
                <Button key={w} type="button" variant={when === w ? "default" : "outline"} size="sm" onClick={() => setWhen(w)}>
                  {w === "now" ? "Send now" : "Schedule for later"}
                </Button>
              ))}
            </div>
            {when === "later" && (
              <div className="flex flex-wrap gap-2">
                <Input type="date" aria-label="Send date" min={DEMO_TODAY} value={date} onChange={(ev) => setDate(ev.target.value)} className="h-9 w-44" />
                <Input type="time" aria-label="Send time" value={time} onChange={(ev) => setTime(ev.target.value)} className="h-9 w-32" />
              </div>
            )}
            {err.date && <p className="text-xs font-medium text-destructive">{err.date}</p>}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Preview</p>
          <div className="mx-auto w-[230px] rounded-[2rem] border-[6px] border-navy bg-gradient-to-b from-[oklch(0.42_0.12_268)] to-[oklch(0.3_0.09_200)] p-2.5 pb-6 shadow-md">
            <div className="flex justify-between px-2 text-[10px] font-semibold text-white/90">
              <span>10:30</span>
              <span>5G ▮▮▮</span>
            </div>
            <p className="mt-6 text-center font-heading text-3xl font-semibold text-white">10:30</p>
            <p className="text-center text-[10px] text-white/70">Thursday, 15 October</p>
            <div className="mt-6 rounded-xl bg-white/90 p-2.5 shadow-sm backdrop-blur">
              <div className="flex items-center gap-1.5">
                <LogoMark className="size-4 rounded" />
                <span className="text-[9px] font-semibold tracking-wide text-muted-foreground uppercase">Career Design Lab · now</span>
              </div>
              <p className="mt-1 line-clamp-1 text-[11px] font-semibold">{title || "Your announcement title"}</p>
              <p className="line-clamp-3 text-[10px] text-muted-foreground">{body || "Your message appears here."}</p>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-3 shadow-xs">
            <p className="mb-2 text-[11px] font-semibold text-muted-foreground">In-app notification centre</p>
            <div className="flex gap-2.5 rounded-lg bg-secondary/50 p-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                <Megaphone className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-medium">{title || "Your announcement title"}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{body || "Your message appears here."}</p>
                {href.trim() && <p className="mt-1 text-[11px] font-medium text-primary">Open →</p>}
              </div>
              <Bell className="ml-auto size-3.5 shrink-0 text-brand" />
            </div>
          </div>
          <div className="rounded-xl bg-muted/60 p-3 text-xs">
            <p className="text-muted-foreground">Estimated reach</p>
            <p className="font-heading text-xl font-semibold tabular-nums">{formatNumber(reach)}</p>
            <p className="text-muted-foreground">{audienceLabel(audience, colleges)}</p>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={submit}>
          {when === "now" ? <Send className="size-4" /> : <CalendarClock className="size-4" />}
          {when === "now" ? "Send now" : "Schedule"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
