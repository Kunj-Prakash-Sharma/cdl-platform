"use client";

import { useMemo, useRef, useState } from "react";
import { CheckCircle2, CircleHelp, FileUp, Inbox, Paperclip, PhoneCall, Search, X } from "lucide-react";
import { toast } from "sonner";
import { faqs } from "@/data";
import { formatDate } from "@/lib/format";
import type { FaqItem, SupportTicket } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useCurrentUser } from "@/store/hooks";
import { AutoStatus } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/page-header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const FAQ_CATEGORIES = Array.from(new Set(faqs.map((f) => f.category))) as FaqItem["category"][];
export const TICKET_CATEGORIES: SupportTicket["category"][] = ["Account", "Payments", "Course access", "Live sessions", "Certificates", "Other"];

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Wraps case-insensitive matches of `query` in <mark>. */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "ig"));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="rounded bg-warning-soft px-0.5 text-foreground ring-1 ring-warning/30">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export function FaqSection({ onRaiseRequest }: { onRaiseRequest: () => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | FaqItem["category"]>("All");
  const q = query.trim();
  const filtered = faqs.filter(
    (f) => (category === "All" || f.category === category) && (!q || `${f.question} ${f.answer}`.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs">
      <div>
        <h2 className="font-heading text-lg font-semibold">Frequently asked questions</h2>
        <p className="text-sm text-muted-foreground">Quick answers about courses, live sessions, mentoring, payments and certificates.</p>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search FAQs — e.g. recording, refund, upgrade" className="h-10 pl-9" aria-label="Search FAQs" />
        {query && (
          <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        )}
      </div>
      <div className="scrollbar-none -mx-5 flex gap-1.5 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
        {(["All", ...FAQ_CATEGORIES] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className={cn(
              "h-7 shrink-0 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition",
              category === c ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          icon={CircleHelp}
          title="No FAQs match your search"
          description="Can't find what you need? Raise a support request and our team will help."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                }}
              >
                Clear search
              </Button>
              <Button onClick={onRaiseRequest}>Raise a request</Button>
            </div>
          }
        />
      ) : (
        <>
          {q && (
            <p className="text-xs text-muted-foreground">
              {filtered.length} result{filtered.length > 1 ? "s" : ""} for “{q}”
            </p>
          )}
          <Accordion key={`${q}|${category}`} type="multiple" defaultValue={q ? filtered.slice(0, 3).map((f) => f.id) : []} className="rounded-xl border px-4">
            {filtered.map((f) => (
              <AccordionItem key={f.id} value={f.id}>
                <AccordionTrigger className="py-3.5 text-[15px] hover:no-underline">
                  <span className="pr-3">
                    <span className="mb-0.5 block text-[11px] font-medium tracking-wide text-brand uppercase">{f.category}</span>
                    <Highlight text={f.question} query={q} />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4 leading-relaxed text-muted-foreground">
                  <Highlight text={f.answer} query={q} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </>
      )}
    </section>
  );
}

type Errors = Partial<Record<"category" | "subject" | "description", string>>;

export function SupportForm({ onViewRequests }: { onViewRequests: () => void }) {
  const { user, userId } = useCurrentUser();
  const addTicket = useDemoStore((s) => s.addTicket);
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<SupportTicket["category"] | "">("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<SupportTicket["priority"]>("medium");
  const [attachment, setAttachment] = useState<{ name: string; sizeKb: number }>();
  const [errors, setErrors] = useState<Errors>({});
  const [created, setCreated] = useState<SupportTicket>();

  const validate = (): Errors => ({
    category: category ? undefined : "Choose a category.",
    subject: subject.trim().length < 5 ? "Add a short subject (at least 5 characters)." : undefined,
    description: description.trim().length < 20 ? "Describe the issue in a little more detail (at least 20 characters)." : undefined,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (errs.category || errs.subject || errs.description || !category) return;
    const ticket = addTicket({
      userId,
      userName: user.name,
      category,
      subject: subject.trim(),
      description: description.trim() + (attachment ? `\n\nAttachment: ${attachment.name} (simulated upload)` : ""),
      priority,
    });
    setCreated(ticket);
    toast.success(`Request ${ticket.id} submitted`, { description: "Our support team typically replies within 24 hours." });
  };

  const reset = () => {
    setCategory("");
    setSubject("");
    setDescription("");
    setPriority("medium");
    setAttachment(undefined);
    setErrors({});
    setCreated(undefined);
  };

  if (created) {
    return (
      <div className="flex flex-col items-center px-2 py-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircle2 className="size-7" />
        </span>
        <h3 className="mt-4 font-heading text-lg font-semibold">Request submitted</h3>
        <p className="mt-1 font-mono text-sm font-medium text-primary">{created.id}</p>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          “{created.subject}” is with our support team. We&apos;ll reply to {user.email ?? "your registered email"} — usually within 24 hours.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={reset}>
            Raise another
          </Button>
          <Button onClick={onViewRequests}>View my requests</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="sr-category">Category</Label>
        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v as SupportTicket["category"]);
            setErrors((x) => ({ ...x, category: undefined }));
          }}
        >
          <SelectTrigger id="sr-category" className="h-9 w-full" aria-invalid={Boolean(errors.category)}>
            <SelectValue placeholder="What is this about?" />
          </SelectTrigger>
          <SelectContent>
            {TICKET_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sr-subject">Subject</Label>
        <Input
          id="sr-subject"
          value={subject}
          maxLength={100}
          onChange={(e) => {
            setSubject(e.target.value);
            if (errors.subject) setErrors((x) => ({ ...x, subject: undefined }));
          }}
          placeholder="e.g. Class 3 recording won't play"
          aria-invalid={Boolean(errors.subject)}
          className="h-9"
        />
        {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sr-description">Description</Label>
        <Textarea
          id="sr-description"
          rows={4}
          maxLength={1500}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) setErrors((x) => ({ ...x, description: undefined }));
          }}
          placeholder="What happened, what you expected, and any steps you've already tried."
          aria-invalid={Boolean(errors.description)}
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
      </div>
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">How urgent is it?</legend>
        <RadioGroup value={priority} onValueChange={(v) => setPriority(v as SupportTicket["priority"])} className="grid grid-cols-3 gap-2">
          {(["low", "medium", "high"] as const).map((p) => (
            <Label
              key={p}
              htmlFor={`sr-p-${p}`}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-normal capitalize transition",
                priority === p && "border-primary bg-accent/60",
              )}
            >
              <RadioGroupItem id={`sr-p-${p}`} value={p} /> {p}
            </Label>
          ))}
        </RadioGroup>
      </fieldset>
      <div className="space-y-1.5">
        <span className="text-sm font-medium">Attachment (optional)</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          className="sr-only"
          aria-label="Attach a screenshot or PDF"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setAttachment({ name: f.name, sizeKb: Math.max(1, Math.round(f.size / 1024)) });
            e.target.value = "";
          }}
        />
        {attachment ? (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
            <Paperclip className="size-4 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
            <span className="text-xs text-muted-foreground">{attachment.sizeKb} KB · stays on your device</span>
            <Button type="button" variant="ghost" size="icon-xs" aria-label="Remove attachment" onClick={() => setAttachment(undefined)}>
              <X />
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
              <FileUp /> Choose file
            </Button>
            <Button type="button" variant="ghost" onClick={() => setAttachment({ name: "screenshot-15-oct.png", sizeKb: 248 })}>
              Use sample screenshot
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Simulated upload — files are never sent anywhere in this prototype.</p>
      </div>
      <Button type="submit" className="h-10 w-full">
        Submit request
      </Button>
    </form>
  );
}

const STEPS: { key: SupportTicket["status"]; label: string }[] = [
  { key: "open", label: "Submitted" },
  { key: "in-progress", label: "In progress" },
  { key: "resolved", label: "Resolved" },
];

export function MyRequests() {
  const { userId } = useCurrentUser();
  const tickets = useDemoStore((s) => s.supportTickets);
  const setTicketStatus = useDemoStore((s) => s.setTicketStatus);
  const mine = useMemo(() => tickets.filter((t) => t.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [tickets, userId]);

  if (!mine.length) {
    return <EmptyState icon={Inbox} title="No support requests yet" description="Requests you raise will appear here with live status updates." />;
  }
  return (
    <ul className="space-y-3">
      {mine.map((t) => {
        const reached = STEPS.findIndex((s) => s.key === t.status);
        return (
          <li key={t.id} className="rounded-2xl border bg-card p-4 shadow-xs sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono font-semibold text-foreground">{t.id}</span>
                  <span>·</span>
                  <span>{t.category}</span>
                  <span>·</span>
                  <span className="capitalize">{t.priority} priority</span>
                </div>
                <p className="mt-1 font-medium">{t.subject}</p>
                <p className="mt-0.5 line-clamp-2 text-sm whitespace-pre-line text-muted-foreground">{t.description}</p>
              </div>
              <AutoStatus status={t.status} label={STEPS[reached]?.label === "Submitted" ? "Open" : STEPS[reached]?.label} />
            </div>
            <ol className="mt-4 grid grid-cols-3 gap-2" aria-label={`Status of ${t.id}`}>
              {STEPS.map((s, i) => {
                const done = i <= reached;
                const time = i === 0 ? t.createdAt : i === reached ? t.updatedAt : undefined;
                return (
                  <li key={s.key} className="relative">
                    <div className={cn("h-1.5 rounded-full", done ? (t.status === "resolved" ? "bg-success" : "bg-brand") : "bg-muted")} />
                    <p className={cn("mt-1.5 text-xs font-medium", !done && "text-muted-foreground")}>{s.label}</p>
                    <p className="text-[11px] text-muted-foreground">{time && done ? formatDate(time, "d MMM, h:mm a") : "—"}</p>
                  </li>
                );
              })}
            </ol>
            <div className="mt-3 flex justify-end">
              {t.status === "resolved" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTicketStatus(t.id, "open");
                    toast("Request reopened", { description: `${t.id} is back with our support team.` });
                  }}
                >
                  Reopen
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTicketStatus(t.id, "resolved");
                    toast.success("Marked as resolved", { description: "Glad it's sorted! You can reopen it anytime." });
                  }}
                >
                  <CheckCircle2 /> My issue is resolved
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const CALLBACK_TOPICS = ["Choosing the right programme", "Payments & refunds", "Live sessions & recordings", "One-to-One Mentoring", "Technical help"];
const CALLBACK_TIMES = ["Today, 6 – 8 PM", "Tomorrow, 10 AM – 12 PM", "Tomorrow, 6 – 8 PM", "This weekend"];

/** Simulated "request a callback" flow. Remount with `key` to reset. */
export function CallbackDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useCurrentUser();
  const requestCallback = useDemoStore((s) => s.requestCallback);
  const [phone, setPhone] = useState(user.phone);
  const [topic, setTopic] = useState(CALLBACK_TOPICS[0]);
  const [time, setTime] = useState(CALLBACK_TIMES[0]);
  const [done, setDone] = useState(false);
  const phoneError = phone.replace(/[^0-9X]/gi, "").length < 10 ? "Enter a 10-digit mobile number." : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request a callback</DialogTitle>
          <DialogDescription>A CDL learning advisor will call you at your preferred time.</DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="flex flex-col items-center py-4 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
              <PhoneCall className="size-6" />
            </span>
            <p className="mt-3 font-heading font-semibold">Callback requested</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;ll call {phone} · {time}. (Simulated — no call will be made.)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cb-phone">Mobile number</Label>
              <Input id="cb-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9" aria-invalid={Boolean(phoneError)} />
              {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cb-topic">Topic</Label>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger id="cb-topic" className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALLBACK_TOPICS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <span className="text-sm font-medium">Preferred time (IST)</span>
              <div className="grid grid-cols-2 gap-2">
                {CALLBACK_TIMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={time === t}
                    onClick={() => setTime(t)}
                    className={cn("rounded-lg border px-3 py-2 text-left text-sm transition hover:border-primary/40", time === t && "border-primary bg-accent/60 font-medium")}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          {done ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                disabled={Boolean(phoneError)}
                onClick={() => {
                  requestCallback({ name: user.name, phone, topic, preferredTime: time });
                  toast.success("Callback requested", { description: `${topic} · ${time}` });
                  setDone(true);
                }}
              >
                Request callback
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
