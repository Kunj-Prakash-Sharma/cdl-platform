"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, ExternalLink, Eye, EyeOff, Mail, Pause, Play, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AutoStatus } from "@/components/shared/badges";
import { CourseIcon } from "@/components/shared/course-thumbnail";
import { collegePlans, courses, publicCourses } from "@/data";
import { DEMO_COLLEGE_ID } from "@/data/constants";
import { formatDate, formatINR, formatNumber } from "@/lib/format";
import type { College } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { CampusPreview } from "./campus-preview";
import { BRAND_PRESETS } from "./people-utils";

export const COLLEGE_TYPES: College["type"][] = ["Engineering", "Management", "Arts & Commerce", "University", "School"];

export function CollegeSheet({ college, onOpenChange }: { college: College | undefined; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={!!college} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">{college && <Body key={college.id} c={college} />}</SheetContent>
    </Sheet>
  );
}

function Body({ c }: { c: College }) {
  const updateCollege = useDemoStore((s) => s.updateCollege);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmPause, setConfirmPause] = useState(false);
  const plan = collegePlans.find((p) => p.id === c.plan);
  const utilisation = c.seats ? Math.round((c.activeStudents / c.seats) * 100) : 0;
  const institutionCourses = courses.filter((x) => x.collegeId === c.id);
  const catalog = [...institutionCourses, ...publicCourses];

  const setStatus = (status: College["status"], message: string) => {
    updateCollege(c.id, { status });
    toast.success(message, { description: `${c.name} is now “${status.replace("-", " ")}”.` });
  };

  const toggleCourse = (courseId: string, on: boolean) => {
    const next = on ? [...c.assignedCourseIds, courseId] : c.assignedCourseIds.filter((id) => id !== courseId);
    updateCollege(c.id, { assignedCourseIds: next });
    const title = courses.find((x) => x.id === courseId)?.title;
    toast.success(on ? "Program assigned" : "Program removed", { description: `${title} ${on ? "is now available to" : "was removed from"} ${c.shortName} students.` });
  };

  return (
    <>
      <div className="h-2 w-full" style={{ backgroundColor: c.brandColor }} />
      <SheetHeader className="border-b px-5 pt-4 pb-4">
        <div className="flex items-center gap-3 pr-8">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: c.brandColor }}>
            {c.shortName}
          </span>
          <div className="min-w-0">
            <SheetTitle className="truncate text-lg font-semibold">{c.name}</SheetTitle>
            <SheetDescription>
              {c.type} · {c.city}, {c.state}
            </SheetDescription>
            <div className="mt-1.5">
              <AutoStatus status={c.status} />
            </div>
          </div>
        </div>
      </SheetHeader>

      <Tabs defaultValue="overview" className="px-5 py-4">
        <TabsList className="w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="programs">Programs ({c.assignedCourseIds.length})</TabsTrigger>
          <TabsTrigger value="edit">Edit details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-3 space-y-5">
          <dl className="grid grid-cols-2 gap-3 text-[13px]">
            <Stat k="Plan" v={c.plan} sub={plan ? `${formatINR(plan.pricePerSeat)} / seat / year` : undefined} />
            <Stat k="Licence" v={`Ends ${formatDate(c.licenceEnds)}`} sub={`Onboarded ${formatDate(c.onboardedOn)}`} />
            <Stat k="Seats" v={formatNumber(c.seats)} sub={plan ? `Annual value ${formatINR(c.seats * plan.pricePerSeat)}` : undefined} />
            <Stat k="Active students" v={formatNumber(c.activeStudents)} sub={`${utilisation}% seat utilisation`} />
          </dl>
          <Progress value={utilisation} className="h-1.5 [&>[data-slot=progress-indicator]]:bg-brand" aria-label="Seat utilisation" />

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Departments</p>
            <div className="flex flex-wrap gap-1.5">
              {c.departments.map((d) => (
                <span key={d} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-primary">
                  {d}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Primary contact</p>
            <div className="flex flex-wrap items-center gap-3 text-[13px]">
              <span className="flex items-center gap-1.5 font-medium">
                <UserRound className="size-4 text-muted-foreground" /> {c.contactName}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="size-4" /> {c.contactEmail}
              </span>
              <Button
                size="xs"
                variant="outline"
                className="ml-auto"
                onClick={() => toast.success(`Email drafted to ${c.contactName}`, { description: "Opened in the admin outbox (simulated — nothing is sent)." })}
              >
                Contact
              </Button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Access status</p>
            <div className="flex flex-wrap gap-2">
              {c.status === "pending-review" && (
                <Button size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => setStatus("onboarding", "Application approved")}>
                  <Check /> Approve & start onboarding
                </Button>
              )}
              {(c.status === "onboarding" || c.status === "paused" || c.status === "pending-review") && (
                <Button size="sm" variant={c.status === "pending-review" ? "outline" : "default"} onClick={() => setStatus("active", "College activated")}>
                  <Play /> Activate
                </Button>
              )}
              {c.status === "active" && (
                <Button size="sm" variant="destructive" onClick={() => setConfirmPause(true)}>
                  <Pause /> Pause access
                </Button>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Student portal</p>
            {c.id === DEMO_COLLEGE_ID ? (
              <Button asChild size="sm" variant="outline">
                <Link href="/campus">
                  <ExternalLink /> Preview student portal
                </Link>
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setShowPreview((v) => !v)}>
                {showPreview ? <EyeOff /> : <Eye />} {showPreview ? "Hide preview" : "Preview student portal"}
              </Button>
            )}
            {showPreview && c.id !== DEMO_COLLEGE_ID && (
              <CampusPreview className="mt-3" name={c.name} shortName={c.shortName} brandColor={c.brandColor} courseIds={c.assignedCourseIds} departments={c.departments} />
            )}
          </div>

          <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-info" />
            Institution data and student progress are shown only to this college&apos;s admins (simulated — no real tenant isolation in this prototype).
          </p>
        </TabsContent>

        <TabsContent value="programs" className="mt-3">
          <p className="mb-3 text-[13px] text-muted-foreground">Toggle which programs {c.shortName} students can access. Changes apply immediately.</p>
          <ul className="divide-y rounded-xl border">
            {catalog.map((course) => {
              const on = c.assignedCourseIds.includes(course.id);
              const id = `assign-${c.id}-${course.id}`;
              return (
                <li key={course.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundImage: `linear-gradient(135deg, ${course.thumbnail.from}, ${course.thumbnail.to})` }}>
                    <CourseIcon theme={course.thumbnail} className="size-4 text-white" />
                  </span>
                  <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
                    <span className="block truncate text-[13px] font-medium">{course.title}</span>
                    <span className="block text-xs text-muted-foreground">{course.collegeId ? "Institution course" : course.category}</span>
                  </label>
                  <Switch id={id} checked={on} onCheckedChange={(v) => toggleCourse(course.id, v)} className="data-checked:bg-brand" />
                </li>
              );
            })}
          </ul>
        </TabsContent>

        <TabsContent value="edit" className="mt-3">
          <EditForm c={c} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmPause} onOpenChange={setConfirmPause}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause access for {c.shortName}?</AlertDialogTitle>
            <AlertDialogDescription>
              {formatNumber(c.activeStudents)} students will lose access to the branded portal until you reactivate it. Progress is kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => setStatus("paused", "Access paused")}>
              Pause access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Stat({ k, v, sub }: { k: string; v: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <dt className="text-[11px] text-muted-foreground">{k}</dt>
      <dd className="text-sm font-semibold">{v}</dd>
      {sub && <dd className="text-[11px] text-muted-foreground">{sub}</dd>}
    </div>
  );
}

