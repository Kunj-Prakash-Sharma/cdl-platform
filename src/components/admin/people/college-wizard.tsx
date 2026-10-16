"use client";

import { useState } from "react";
import Link from "next/link";
import { addYears, format, parseISO, subDays } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, CircleCheckBig, Monitor, Pencil, Plus, ShieldCheck, Smartphone, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FormatBadge } from "@/components/shared/badges";
import { CourseIcon } from "@/components/shared/course-thumbnail";
import { PageHeader } from "@/components/shared/page-header";
import { collegePlans, publicCourses } from "@/data";
import { DEMO_TODAY } from "@/data/constants";
import { formatDate, formatINR, formatNumber } from "@/lib/format";
import type { College } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { Segmented } from "@/components/admin/insights/ui";
import { CampusPreview } from "./campus-preview";
import { COLLEGE_TYPES } from "./college-sheet";
import { BRAND_PRESETS } from "./people-utils";

const STEPS = ["Institution details", "Plan & access", "Eligible programs", "Portal preview", "Review & confirm"];

const STATES = [
  "Andhra Pradesh",
  "Delhi",
  "Gujarat",
  "Haryana",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal",
];

const DEPT_SUGGESTIONS: Record<College["type"], string[]> = {
  Engineering: ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil"],
  Management: ["MBA", "PGDM", "BBA", "BMS"],
  "Arts & Commerce": ["B.Com", "BBA", "BA Economics", "BA Psychology", "BA English"],
  University: ["Engineering", "Management", "Sciences", "Humanities", "Law"],
  School: ["Grade 9", "Grade 10", "Grade 11", "Grade 12"],
};

const PLAN_LIMITS: Record<College["plan"], { max?: number; min?: number }> = {
  "Campus Starter": { max: 250 },
  "Campus Pro": { max: 1000 },
  "Campus Enterprise": { min: 1000 },
};

interface Details {
  name: string;
  shortName: string;
  type: College["type"] | "";
  city: string;
  state: string;
  departments: string[];
  contactName: string;
  contactEmail: string;
  brandColor: string;
}

const EMPTY: Details = { name: "", shortName: "", type: "", city: "", state: "", departments: [], contactName: "", contactEmail: "", brandColor: BRAND_PRESETS[1] };
const DEFAULT_COURSES = ["campus-placement-readiness", "interview-preparation", "resume-building", "communication-skills"];

type Errors = Partial<Record<keyof Details | "seats" | "courses" | "confirm", string>>;

