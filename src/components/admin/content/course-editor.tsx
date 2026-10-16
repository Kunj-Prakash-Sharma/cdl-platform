"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Check, CircleAlert, ExternalLink, Plus, Save, Star, X } from "lucide-react";
import { courses as seedCourses, getCollege } from "@/data";
import { CATEGORIES, DEMO_TODAY, FORMAT_META, FORMATS, STAGE_META, STAGES } from "@/data/constants";
import { formatDate, formatDuration, formatINR, formatNumber } from "@/lib/format";
import type { Course, CourseCategory, LearningFormat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useMentors } from "@/store/hooks";
import { AutoStatus, FormatBadge } from "@/components/shared/badges";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { PageHeader } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Rating } from "@/components/shared/cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Field, InfoNote, Panel } from "./admin-kit";
import { useAdminContent } from "./admin-content-store";
import { COURSE_STATUS_META, THUMBNAIL_PRESETS, slugify } from "./course-utils";
import { CurriculumBuilder } from "./curriculum-builder";

type Mode = "new" | "seed" | "custom";
type Prices = Record<LearningFormat, string>;

const DEFAULT_PRICES: Prices = { "self-paced": "1999", "live-cohort": "4999", mentoring: "2999" };

/** Starting point for a new course (deterministic — safe to render on the server). */
export function blankCourse(): Course {
  return {
    id: "",
    title: "",
    subtitle: "",
    description: "",
    category: "Employability",
    formats: ["self-paced"],
    pricing: { "self-paced": 1999 },
    audience: ["college"],
    instructorId: "",
    durationLabel: "4 weeks",
    rating: 0,
    reviewCount: 0,
    learners: 0,
    outcomes: [""],
    includes: ["Certificate of completion"],
    chapters: [
      {
        id: "draft-c1",
        title: "Getting started",
        lessons: [{ id: "draft-l1", title: "Welcome and course overview", durationSec: 360, kind: "video", preview: true }],
      },
    ],
    thumbnail: THUMBNAIL_PRESETS[3],
    tags: [],
    relatedIds: [],
    reviews: [],
    status: "draft",
    lastUpdated: DEMO_TODAY,
  };
}

/** Serialised form state used to detect unsaved changes. */
const fingerprint = (d: Course, prices: Prices) => JSON.stringify([d, FORMATS.map((f) => (d.formats.includes(f) ? prices[f].trim() : null))]);

function initialPrices(c: Course): Prices {
  return {
    "self-paced": String(c.pricing["self-paced"] ?? DEFAULT_PRICES["self-paced"]),
    "live-cohort": String(c.pricing["live-cohort"] ?? DEFAULT_PRICES["live-cohort"]),
    mentoring: String(c.pricing.mentoring ?? DEFAULT_PRICES.mentoring),
  };
}

function validate(d: Course, prices: Prices) {
  const e: Record<string, string> = {};
  if (d.title.trim().length < 5) e.title = "Enter a course title of at least 5 characters.";
  if (!d.subtitle.trim()) e.subtitle = "Add a one-line subtitle for catalog cards.";
  if (d.description.trim().length < 40) e.description = "Write at least 40 characters so learners know what the course covers.";
  if (!d.durationLabel.trim()) e.durationLabel = "Add a duration, e.g. “4 weeks”.";
  if (!d.audience.length) e.audience = "Choose at least one audience.";
  if (!d.instructorId) e.instructorId = "Assign a mentor to this course.";
  if (!d.formats.length) e.formats = "Offer at least one learning level.";
  for (const f of d.formats) {
    const raw = prices[f].trim();
    const v = Number(raw);
    if (raw === "" || !Number.isFinite(v) || v < 0 || !Number.isInteger(v)) e[`price-${f}`] = "Enter a whole-rupee amount (0 = free).";
    else if (f !== "self-paced" && v === 0) e[`price-${f}`] = `${FORMAT_META[f].label} needs a price.`;
    else if (v > 200000) e[`price-${f}`] = "That looks too high — maximum ₹2,00,000.";
  }
  if (!d.chapters.length) e.curriculum = "Add at least one chapter.";
  else if (d.chapters.some((c) => !c.lessons.length)) e.curriculum = "Every chapter needs at least one lesson.";
  for (const c of d.chapters) {
    if (!c.title.trim()) e[`ch-${c.id}`] = "Chapter title is required.";
    for (const l of c.lessons) {
      if (!l.title.trim()) e[`ls-${l.id}`] = "Lesson title is required.";
      else if (!l.durationSec) e[`ls-${l.id}`] = "Add a duration in minutes.";
    }
  }
  if (!d.outcomes.some((o) => o.trim())) e.outcomes = "Add at least one learning outcome.";
  return e;
}

