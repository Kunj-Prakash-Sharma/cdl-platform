"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { addDays, format, parseISO } from "date-fns";
import { Check, ClipboardList, Clock3, FileText, ListChecks, Plus, Settings2, Sparkles, Users } from "lucide-react";
import { assessments as seedAssessments, getUser } from "@/data";
import { DEMO_TODAY, STAGE_META, STAGES } from "@/data/constants";
import { formatDate, formatNumber } from "@/lib/format";
import type { Assessment, AssessmentResult, LearnerStage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { newId, useDemoStore } from "@/store/demo-store";
import { AutoStatus, DemoBadge, StatusPill } from "@/components/shared/badges";
import { EmptyState, PageHeader, StatCard } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ClearFiltersButton, Field, FilterBar, FilterSelect, hashNum, ResultsMeta, SearchField, TableCard } from "./admin-kit";
import { useAdminContent } from "./admin-content-store";

const CATEGORIES: Assessment["category"][] = ["Interests", "Personality", "Employability", "Strengths"];
const CATEGORY_TONE: Record<Assessment["category"], "primary" | "brand" | "info" | "warning"> = {
  Interests: "primary",
  Personality: "info",
  Employability: "brand",
  Strengths: "warning",
};

const DISPLAY_OPTIONS = [
  { key: "scores", label: "Dimension scores", hint: "Bar chart of every interest, trait and skill dimension." },
  { key: "interests", label: "Top interest areas", hint: "Plain-language summary of the three strongest interests." },
  { key: "strengths", label: "Strengths & development areas", hint: "Two short lists with suggested next steps." },
  { key: "recommendations", label: "Recommended programmes", hint: "Uses the shared recommendation rules for the learner's stage." },
  { key: "mentor", label: "Mentor debrief call-to-action", hint: "Offers a One-to-One Mentoring session to discuss the report." },
  { key: "parent", label: "Share with parent / guardian", hint: "For school students, parents can view the report." },
] as const;
const DEFAULT_DISPLAY: Record<string, boolean> = { scores: true, interests: true, strengths: true, recommendations: true, mentor: true, parent: false };

type AdminAssessment = Assessment & { display: Record<string, boolean>; isNew?: boolean };

function useAdminAssessments(): AdminAssessment[] {
  const created = useAdminContent((s) => s.newAssessments);
  const edits = useAdminContent((s) => s.assessmentEdits);
  return useMemo(
    () => [
      ...created.map((a) => ({ ...a, ...edits[a.id], display: { ...DEFAULT_DISPLAY, ...edits[a.id]?.display }, isNew: true })),
      ...seedAssessments.map((a) => ({ ...a, ...edits[a.id], display: { ...DEFAULT_DISPLAY, ...edits[a.id]?.display } })),
    ],
    [created, edits],
  );
}

const audienceLabel = (audience: LearnerStage[]) => (audience.length === STAGES.length ? "All learners" : audience.map((s) => STAGE_META[s].plural).join(", "));