export function CollegeWizard() {
  const addCollege = useDemoStore((s) => s.addCollege);
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [d, setD] = useState<Details>(EMPTY);
  const [deptInput, setDeptInput] = useState("");
  const [planId, setPlanId] = useState<College["plan"]>("Campus Pro");
  const [seats, setSeats] = useState("300");
  const [courseIds, setCourseIds] = useState<string[]>(DEFAULT_COURSES);
  const [allowContent, setAllowContent] = useState(true);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [created, setCreated] = useState<College | null>(null);

  const plan = collegePlans.find((p) => p.id === planId)!;
  const seatCount = Number(seats);
  const annual = Number.isFinite(seatCount) && seatCount > 0 ? seatCount * plan.pricePerSeat : 0;
  const licenceEnds = format(subDays(addYears(parseISO(DEMO_TODAY), 1), 1), "yyyy-MM-dd");
  const set = <K extends keyof Details>(k: K, v: Details[K]) => setD((s) => ({ ...s, [k]: v }));

  const validate = (i: number): Errors => {
    const e: Errors = {};
    if (i === 0) {
      if (d.name.trim().length < 3) e.name = "Enter the institution's full name.";
      if (!/^[A-Za-z0-9]{2,6}$/.test(d.shortName.trim())) e.shortName = "2–6 letters or numbers, e.g. “SVIT”.";
      if (!d.type) e.type = "Choose an institution type.";
      if (!d.city.trim()) e.city = "Enter a city.";
      if (!d.state) e.state = "Choose a state.";
      if (d.departments.length === 0) e.departments = "Add at least one department.";
      if (!d.contactName.trim()) e.contactName = "Enter the contact person's name.";
      if (!/^\S+@\S+\.\S+$/.test(d.contactEmail.trim())) e.contactEmail = "Enter a valid email address.";
    }
    if (i === 1) {
      const lim = PLAN_LIMITS[planId];
      if (!Number.isInteger(seatCount) || seatCount < 25) e.seats = "Enter at least 25 seats.";
      else if (lim.max && seatCount > lim.max) e.seats = `${planId} covers up to ${formatNumber(lim.max)} students — choose a larger plan or reduce seats.`;
      else if (lim.min && seatCount < lim.min) e.seats = `${planId} starts at ${formatNumber(lim.min)} seats — choose Campus Pro for fewer students.`;
    }
    if (i === 2 && courseIds.length === 0) e.courses = "Select at least one program.";
    if (i === 4 && !agreed) e.confirm = "Confirm the access agreement to continue.";
    return e;
  };

  const goTo = (i: number) => {
    setErrors({});
    setStep(i);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    const n = step + 1;
    setMaxStep((m) => Math.max(m, n));
    goTo(n);
  };

  const confirm = () => {
    const e = validate(4);
    setErrors(e);
    if (Object.keys(e).length) return;
    const college = addCollege({
      name: d.name.trim(),
      shortName: d.shortName.trim().toUpperCase(),
      city: d.city.trim(),
      state: d.state,
      type: d.type as College["type"],
      brandColor: d.brandColor,
      plan: planId,
      seats: seatCount,
      activeStudents: 0,
      assignedCourseIds: courseIds,
      status: "onboarding",
      contactName: d.contactName.trim(),
      contactEmail: d.contactEmail.trim(),
      onboardedOn: DEMO_TODAY,
      licenceEnds,
      departments: d.departments,
    });
    setCreated(college);
    toast.success(`${college.shortName} added to the college directory`, { description: "Status: onboarding. Student invites can be sent next (simulated)." });
  };

  const addDept = (name: string) => {
    const v = name.trim();
    if (!v || d.departments.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    set("departments", [...d.departments, v]);
  };

  const restart = () => {
    setCreated(null);
    setD(EMPTY);
    setPlanId("Campus Pro");
    setSeats("300");
    setCourseIds(DEFAULT_COURSES);
    setAllowContent(true);
    setAgreed(false);
    setStep(0);
    setMaxStep(0);
  };

  if (created) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl border bg-card p-6 text-center shadow-xs md:p-10">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
            <CircleCheckBig className="size-7" />
          </span>
          <h1 className="mt-4 font-heading text-2xl font-semibold">{created.name} is being onboarded</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            {created.plan} · {formatNumber(created.seats)} seats · {created.assignedCourseIds.length} programs · licence until {formatDate(created.licenceEnds)}. The college now
            appears in the directory with status “Onboarding”.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button asChild className="h-10 bg-brand px-4 text-brand-foreground hover:bg-brand/90">
              <Link href={`/admin/colleges?open=${created.id}`}>View {created.shortName} details</Link>
            </Button>
            <Button asChild variant="outline" className="h-10 px-4">
              <Link href="/admin/colleges">Go to college directory</Link>
            </Button>
            <Button variant="ghost" className="h-10 px-4" onClick={restart}>
              <Plus /> Onboard another college
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <h2 className="font-heading text-[15px] font-semibold">Next steps</h2>
          <ul className="mt-3 divide-y">
            {[
              { t: "Invite students", s: "Upload a CSV of student emails and roll numbers.", a: "Upload CSV", msg: "Student roster upload opened (simulated)." },
              { t: "Share admin access", s: `Send ${created.contactName} a sign-in link to the college portal.`, a: "Send link", msg: `Admin invite sent to ${created.contactEmail} (simulated).` },
              { t: "Schedule a kick-off call", s: "30-minute walkthrough of reports and cohorts.", a: "Schedule", msg: "Kick-off call proposed for Tue, 20 Oct · 11:00 AM (simulated)." },
            ].map((x) => (
              <li key={x.t} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{x.t}</p>
                  <p className="text-xs text-muted-foreground">{x.s}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => toast.success(x.t, { description: x.msg })}>
                  {x.a === "Upload CSV" && <Upload />} {x.a}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow={
          <Link href="/admin/colleges" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="size-3.5" /> Colleges
          </Link>
        }
        title="Onboard a college"
        description="Set up a partner institution, its access package and branded student portal. Everything here is simulated — no real tenant is created."
      />

      {/* Stepper */}
      <nav aria-label="Onboarding steps" className="rounded-2xl border bg-card p-3 shadow-xs">
        <ol className="hidden grid-cols-5 gap-2 md:grid">
          {STEPS.map((label, i) => {
            const done = i < step;
            const current = i === step;
            const reachable = i <= maxStep;
            return (
              <li key={label}>
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => goTo(i)}
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors",
                    current ? "bg-secondary" : reachable ? "hover:bg-muted" : "opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      done ? "bg-brand text-brand-foreground" : current ? "bg-primary text-primary-foreground" : "border bg-background text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="size-3.5" /> : i + 1}
                  </span>
                  <span className={cn("text-[13px] leading-tight", current ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="md:hidden">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">{STEPS[step]}</span>
            <span className="text-xs text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
          <div className="mt-2 flex gap-1">
            {STEPS.map((s, i) => (
              <span key={s} className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-brand" : "bg-muted")} />
            ))}
          </div>
        </div>
      </nav>

      <div className="rounded-2xl border bg-card shadow-xs">
        <div className="p-5 md:p-6">
          {step === 0 && (
            <div className="space-y-5">
              <StepTitle title="Institution details" description="Basic information shown in the directory and on the branded portal." />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field id="w-name" label="Institution name" error={errors.name} className="sm:col-span-2">
                  <Input id="w-name" className="h-10" placeholder="e.g. Sahyadri Valley Institute of Technology" value={d.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} />
                </Field>
                <Field id="w-short" label="Short name" error={errors.shortName}>
                  <Input id="w-short" className="h-10 uppercase" placeholder="SVIT" maxLength={6} value={d.shortName} onChange={(e) => set("shortName", e.target.value)} aria-invalid={!!errors.shortName} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field id="w-type" label="Institution type" error={errors.type}>
                  <Select value={d.type} onValueChange={(v) => set("type", v as College["type"])}>
                    <SelectTrigger id="w-type" className="h-10 w-full" aria-invalid={!!errors.type}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLLEGE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field id="w-city" label="City" error={errors.city}>
                  <Input id="w-city" className="h-10" placeholder="e.g. Nashik" value={d.city} onChange={(e) => set("city", e.target.value)} aria-invalid={!!errors.city} />
                </Field>
                <Field id="w-state" label="State" error={errors.state}>
                  <Select value={d.state} onValueChange={(v) => set("state", v)}>
                    <SelectTrigger id="w-state" className="h-10 w-full" aria-invalid={!!errors.state}>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field id="w-dept" label="Departments" error={errors.departments}>
                <div className="flex flex-wrap gap-1.5">
                  {d.departments.map((dep) => (
                    <span key={dep} className="inline-flex items-center gap-1 rounded-full bg-secondary py-1 pr-1 pl-2.5 text-xs font-medium text-primary">
                      {dep}
                      <button type="button" aria-label={`Remove ${dep}`} className="rounded-full p-0.5 hover:bg-primary/10" onClick={() => set("departments", d.departments.filter((x) => x !== dep))}>
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  {d.departments.length === 0 && <span className="text-xs text-muted-foreground">No departments yet — add from suggestions or type your own.</span>}
                </div>
                <div className="mt-2 flex gap-2">
                  <Input
                    id="w-dept"
                    className="h-9"
                    placeholder="Add a department and press Enter"
                    value={deptInput}
                    onChange={(e) => setDeptInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addDept(deptInput);
                        setDeptInput("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9"
                    onClick={() => {
                      addDept(deptInput);
                      setDeptInput("");
                    }}
                  >
                    <Plus /> Add
                  </Button>
                </div>
                {d.type && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Suggested:</span>
                    {DEPT_SUGGESTIONS[d.type]
                      .filter((s) => !d.departments.includes(s))
                      .map((s) => (
                        <button key={s} type="button" onClick={() => addDept(s)} className="rounded-full border border-dashed px-2.5 py-0.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
                          + {s}
                        </button>
                      ))}
                  </div>
                )}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="w-contact" label="Contact person" error={errors.contactName}>
                  <Input id="w-contact" className="h-10" placeholder="e.g. Dr. Kiran Deshpande (Placement Officer)" value={d.contactName} onChange={(e) => set("contactName", e.target.value)} aria-invalid={!!errors.contactName} />
                </Field>
                <Field id="w-email" label="Contact email" error={errors.contactEmail}>
                  <Input id="w-email" type="email" className="h-10" placeholder="tpo@institution.demo" value={d.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} aria-invalid={!!errors.contactEmail} />
                </Field>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Brand colour</p>
                <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Brand colour">
                  {BRAND_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      role="radio"
                      aria-checked={d.brandColor === color}
                      aria-label={`Brand colour ${color}`}
                      onClick={() => set("brandColor", color)}
                      className={cn("flex size-9 items-center justify-center rounded-full ring-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring", d.brandColor === color && "ring-2 ring-foreground")}
                      style={{ backgroundColor: color }}
                    >
                      {d.brandColor === color && <Check className="size-4 text-white" />}
                    </button>
                  ))}
                  <span className="ml-2 inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs">
                    <span className="flex size-6 items-center justify-center rounded-md text-[9px] font-bold text-white" style={{ backgroundColor: d.brandColor }}>
                      {(d.shortName || "ABC").slice(0, 4).toUpperCase()}
                    </span>
                    Portal badge preview
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <StepTitle title="Plan & access package" description="Annual licence priced per student seat. Payments and invoices are simulated." />
              <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="Plan">
                {collegePlans.map((p) => {
                  const on = p.id === planId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => {
                        setPlanId(p.id);
                        setErrors({});
                      }}
                      className={cn(
                        "relative rounded-xl border p-4 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        on ? "border-brand bg-brand-soft/40 ring-1 ring-brand" : "hover:border-primary/30",
                      )}
                    >
                      {on && (
                        <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-brand text-brand-foreground">
                          <Check className="size-3" />
                        </span>
                      )}
                      <p className="font-heading font-semibold">{p.id}</p>
                      <p className="text-xs text-muted-foreground">{p.seatsLabel}</p>
                      <p className="mt-3 text-xl font-semibold">
                        {formatINR(p.pricePerSeat)}
                        <span className="text-xs font-normal text-muted-foreground"> / seat / year</span>
                      </p>
                      <ul className="mt-3 space-y-1.5">
                        {p.features.map((f) => (
                          <li key={f} className="flex gap-1.5 text-xs text-foreground/80">
                            <Check className="mt-0.5 size-3.5 shrink-0 text-brand" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
              <div className="grid gap-4 rounded-xl border bg-muted/30 p-4 sm:grid-cols-[14rem_1fr] sm:items-start">
                <Field id="w-seats" label="Student seats" error={errors.seats}>
                  <Input id="w-seats" type="number" min={25} inputMode="numeric" className="h-10 bg-background" value={seats} onChange={(e) => setSeats(e.target.value)} aria-invalid={!!errors.seats} />
                </Field>
                <div className="rounded-lg border bg-background p-3.5">
                  <p className="text-xs text-muted-foreground">Annual licence (computed)</p>
                  <p className="mt-0.5 font-heading text-2xl font-semibold">{formatINR(annual)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {Number.isFinite(seatCount) && seatCount > 0 ? formatNumber(seatCount) : 0} seats × {formatINR(plan.pricePerSeat)} · ≈ {formatINR(Math.round(plan.pricePerSeat / 12))} per student per
                    month · excl. GST · billed annually (simulated)
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <StepTitle
                title="Eligible programs"
                description="Choose which public-catalog programs this institution's students can access."
                action={
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setCourseIds(publicCourses.map((c) => c.id))}>
                      Select all
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setCourseIds([])}>
                      Clear
                    </Button>
                  </div>
                }
              />
              {errors.courses && <p className="text-sm text-destructive">{errors.courses}</p>}
              <div className="grid gap-2 sm:grid-cols-2">
                {publicCourses.map((c) => {
                  const on = courseIds.includes(c.id);
                  const id = `w-course-${c.id}`;
                  return (
                    <label
                      key={c.id}
                      htmlFor={id}
                      className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition", on ? "border-brand/50 bg-brand-soft/30" : "hover:border-primary/30")}
                    >
                      <Checkbox
                        id={id}
                        checked={on}
                        onCheckedChange={(v) => setCourseIds((ids) => (v ? [...ids, c.id] : ids.filter((x) => x !== c.id)))}
                        className="data-checked:border-brand data-checked:bg-brand"
                      />
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundImage: `linear-gradient(135deg, ${c.thumbnail.from}, ${c.thumbnail.to})` }}>
                        <CourseIcon theme={c.thumbnail} className="size-4 text-white" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">{c.title}</span>
                        <span className="mt-0.5 flex flex-wrap gap-1">
                          {c.formats.slice(0, 2).map((f) => (
                            <FormatBadge key={f} format={f} short className="h-5 px-2 text-[10px]" />
                          ))}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <div className="flex items-start justify-between gap-4 rounded-xl border bg-muted/30 p-4">
                <div>
                  <Label htmlFor="w-allow">Allow institution-provided content</Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">Faculty can upload their own videos and resources to a “From your institution” shelf (reviewed by CDL before publishing).</p>
                </div>
                <Switch id="w-allow" checked={allowContent} onCheckedChange={setAllowContent} className="data-checked:bg-brand" />
              </div>
              <p className="text-xs text-muted-foreground">{courseIds.length} programs selected.</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <StepTitle
                title="Preview the student portal"
                description="How students will see their branded portal on day one (sample student shown)."
                action={
                  <Segmented
                    label="Preview device"
                    value={device}
                    onChange={setDevice}
                    options={[
                      { value: "desktop", label: "Desktop" },
                      { value: "mobile", label: "Mobile" },
                    ]}
                  />
                }
              />
              <div className="flex justify-center rounded-xl bg-muted/50 p-4 md:p-6">
                <div className={cn("w-full transition-all", device === "mobile" ? "max-w-[340px]" : "max-w-3xl")}>
                  <CampusPreview
                    name={d.name}
                    shortName={d.shortName.toUpperCase()}
                    brandColor={d.brandColor}
                    courseIds={courseIds}
                    departments={d.departments}
                    allowInstitutionContent={allowContent}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {device === "mobile" ? <Smartphone className="size-3.5" /> : <Monitor className="size-3.5" />}
                Brand colour, short name and program list come from the previous steps.
                <Button size="xs" variant="ghost" onClick={() => goTo(0)}>
                  <Pencil /> Change branding
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <StepTitle title="Review & confirm" description="Check the details below. You can edit any section before confirming." />
              <div className="grid gap-3 md:grid-cols-2">
                <ReviewCard title="Institution" onEdit={() => goTo(0)}>
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-lg text-[11px] font-bold text-white" style={{ backgroundColor: d.brandColor }}>
                      {d.shortName.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.type} · {d.city}, {d.state}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Departments: {d.departments.join(", ")}</p>
                  <p className="text-xs text-muted-foreground">
                    Contact: {d.contactName} · {d.contactEmail}
                  </p>
                </ReviewCard>
                <ReviewCard title="Plan & access" onEdit={() => goTo(1)}>
                  <p className="font-medium">{planId}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(seatCount)} seats × {formatINR(plan.pricePerSeat)} = <span className="font-semibold text-foreground">{formatINR(annual)}</span> / year
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Licence {formatDate(DEMO_TODAY)} → {formatDate(licenceEnds)}
                  </p>
                </ReviewCard>
                <ReviewCard title={`Programs (${courseIds.length})`} onEdit={() => goTo(2)} className="md:col-span-2">
                  <div className="flex flex-wrap gap-1.5">
                    {courseIds.map((id) => (
                      <span key={id} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-primary">
                        {publicCourses.find((c) => c.id === id)?.title ?? id}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Institution-provided content: {allowContent ? "allowed" : "not allowed"}</p>
                </ReviewCard>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2.5">
                  <Checkbox id="w-agree" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} aria-invalid={!!errors.confirm} className="mt-0.5" />
                  <Label htmlFor="w-agree" className="leading-snug font-normal">
                    The institution has accepted the CDL campus access agreement (simulated). The college will be created with status “Onboarding”.
                  </Label>
                </div>
                {errors.confirm && <p className="pl-6 text-xs text-destructive">{errors.confirm}</p>}
              </div>
              <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-info" />
                Prototype only: confirming adds the college to this demo&apos;s directory. No real tenant, data isolation, invoice or email is created.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-5 py-3 md:px-6">
          {step === 0 ? (
            <Button asChild variant="ghost" className="h-10">
              <Link href="/admin/colleges">Cancel</Link>
            </Button>
          ) : (
            <Button variant="outline" className="h-10" onClick={() => goTo(step - 1)}>
              <ArrowLeft /> Back
            </Button>
          )}
          {Object.keys(errors).length > 0 && <p className="hidden text-xs text-destructive sm:block">Please fix the highlighted fields.</p>}
          {step < STEPS.length - 1 ? (
            <Button className="h-10 px-5" onClick={next}>
              Continue <ArrowRight />
            </Button>
          ) : (
            <Button className="h-10 bg-brand px-5 text-brand-foreground hover:bg-brand/90" onClick={confirm}>
              <Check /> Confirm & onboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepTitle({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Field({ id, label, error, children, className }: { id: string; label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ReviewCard({ title, onEdit, children, className }: { title: string; onEdit: () => void; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border p-4 text-[13px]", className)}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</p>
        <Button size="xs" variant="ghost" onClick={onEdit}>
          <Pencil /> Edit
        </Button>
      </div>
      {children}
    </div>
  );
}