export function CourseEditor({ mode, initial }: { mode: Mode; initial: Course }) {
  const router = useRouter();
  const mentors = useMentors();
  const customCourses = useDemoStore((s) => s.customCourses);
  const addCustomCourse = useDemoStore((s) => s.addCustomCourse);
  const updateCustomCourse = useDemoStore((s) => s.updateCustomCourse);
  const setCourseStatus = useDemoStore((s) => s.setCourseStatus);
  const saveCourseEdits = useAdminContent((s) => s.saveCourseEdits);

  const [draft, setDraft] = useState<Course>(initial);
  const [prices, setPrices] = useState<Prices>(() => initialPrices(initial));
  const [submitted, setSubmitted] = useState(false);
  const [snapshot, setSnapshot] = useState(() => fingerprint(initial, initialPrices(initial)));
  const [tagInput, setTagInput] = useState("");

  const patch = (p: Partial<Course>) => setDraft((d) => ({ ...d, ...p }));
  const allErrors = useMemo(() => validate(draft, prices), [draft, prices]);
  const errors = submitted ? allErrors : {};
  const errorCount = Object.keys(allErrors).length;

  const pricing = useMemo(() => {
    const out: Course["pricing"] = {};
    for (const f of draft.formats) {
      const v = Number(prices[f]);
      if (prices[f].trim() !== "" && Number.isFinite(v)) out[f] = v;
    }
    return out;
  }, [draft.formats, prices]);

  const dirty = fingerprint(draft, prices) !== snapshot;
  const mentor = mentors.find((m) => m.id === draft.instructorId);
  const college = draft.collegeId ? getCollege(draft.collegeId) : undefined;

  const slug = useMemo(() => {
    if (mode !== "new") return draft.id;
    const base = slugify(draft.title) || "untitled-course";
    const taken = new Set([...seedCourses.map((c) => c.id), ...customCourses.map((c) => c.id)]);
    let candidate = base;
    let n = 2;
    while (taken.has(candidate)) candidate = `${base}-${n++}`;
    return candidate;
  }, [mode, draft.id, draft.title, customCourses]);

  function toggleFormat(f: LearningFormat, on: boolean) {
    patch({ formats: on ? FORMATS.filter((x) => x === f || draft.formats.includes(x)) : draft.formats.filter((x) => x !== f) });
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t) return;
    if (draft.tags.some((x) => x.toLowerCase() === t.toLowerCase())) {
      toast.info("Tag already added");
    } else if (draft.tags.length >= 6) {
      toast.error("Up to 6 tags per course");
    } else {
      patch({ tags: [...draft.tags, t] });
    }
    setTagInput("");
  }

  function handleSave() {
    setSubmitted(true);
    if (errorCount) {
      toast.error("Please fix the highlighted fields", { description: `${errorCount} issue${errorCount > 1 ? "s" : ""} need attention before saving.` });
      return;
    }
    const cleaned: Course = {
      ...draft,
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
      description: draft.description.trim(),
      pricing,
      outcomes: draft.outcomes.map((o) => o.trim()).filter(Boolean),
      includes: draft.includes.map((o) => o.trim()).filter(Boolean),
      lastUpdated: DEMO_TODAY,
    };

    if (mode === "new") {
      addCustomCourse({ ...cleaned, id: slug, status: draft.status === "in-review" ? "in-review" : "draft" });
      toast.success("Course created", {
        description: `“${cleaned.title}” was saved as ${draft.status === "in-review" ? "submitted for review" : "a draft"} and is now in the course list.`,
      });
      router.push("/admin/courses");
      return;
    }
    if (mode === "custom") {
      updateCustomCourse(draft.id, cleaned);
      toast.success("Changes saved", { description: `${cleaned.title} · ${COURSE_STATUS_META[cleaned.status].label}` });
    } else {
      const { status, ...rest } = cleaned;
      setCourseStatus(draft.id, status);
      saveCourseEdits(draft.id, rest);
      toast.success("Saved for this demo session", {
        description: `Status “${COURSE_STATUS_META[status].label}” applies across the demo; content and pricing edits are kept for this session.`,
      });
    }
    setDraft(cleaned);
    setSnapshot(fingerprint(cleaned, prices));
    setSubmitted(false);
  }

  const startingPrice = Object.values(pricing).length ? Math.min(...Object.values(pricing).map(Number)) : undefined;
  const lessonCount = draft.chapters.reduce((n, c) => n + c.lessons.length, 0);
  const totalSec = draft.chapters.reduce((n, c) => n + c.lessons.reduce((m, l) => m + l.durationSec, 0), 0);
  const statusOptions = (Object.keys(COURSE_STATUS_META) as Course["status"][]).filter((s) => mode !== "new" || s === "draft" || s === "in-review");

  const saveButton = (className?: string) => (
    <Button onClick={handleSave} className={cn("h-9 bg-brand px-4 text-brand-foreground hover:bg-brand/90", className)}>
      <Save className="size-4" />
      {mode === "new" ? "Create course" : "Save changes"}
    </Button>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="space-y-3">
        <Link href="/admin/courses" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          All courses
        </Link>
        <PageHeader
          eyebrow={mode === "new" ? "Content · New course" : "Content · Edit course"}
          title={mode === "new" ? "Create a course" : initial.title}
          description={
            mode === "new"
              ? "Set up the basics, learning levels and curriculum. New courses are saved as drafts until they are reviewed."
              : "Update the course details, learning levels, curriculum and publishing status."
          }
          actions={
            <>
              {dirty && (
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-warning-soft px-2.5 text-xs font-medium text-warning">
                  <span className="size-1.5 rounded-full bg-current" />
                  Unsaved changes
                </span>
              )}
              {mode === "seed" && !draft.collegeId && (
                <Button variant="outline" className="h-9" asChild>
                  <Link href={`/courses/${draft.id}`}>
                    <ExternalLink className="size-4" />
                    View in catalog
                  </Link>
                </Button>
              )}
              <Button variant="outline" className="h-9" asChild>
                <Link href="/admin/courses">Cancel</Link>
              </Button>
              {saveButton()}
            </>
          }
        />
      </div>

      {submitted && errorCount > 0 && (
        <InfoNote icon={CircleAlert} tone="warning">
          <span className="font-medium">{errorCount} field{errorCount > 1 ? "s" : ""} need attention.</span>{" "}
          {Object.values(allErrors).slice(0, 3).join(" ")}
          {errorCount > 3 ? " …" : ""}
        </InfoNote>
      )}
      {college && (
        <InfoNote tone="brand">
          Institution course for <span className="font-medium">{college.name}</span> — visible only to {college.shortName} students in their college-branded portal.
        </InfoNote>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          <Panel title="Basics" description="How the course appears in the catalog and search.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="title" label="Course title" required error={errors.title} className="sm:col-span-2">
                <Input id="title" value={draft.title} onChange={(e) => patch({ title: e.target.value })} aria-invalid={!!errors.title} placeholder="e.g. Negotiation Skills for Freshers" maxLength={80} />
              </Field>
              <Field id="subtitle" label="Subtitle" required error={errors.subtitle} className="sm:col-span-2">
                <Input id="subtitle" value={draft.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} aria-invalid={!!errors.subtitle} placeholder="One line on the outcome learners get" maxLength={120} />
              </Field>
              <Field id="description" label="Description" required error={errors.description} hint={`${draft.description.trim().length} characters`} className="sm:col-span-2">
                <Textarea
                  id="description"
                  value={draft.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  aria-invalid={!!errors.description}
                  rows={4}
                  className="min-h-24"
                  placeholder="Who is it for, what does it cover and how is it delivered?"
                />
              </Field>
              <Field id="category" label="Category" required>
                <Select value={draft.category} onValueChange={(v) => patch({ category: v as CourseCategory })}>
                  <SelectTrigger id="category" className="h-9! w-full">
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
              <Field id="duration" label="Duration" required error={errors.durationLabel}>
                <Input id="duration" value={draft.durationLabel} onChange={(e) => patch({ durationLabel: e.target.value })} aria-invalid={!!errors.durationLabel} placeholder="e.g. 4 weeks" className="h-9" />
              </Field>
              <Field id="mentor" label="Mentor" required error={errors.instructorId}>
                <Select value={draft.instructorId || undefined} onValueChange={(v) => patch({ instructorId: v })}>
                  <SelectTrigger id="mentor" className="h-9! w-full" aria-invalid={!!errors.instructorId}>
                    <SelectValue placeholder="Select a mentor" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentors.map((m) => (
                      <SelectItem key={m.id} value={m.id} disabled={m.status !== "active"}>
                        <Portrait avatar={m.avatar} name={m.name} className="size-5" />
                        {m.name}
                        {m.status !== "active" && <span className="text-xs text-muted-foreground">(pending approval)</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="space-y-1.5">
                <Label htmlFor="tag-input" className="text-[13px]">
                  Tags
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="tag-input"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Type a tag and press Enter"
                    className="h-9"
                    maxLength={24}
                  />
                  <Button variant="outline" className="h-9" onClick={addTag} aria-label="Add tag">
                    <Plus className="size-4" />
                  </Button>
                </div>
                {draft.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {draft.tags.map((t) => (
                      <span key={t} className="inline-flex h-6 items-center gap-1 rounded-full bg-secondary pr-1 pl-2.5 text-xs font-medium text-primary">
                        {t}
                        <button
                          type="button"
                          className="flex size-4 items-center justify-center rounded-full hover:bg-primary/10"
                          aria-label={`Remove tag ${t}`}
                          onClick={() => patch({ tags: draft.tags.filter((x) => x !== t) })}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <p className="text-[13px] font-medium" id="audience-label">
                  Audience<span className="text-destructive">*</span>
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-labelledby="audience-label">
                  {STAGES.map((s) => {
                    const on = draft.audience.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={on}
                        onClick={() => patch({ audience: on ? draft.audience.filter((x) => x !== s) : [...draft.audience, s] })}
                        className={cn(
                          "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                          on ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                        )}
                      >
                        {on && <Check className="size-3.5" />}
                        {STAGE_META[s].plural}
                      </button>
                    );
                  })}
                </div>
                {errors.audience && <p className="text-xs font-medium text-destructive">{errors.audience}</p>}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <p className="text-[13px] font-medium" id="artwork-label">
                  Catalog artwork
                </p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="artwork-label">
                  {THUMBNAIL_PRESETS.map((t, i) => {
                    const on = draft.thumbnail.from === t.from && draft.thumbnail.to === t.to;
                    return (
                      <button
                        key={t.from + t.to}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-label={`Artwork style ${i + 1}`}
                        onClick={() => patch({ thumbnail: t })}
                        className={cn(
                          "h-9 w-14 rounded-lg ring-offset-2 transition focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                          on ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100",
                        )}
                        style={{ backgroundImage: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Learning levels" description="Offer the course in one or more levels. Prices are in INR; 0 makes Self-Paced free.">
            <div className="space-y-3">
              {FORMATS.map((f) => {
                const on = draft.formats.includes(f);
                const err = errors[`price-${f}`];
                return (
                  <div key={f} className={cn("rounded-xl border p-3.5 transition-colors sm:p-4", on ? "border-primary/25 bg-secondary/40" : "bg-background")}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <Switch checked={on} onCheckedChange={(v) => toggleFormat(f, v)} aria-label={`Offer ${FORMAT_META[f].label}`} className="mt-0.5" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <FormatBadge format={f} showLevel />
                          </div>
                          <p className="mt-1 text-[13px] text-muted-foreground">{FORMAT_META[f].tagline}</p>
                        </div>
                      </div>
                      <div className="w-full sm:w-40">
                        <Label htmlFor={`price-${f}`} className="sr-only">
                          {FORMAT_META[f].label} price
                        </Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                          <Input
                            id={`price-${f}`}
                            type="number"
                            inputMode="numeric"
                            min={0}
                            step={1}
                            disabled={!on}
                            value={prices[f]}
                            onChange={(e) => setPrices((p) => ({ ...p, [f]: e.target.value }))}
                            aria-invalid={!!err}
                            className="h-9 bg-background pl-6 tabular-nums"
                          />
                        </div>
                        <p className="mt-1 text-right text-[11px] text-muted-foreground">
                          {on ? (prices[f].trim() === "0" ? "Free" : f === "mentoring" ? "per session pack" : "per learner") : "Not offered"}
                        </p>
                      </div>
                    </div>
                    {err && <p className="mt-2 text-xs font-medium text-destructive">{err}</p>}
                  </div>
                );
              })}
              {errors.formats && <p className="text-xs font-medium text-destructive">{errors.formats}</p>}
            </div>
          </Panel>

          <Panel title="Curriculum builder" description="Chapters and lessons in learning order. Video lessons link to recordings in the central video library.">
            {errors.curriculum && (
              <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-destructive">
                <CircleAlert className="size-3.5" />
                {errors.curriculum}
              </p>
            )}
            <CurriculumBuilder courseId={draft.id} chapters={draft.chapters} onChange={(chapters) => patch({ chapters })} errors={errors} />
          </Panel>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Learning outcomes" description="What learners will be able to do after the course.">
              <ListEditor
                idPrefix="outcome"
                items={draft.outcomes}
                onChange={(outcomes) => patch({ outcomes })}
                placeholder="e.g. Structure answers using the STAR method"
                addLabel="Add outcome"
                max={8}
              />
              {errors.outcomes && <p className="mt-2 text-xs font-medium text-destructive">{errors.outcomes}</p>}
            </Panel>
            <Panel title="Included resources" description="Shown in the “This course includes” list.">
              <ListEditor
                idPrefix="include"
                items={draft.includes}
                onChange={(includes) => patch({ includes })}
                placeholder="e.g. Downloadable worksheet (PDF)"
                addLabel="Add resource"
                max={10}
              />
            </Panel>
          </div>

          <div className="flex justify-end gap-2 border-t pt-5">
            <Button variant="outline" className="h-9" asChild>
              <Link href="/admin/courses">Cancel</Link>
            </Button>
            {saveButton()}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <Panel title="Status & publishing" bodyClassName="space-y-4">
            <RadioGroup value={draft.status} onValueChange={(v) => patch({ status: v as Course["status"] })} className="gap-2">
              {(Object.keys(COURSE_STATUS_META) as Course["status"][]).map((s) => {
                const disabled = !statusOptions.includes(s);
                return (
                  <label
                    key={s}
                    htmlFor={`status-${s}`}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                      draft.status === s ? "border-primary/40 bg-secondary/50" : "hover:bg-muted/50",
                      disabled && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <RadioGroupItem id={`status-${s}`} value={s} disabled={disabled} className="mt-0.5" />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {COURSE_STATUS_META[s].label}
                        {initial.status === s && mode !== "new" && <span className="text-[11px] font-normal text-muted-foreground">(current)</span>}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{COURSE_STATUS_META[s].description}</span>
                    </span>
                  </label>
                );
              })}
            </RadioGroup>
            {mode === "new" && <p className="text-xs text-muted-foreground">New courses start as drafts. Publish them from the course list after review.</p>}
            <div className="space-y-1.5 rounded-lg bg-muted/50 p-3 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Course URL</span>
                <span className="truncate font-mono text-[11px]">/courses/{slug || "…"}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Last updated</span>
                <span>{formatDate(initial.lastUpdated)}</span>
              </div>
              {mode !== "new" && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Learners</span>
                  <span className="tabular-nums">{formatNumber(initial.learners)}</span>
                </div>
              )}
            </div>
            {saveButton("w-full")}
          </Panel>

          <Panel title="Live preview" description="How the catalog card will look." bodyClassName="p-4">
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <CourseThumbnail course={{ ...draft, title: draft.title || "Untitled course" }} />
              <div className="space-y-2.5 p-4">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{draft.category}</span>
                  <span>{draft.durationLabel || "—"}</span>
                </div>
                <div>
                  <p className="font-heading leading-snug font-semibold">{draft.title || "Untitled course"}</p>
                  <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">{draft.subtitle || "Your subtitle appears here."}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {draft.formats.map((f) => (
                    <FormatBadge key={f} format={f} short />
                  ))}
                </div>
                <div className="flex items-center justify-between gap-2 border-t pt-2.5 text-[13px]">
                  <span className="text-muted-foreground">
                    {lessonCount} lessons · {formatDuration(totalSec)}
                  </span>
                  <span className="font-semibold">{startingPrice === undefined ? "—" : startingPrice === 0 ? "Free" : `From ${formatINR(startingPrice)}`}</span>
                </div>
                {mentor && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Portrait avatar={mentor.avatar} name={mentor.name} className="size-6" />
                    {mentor.name}
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <Panel title="Associated mentor" bodyClassName="p-4">
            {mentor ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Portrait avatar={mentor.avatar} name={mentor.name} className="size-12" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{mentor.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{mentor.title}</p>
                    <Rating value={mentor.rating} count={mentor.reviewCount} className="mt-0.5" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {mentor.expertise.slice(0, 4).map((x) => (
                    <span key={x} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      {x}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="size-3.5" />
                    {formatNumber(mentor.sessionsDelivered)} sessions delivered
                  </span>
                  <AutoStatus status={mentor.status} />
                </div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/admin/mentors">Open mentor directory</Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No mentor assigned yet. Choose one under Basics — they will be able to upload recordings for this course from the Mentor Portal.</p>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function ListEditor({
  idPrefix,
  items,
  onChange,
  placeholder,
  addLabel,
  max,
}: {
  idPrefix: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  addLabel: string;
  max: number;
}) {
  return (
    <div className="space-y-2">
      {items.length === 0 && <p className="text-sm text-muted-foreground">Nothing added yet.</p>}
      {items.map((item, i) => (
        <div key={`${idPrefix}-${i}`} className="flex items-center gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand tabular-nums">{i + 1}</span>
          <Input
            value={item}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
            placeholder={placeholder}
            aria-label={`${addLabel.replace("Add ", "")} ${i + 1}`}
            className="h-8"
          />
          <Button variant="ghost" size="icon-sm" aria-label={`Remove item ${i + 1}`} className="text-muted-foreground hover:text-destructive" onClick={() => onChange(items.filter((_, j) => j !== i))}>
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="text-primary"
        disabled={items.length >= max}
        onClick={() => onChange([...items, ""])}
      >
        <Plus className="size-3.5" />
        {addLabel}
        {items.length >= max && <span className="text-muted-foreground">(max {max})</span>}
      </Button>
    </div>
  );
}