export function AssessmentAdmin() {
  const list = useAdminAssessments();
  const results = useDemoStore((s) => s.assessmentResults);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return list.filter(
      (a) =>
        (category === "all" || a.category === category) &&
        (status === "all" || a.status === status) &&
        (!term || `${a.title} ${a.description}`.toLowerCase().includes(term)),
    );
  }, [list, q, category, status]);

  const stats = useMemo(() => {
    const active = list.filter((a) => a.status === "active");
    const completions = list.reduce((n, a) => n + a.completions, 0);
    const weighted = active.reduce((n, a) => n + a.avgCompletionMin * a.completions, 0);
    return { total: list.length, active: active.length, completions, avgMin: completions ? weighted / completions : 0 };
  }, [list]);

  const open = list.find((a) => a.id === openId);
  const hasFilters = q !== "" || category !== "all" || status !== "all";
  const reset = () => {
    setQ("");
    setCategory("all");
    setStatus("all");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Assessments"
        description="Career and employability self-assessments: questions, dimension scoring, how results are shown, and completion insights."
        actions={
          <Button className="h-9 bg-brand px-3.5 text-brand-foreground hover:bg-brand/90" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            New assessment
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Assessments" value={stats.total} icon={ClipboardList} hint={`${stats.active} active · ${stats.total - stats.active} draft`} />
        <StatCard label="Total completions" value={formatNumber(stats.completions)} icon={Users} accent="brand" hint="All time, illustrative" />
        <StatCard label="Avg completion time" value={`${stats.avgMin.toFixed(1)} min`} icon={Clock3} accent="info" hint="Weighted across active assessments" />
        <StatCard label="Reports on record" value={results.length} icon={FileText} accent="success" hint="Results stored in this demo" />
      </div>

      <div className="space-y-3">
        <FilterBar right={<ResultsMeta shown={filtered.length} total={list.length} noun="assessments" onReset={reset} />}>
          <SearchField value={q} onChange={setQ} placeholder="Search assessments…" label="Search assessments" />
          <FilterSelect label="Category" allLabel="All categories" value={category} onValueChange={setCategory} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <FilterSelect
            label="Status"
            allLabel="All statuses"
            value={status}
            onValueChange={setStatus}
            options={[
              { value: "active", label: "Active" },
              { value: "draft", label: "Draft" },
            ]}
            className="sm:w-36"
          />
          <ClearFiltersButton visible={hasFilters} onClick={reset} />
        </FilterBar>

        {filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No assessments match"
            description="Try another category or clear the filters."
            action={
              <Button variant="outline" size="sm" onClick={reset}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Assessment</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Questions</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Completions</TableHead>
                  <TableHead className="text-right">Avg time</TableHead>
                  <TableHead className="w-24">
                    <span className="sr-only">Open</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id} className="cursor-pointer" onClick={() => setOpenId(a.id)}>
                    <TableCell>
                      <div className="flex min-w-[280px] items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                          <ListChecks className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium">{a.title}</p>
                          <p className="line-clamp-1 max-w-[360px] text-xs whitespace-normal text-muted-foreground">{a.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusPill tone={CATEGORY_TONE[a.category]} dot={false}>
                        {a.category}
                      </StatusPill>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {a.questions.length}
                      <div className="text-[11px] text-muted-foreground">{Object.keys(a.dimensions).length} dimensions</div>
                    </TableCell>
                    <TableCell className="max-w-[220px] text-[13px] whitespace-normal text-muted-foreground">{audienceLabel(a.audience)}</TableCell>
                    <TableCell>
                      <AutoStatus status={a.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{a.completions ? formatNumber(a.completions) : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{a.avgCompletionMin ? `${a.avgCompletionMin} min` : `~${a.estimatedMin} min`}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenId(a.id);
                        }}
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        )}
      </div>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full gap-0 p-0 data-[side=right]:sm:max-w-3xl">
          {open && <AssessmentDetail key={open.id} assessment={open} results={results} />}
        </SheetContent>
      </Sheet>

      <Dialog open={creating} onOpenChange={setCreating}>
        {creating && (
          <NewAssessmentForm
            onCancel={() => setCreating(false)}
            onCreated={(id) => {
              setCreating(false);
              setOpenId(id);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

function AssessmentDetail({ assessment, results }: { assessment: AdminAssessment; results: AssessmentResult[] }) {
  const [tab, setTab] = useState("questions");
  return (
    <>
      <SheetHeader className="border-b px-5 pt-5 pb-4 pr-12">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <StatusPill tone={CATEGORY_TONE[assessment.category]} dot={false}>
            {assessment.category}
          </StatusPill>
          <AutoStatus status={assessment.status} />
          {assessment.isNew && (
            <StatusPill tone="neutral" dot={false}>
              Created in admin
            </StatusPill>
          )}
        </div>
        <SheetTitle className="text-lg font-semibold">{assessment.title}</SheetTitle>
        <SheetDescription>
          {assessment.questions.length} questions · {Object.keys(assessment.dimensions).length} dimensions · ~{assessment.estimatedMin} min · {audienceLabel(assessment.audience)}
        </SheetDescription>
      </SheetHeader>
      <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1 gap-0">
        <div className="border-b px-5 py-2.5">
          <TabsList>
            <TabsTrigger value="questions" className="px-3">
              <ListChecks className="size-3.5" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="config" className="px-3">
              <Settings2 className="size-3.5" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="results" className="px-3">
              <Sparkles className="size-3.5" />
              Results
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <TabsContent value="questions">
            <QuestionsView assessment={assessment} onConfigure={() => setTab("config")} />
          </TabsContent>
          <TabsContent value="config">
            <ConfigForm assessment={assessment} />
          </TabsContent>
          <TabsContent value="results">
            <ResultsView assessment={assessment} results={results} />
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}

const GROUP_STYLE = {
  interest: "bg-secondary text-primary",
  trait: "bg-info-soft text-info",
  skill: "bg-brand-soft text-brand",
} as const;

function QuestionsView({ assessment, onConfigure }: { assessment: AdminAssessment; onConfigure: () => void }) {
  const sections = useMemo(() => {
    const map = new Map<string, Assessment["questions"]>();
    for (const q of assessment.questions) map.set(q.section, [...(map.get(q.section) ?? []), q]);
    return [...map.entries()];
  }, [assessment.questions]);

  if (!assessment.questions.length) {
    return (
      <EmptyState
        icon={ListChecks}
        title="No questions yet"
        description="This draft has no questions. Configure its audience and result display now; the question editor is part of a later phase."
        action={
          <Button size="sm" variant="outline" onClick={onConfigure}>
            Open configuration
          </Button>
        }
      />
    );
  }

  const number = new Map(assessment.questions.map((q, i) => [q.id, i + 1]));
  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-muted/40 p-3.5">
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Scored dimensions</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(assessment.dimensions).map(([key, d]) => (
            <span key={key} className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", GROUP_STYLE[d.group])}>
              {d.label}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          <span className="font-medium text-primary">Indigo</span> interests · <span className="font-medium text-info">blue</span> traits ·{" "}
          <span className="font-medium text-brand">teal</span> skills. Each option adds points to one or more dimensions; totals are scaled to 0–100.
        </p>
      </div>
      {sections.map(([section, questions]) => (
        <section key={section} className="space-y-2.5">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {section} · {questions.length}
          </h3>
          {questions.map((q) => {
            return (
              <article key={q.id} className="rounded-xl border bg-card p-4">
                <p className="text-sm font-medium">
                  <span className="mr-1.5 text-muted-foreground tabular-nums">Q{number.get(q.id)}.</span>
                  {q.prompt}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {q.options.map((o, i) => (
                    <li key={o.id} className="flex flex-col gap-1.5 rounded-lg bg-muted/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-[13px]">
                        <span className="mr-1.5 font-semibold text-muted-foreground">{String.fromCharCode(65 + i)}</span>
                        {o.label}
                      </span>
                      <span className="flex flex-wrap gap-1 sm:justify-end">
                        {Object.keys(o.scores).length === 0 && <span className="text-[11px] text-muted-foreground">No points</span>}
                        {Object.entries(o.scores).map(([dim, pts]) => {
                          const d = assessment.dimensions[dim];
                          return (
                            <span key={dim} className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap", d ? GROUP_STYLE[d.group] : "bg-muted")}>
                              {d?.label ?? dim} +{pts}
                            </span>
                          );
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
}

function ConfigForm({ assessment }: { assessment: AdminAssessment }) {
  const editAssessment = useAdminContent((s) => s.editAssessment);
  const [title, setTitle] = useState(assessment.title);
  const [description, setDescription] = useState(assessment.description);
  const [minutes, setMinutes] = useState(String(assessment.estimatedMin));
  const [audience, setAudience] = useState<LearnerStage[]>(assessment.audience);
  const [status, setStatus] = useState<Assessment["status"]>(assessment.status);
  const [display, setDisplay] = useState<Record<string, boolean>>(assessment.display);
  const [submitted, setSubmitted] = useState(false);

  const m = Number(minutes);
  const errors: Record<string, string> = {};
  if (title.trim().length < 5) errors.title = "Use at least 5 characters.";
  if (description.trim().length < 20) errors.description = "Describe the assessment in at least 20 characters.";
  if (!Number.isInteger(m) || m < 1 || m > 60) errors.minutes = "Enter 1–60 minutes.";
  if (!audience.length) errors.audience = "Choose at least one audience.";
  if (status === "active" && !assessment.questions.length) errors.status = "Add questions before activating this assessment.";
  const shown = submitted ? errors : {};

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        if (Object.keys(errors).length) {
          toast.error("Please fix the highlighted fields");
          return;
        }
        editAssessment(assessment.id, { title: title.trim(), description: description.trim(), estimatedMin: m, audience, status, display });
        toast.success("Configuration saved", { description: `${title.trim()} · saved for this demo session.` });
      }}
    >
      <Field id="as-title" label="Title" required error={shown.title}>
        <Input id="as-title" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!shown.title} className="h-9" />
      </Field>
      <Field id="as-desc" label="Description" required error={shown.description}>
        <Textarea id="as-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} aria-invalid={!!shown.description} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="as-min" label="Estimated time (minutes)" required error={shown.minutes}>
          <Input id="as-min" type="number" min={1} max={60} value={minutes} onChange={(e) => setMinutes(e.target.value)} aria-invalid={!!shown.minutes} className="h-9" />
        </Field>
        <Field id="as-status" label="Status" required error={shown.status}>
          <Select value={status} onValueChange={(v) => setStatus(v as Assessment["status"])}>
            <SelectTrigger id="as-status" className="h-9! w-full" aria-invalid={!!shown.status}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active — visible to learners</SelectItem>
              <SelectItem value="draft">Draft — hidden</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="space-y-2">
        <p className="text-[13px] font-medium" id="as-aud">
          Audience<span className="text-destructive">*</span>
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="as-aud">
          {STAGES.map((s) => {
            const on = audience.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => setAudience(on ? audience.filter((x) => x !== s) : [...audience, s])}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  on ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {on && <Check className="size-3.5" />}
                {STAGE_META[s].plural}
              </button>
            );
          })}
        </div>
        {shown.audience && <p className="text-xs font-medium text-destructive">{shown.audience}</p>}
      </div>
      <div className="space-y-2">
        <p className="text-[13px] font-medium">Result display</p>
        <div className="divide-y rounded-xl border">
          {DISPLAY_OPTIONS.map((o) => (
            <label key={o.key} htmlFor={`disp-${o.key}`} className="flex cursor-pointer items-start justify-between gap-4 px-3.5 py-3">
              <span>
                <span className="block text-[13px] font-medium">{o.label}</span>
                <span className="block text-xs text-muted-foreground">{o.hint}</span>
              </span>
              <Switch id={`disp-${o.key}`} checked={!!display[o.key]} onCheckedChange={(v) => setDisplay((d) => ({ ...d, [o.key]: v }))} className="mt-0.5" />
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Results are always labelled as illustrative self-reflection, not a validated psychometric diagnosis.</p>
      </div>
      <div className="flex justify-end border-t pt-4">
        <Button type="submit" className="bg-brand text-brand-foreground hover:bg-brand/90">
          Save configuration
        </Button>
      </div>
    </form>
  );
}

const trendConfig = { completions: { label: "Completions", color: "var(--chart-2)" } } satisfies ChartConfig;
const dimConfig = { score: { label: "Average score", color: "var(--chart-1)" } } satisfies ChartConfig;

function ResultsView({ assessment, results }: { assessment: AdminAssessment; results: AssessmentResult[] }) {
  const mine = useMemo(() => results.filter((r) => r.assessmentId === assessment.id).sort((a, b) => b.completedOn.localeCompare(a.completedOn)), [results, assessment.id]);

  /** Synthetic but deterministic weekly completions for the last 8 weeks. */
  const trend = useMemo(() => {
    const base = assessment.completions / 52;
    const h = hashNum(assessment.id);
    return Array.from({ length: 8 }, (_, i) => {
      const start = addDays(parseISO(DEMO_TODAY), -7 * (7 - i));
      const wobble = ((h >> i) % 7) / 10 - 0.25;
      return { week: format(start, "d MMM"), completions: Math.max(0, Math.round(base * (0.85 + i * 0.05 + wobble))) };
    });
  }, [assessment.completions, assessment.id]);

  const dims = useMemo(
    () =>
      Object.entries(assessment.dimensions)
        .map(([key, d]) => {
          const vals = mine.map((r) => r.scores[key]).filter((v): v is number => typeof v === "number");
          return { key, label: d.label, score: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0, n: vals.length };
        })
        .filter((d) => d.n > 0)
        .sort((a, b) => b.score - a.score),
    [assessment.dimensions, mine],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-muted-foreground">Completion trend and score patterns for this assessment.</p>
        <DemoBadge />
      </div>

      <section className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h3 className="font-heading text-sm font-semibold">Weekly completions</h3>
          <span className="text-xs text-muted-foreground">Last 8 weeks</span>
        </div>
        {assessment.completions ? (
          <ChartContainer config={trendConfig} className="aspect-auto h-48 w-full">
            <LineChart data={trend} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={36} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line dataKey="completions" type="monotone" stroke="var(--color-completions)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ChartContainer>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No completions yet — this assessment is still a draft.</p>
        )}
      </section>

      <section className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h3 className="font-heading text-sm font-semibold">Average score per dimension</h3>
          <span className="text-xs text-muted-foreground">
            From {mine.length} stored result{mine.length === 1 ? "" : "s"} · 0–100
          </span>
        </div>
        {dims.length ? (
          <ChartContainer config={dimConfig} className="aspect-auto w-full" style={{ height: Math.max(160, dims.length * 26 + 30) }}>
            <BarChart data={dims} layout="vertical" margin={{ left: 0, right: 16 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={170} tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
              <Bar dataKey="score" fill="var(--color-score)" radius={4} barSize={14} />
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No stored results for this assessment yet.</p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="font-heading text-sm font-semibold">Recent results</h3>
        {mine.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
            Learner reports appear here as soon as someone completes the assessment.
          </p>
        ) : (
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Learner</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Top signal</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Report</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mine.map((r) => {
                  const u = getUser(r.userId);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Portrait avatar={u?.avatar} name={u?.name ?? r.userId} className="size-7" />
                          <div>
                            <p className="text-[13px] font-medium">{u?.name ?? r.userId}</p>
                            {u && <p className="text-[11px] text-muted-foreground">{STAGE_META[u.stage].label}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(r.completedOn)}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-[13px] text-muted-foreground">{r.topInterests[0] ?? r.strengths[0] ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/assessment/report/${r.id}`}>View report</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableCard>
        )}
      </section>
    </div>
  );
}

function NewAssessmentForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (id: string) => void }) {
  const addAssessment = useAdminContent((s) => s.addAssessment);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Assessment["category"]>("Employability");
  const [audience, setAudience] = useState<LearnerStage[]>(["college"]);
  const [submitted, setSubmitted] = useState(false);
  const errors: Record<string, string> = {};
  if (name.trim().length < 5) errors.name = "Give the assessment a name of at least 5 characters.";
  else if (seedAssessments.some((a) => a.title.toLowerCase() === name.trim().toLowerCase())) errors.name = "An assessment with this name already exists.";
  if (!audience.length) errors.audience = "Choose at least one audience.";
  const shown = submitted ? errors : {};

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>New assessment</DialogTitle>
        <DialogDescription>Creates a draft you can configure. It stays hidden from learners until activated.</DialogDescription>
      </DialogHeader>
      <form
        id="new-assessment"
        noValidate
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          if (Object.keys(errors).length) return;
          const id = newId("as");
          addAssessment({
            id,
            title: name.trim(),
            description: `Draft ${category.toLowerCase()} assessment for ${audienceLabel(audience).toLowerCase()}.`,
            category,
            estimatedMin: 10,
            audience,
            status: "draft",
            questions: [],
            dimensions: {},
            completions: 0,
            avgCompletionMin: 0,
          });
          toast.success("Assessment created", { description: `${name.trim()} was added as a draft.` });
          onCreated(id);
        }}
      >
        <Field id="na-name" label="Name" required error={shown.name}>
          <Input id="na-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Workplace Readiness Check" aria-invalid={!!shown.name} className="h-9" maxLength={80} />
        </Field>
        <Field id="na-cat" label="Category" required>
          <Select value={category} onValueChange={(v) => setCategory(v as Assessment["category"])}>
            <SelectTrigger id="na-cat" className="h-9! w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="space-y-2">
          <p className="text-[13px] font-medium" id="na-aud">
            Audience<span className="text-destructive">*</span>
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="na-aud">
            {STAGES.map((s) => {
              const on = audience.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setAudience(on ? audience.filter((x) => x !== s) : [...audience, s])}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    on ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  {on && <Check className="size-3.5" />}
                  {STAGE_META[s].plural}
                </button>
              );
            })}
          </div>
          {shown.audience && <p className="text-xs font-medium text-destructive">{shown.audience}</p>}
        </div>
      </form>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" form="new-assessment" className="bg-brand text-brand-foreground hover:bg-brand/90">
          Create draft
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