type FormState = Pick<College, "name" | "shortName" | "city" | "state" | "type" | "plan" | "contactName" | "contactEmail" | "brandColor"> & { seats: string; departments: string };

function EditForm({ c }: { c: College }) {
  const updateCollege = useDemoStore((s) => s.updateCollege);
  const initial: FormState = { ...c, seats: String(c.seats), departments: c.departments.join(", ") };
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 3) next.name = "Enter the institution's full name.";
    if (!/^[A-Za-z0-9]{2,6}$/.test(form.shortName.trim())) next.shortName = "2–6 letters or numbers.";
    if (!form.city.trim()) next.city = "Required.";
    if (!form.state.trim()) next.state = "Required.";
    if (!form.contactName.trim()) next.contactName = "Required.";
    if (!/^\S+@\S+\.\S+$/.test(form.contactEmail.trim())) next.contactEmail = "Enter a valid email address.";
    const seats = Number(form.seats);
    if (!Number.isInteger(seats) || seats < 25) next.seats = "At least 25 seats.";
    setErrors(next);
    if (Object.keys(next).length) return;
    updateCollege(c.id, {
      name: form.name.trim(),
      shortName: form.shortName.trim().toUpperCase(),
      city: form.city.trim(),
      state: form.state.trim(),
      type: form.type,
      plan: form.plan,
      seats,
      contactName: form.contactName.trim(),
      contactEmail: form.contactEmail.trim(),
      brandColor: form.brandColor,
      departments: form.departments.split(",").map((d) => d.trim()).filter(Boolean),
    });
    toast.success("College details saved", { description: `${form.name.trim()} has been updated.` });
  };

  const field = (k: keyof FormState, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`edit-${k}`}>{label}</Label>
      <Input
        id={`edit-${k}`}
        value={form[k]}
        onChange={(e) => set(k, e.target.value as FormState[typeof k])}
        aria-invalid={!!errors[k]}
        className="h-9"
        {...props}
      />
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <form onSubmit={save} className="space-y-4" noValidate>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">{field("name", "Institution name")}</div>
        {field("shortName", "Short name")}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {field("city", "City")}
        {field("state", "State")}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="edit-type">Type</Label>
          <Select value={form.type} onValueChange={(v) => set("type", v as College["type"])}>
            <SelectTrigger id="edit-type" className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLLEGE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-plan">Plan</Label>
          <Select value={form.plan} onValueChange={(v) => set("plan", v as College["plan"])}>
            <SelectTrigger id="edit-plan" className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {collegePlans.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {field("seats", "Seats", { type: "number", min: 25, inputMode: "numeric" })}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {field("contactName", "Contact person")}
        {field("contactEmail", "Contact email", { type: "email" })}
      </div>
      {field("departments", "Departments (comma separated)")}
      <div className="space-y-1.5">
        <p className="text-sm font-medium">Brand colour</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Brand colour">
          {BRAND_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={form.brandColor === color}
              aria-label={`Brand colour ${color}`}
              onClick={() => set("brandColor", color)}
              className={cn("flex size-8 items-center justify-center rounded-full ring-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring", form.brandColor === color && "ring-2 ring-foreground")}
              style={{ backgroundColor: color }}
            >
              {form.brandColor === color && <Check className="size-4 text-white" />}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" className="h-9 bg-brand px-4 text-brand-foreground hover:bg-brand/90">
          Save changes
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-9"
          onClick={() => {
            setForm(initial);
            setErrors({});
          }}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
