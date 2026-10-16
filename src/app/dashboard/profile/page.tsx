"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Plus, RefreshCw, Save, ShieldCheck, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { STAGE_META, STAGES } from "@/data/constants";
import { formatDate } from "@/lib/format";
import { recommendCourses } from "@/lib/recommend";
import type { LearnerStage, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useCurrentUser, useHydrated, useMyEnrollments } from "@/store/hooks";
import { DemoBadge, FormatBadge } from "@/components/shared/badges";
import { PageHeader } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Panel } from "@/components/learner/overview-parts";
import { parseGoal, profileChecklist, profileCompletion } from "@/components/learner/utils";
import { ProgressRing } from "@/components/learner/widgets";

const SUGGESTED_INTERESTS = ["Communication", "Marketing", "Leadership", "Public speaking", "Finance", "Data & analytics", "Design", "Human resources", "Entrepreneurship", "Technology", "Psychology", "Operations", "Stream selection", "Confidence building"];

const NOTIFICATION_PREFS = [
  { id: "sessions", label: "Live session reminders", hint: "1 hour and 10 minutes before each class", on: true },
  { id: "assignments", label: "Assignment due dates", hint: "Two days before an assignment is due", on: true },
  { id: "mentoring", label: "Mentoring updates", hint: "Confirmations, reschedules and session notes", on: true },
  { id: "recommendations", label: "Recommendations", hint: "Programmes suggested from your profile", on: false },
  { id: "whatsapp", label: "WhatsApp updates", hint: "Simulated — no messages are sent", on: false },
];

export default function ProfileSettingsPage() {
  const { user, userId } = useCurrentUser();
  const hydrated = useHydrated();
  return <ProfileForm key={`${userId}-${hydrated}`} user={user} />;
}

function ProfileForm({ user }: { user: UserProfile }) {
  const updateProfile = useDemoStore((s) => s.updateProfile);
  const enrollments = useMyEnrollments();
  const [form, setForm] = useState<UserProfile>(user);
  const [interestDraft, setInterestDraft] = useState("");
  const [goalDraft, setGoalDraft] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => Object.fromEntries(NOTIFICATION_PREFS.map((p) => [p.id, p.on])));
  const [previewStage, setPreviewStage] = useState<LearnerStage>(user.stage);

  const set = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key as string]) setErrors((e) => ({ ...e, [key as string]: "" }));
  };
  const completion = profileCompletion(form);
  const checklist = profileChecklist(form);
  const dirty = JSON.stringify(form) !== JSON.stringify(user);
  const enrolledIds = useMemo(() => enrollments.map((e) => e.courseId), [enrollments]);

  const current = useMemo(() => recommendCourses({ stage: user.stage, persona: user.stage === "parent" ? "parent" : "self", interests: user.interests, goals: user.goals.map((g) => parseGoal(g).text), exclude: enrolledIds }, 3), [user, enrolledIds]);
  const preview = useMemo(
    () => recommendCourses({ stage: previewStage, persona: previewStage === "parent" ? "parent" : "self", interests: form.interests, goals: form.goals.map((g) => parseGoal(g).text), exclude: enrolledIds }, 3),
    [previewStage, form.interests, form.goals, enrolledIds],
  );

  const save = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Enter your full name.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (!form.city.trim()) next.city = "Enter your city.";
    if (Object.values(next).some(Boolean)) {
      setErrors(next);
      toast.error("Please fix the highlighted fields");
      return;
    }
    updateProfile(user.id, { ...form, name: form.name.trim(), city: form.city.trim(), profileCompletion: completion, lastActive: "2026-10-15" });
    toast.success("Profile saved", { description: `Profile ${completion}% complete. Recommendations updated.` });
  };

  const addInterest = (value: string) => {
    const v = value.trim();
    if (!v || form.interests.some((i) => i.toLowerCase() === v.toLowerCase())) return;
    set("interests", [...form.interests, v]);
    setInterestDraft("");
  };
  const addGoal = () => {
    const v = goalDraft.trim();
    if (v.length < 4) return;
    set("goals", [...form.goals, v]);
    setGoalDraft("");
  };

  const isStudent = form.stage === "school" || form.stage === "college";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Profile Settings"
        description="Keep your details current — your stage, interests and goals shape recommendations across CDL."
        actions={
          <>
            <Button variant="outline" disabled={!dirty} onClick={() => setForm(user)}>
              Discard changes
            </Button>
            <Button onClick={save} className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Save /> Save changes
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Panel title="Personal details">
            <div className="mb-5 flex items-center gap-4">
              <Portrait avatar={form.avatar} name={form.name || "You"} className="size-16" />
              <div>
                <p className="font-semibold">{form.name || "Your name"}</p>
                <p className="text-sm text-muted-foreground">Member since {formatDate(user.joinedOn, "MMMM yyyy")}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="name" label="Full name" error={errors.name}>
                <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} aria-invalid={Boolean(errors.name)} />
              </Field>
              <Field id="email" label="Email" error={errors.email}>
                <Input id="email" type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} aria-invalid={Boolean(errors.email)} placeholder="name@example.com" />
              </Field>
              <Field id="phone" label="Mobile number" hint="Verified via OTP (simulated)">
                <div className="flex gap-2">
                  <Input id="phone" value={form.phone} readOnly className="bg-muted/50" />
                  <Button variant="outline" onClick={() => toast("Change number", { description: "In production this sends an OTP to the new number. Simulated in the prototype." })}>
                    Change
                  </Button>
                </div>
              </Field>
              <Field id="city" label="City" error={errors.city}>
                <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} aria-invalid={Boolean(errors.city)} />
              </Field>
            </div>
          </Panel>

          <Panel title="Stage & background" description="Fields adapt to your current stage">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="stage" label="I am a…">
                <Select value={form.stage} onValueChange={(v) => set("stage", v as LearnerStage)}>
                  <SelectTrigger id="stage" className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STAGE_META[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="education" label={form.stage === "parent" ? "Your education / profession" : isStudent ? "Course & year" : "Highest qualification"}>
                <Input id="education" value={form.education} onChange={(e) => set("education", e.target.value)} placeholder={isStudent ? "e.g. BBA, Final year" : "e.g. B.Com (2025)"} />
              </Field>
              {(isStudent || form.stage === "graduate") && (
                <Field id="institution" label={form.stage === "school" ? "School" : "College / university"}>
                  <Input id="institution" value={form.institution ?? ""} onChange={(e) => set("institution", e.target.value)} />
                </Field>
              )}
              {(form.stage === "professional" || form.stage === "graduate" || form.stage === "parent") && (
                <Field id="occupation" label={form.stage === "graduate" ? "Current role (if any)" : "Current role & organisation"}>
                  <Input id="occupation" value={form.occupation ?? ""} onChange={(e) => set("occupation", e.target.value)} placeholder="e.g. HR Executive, 3 yrs" />
                </Field>
              )}
              {form.stage === "parent" && (
                <>
                  <Field id="childName" label="Child's name">
                    <Input id="childName" value={form.childName ?? ""} onChange={(e) => set("childName", e.target.value)} />
                  </Field>
                  <Field id="childStage" label="Child's stage">
                    <Select value={form.childStage ?? "school"} onValueChange={(v) => set("childStage", v as LearnerStage)}>
                      <SelectTrigger id="childStage" className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["school", "college", "graduate"] as LearnerStage[]).map((s) => (
                          <SelectItem key={s} value={s}>
                            {STAGE_META[s].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </>
              )}
            </div>
          </Panel>

          <Panel title="Career interests" description="Pick everything that sounds interesting — 5 or more works best">
            <div className="flex flex-wrap gap-2">
              {[...new Set([...form.interests, ...SUGGESTED_INTERESTS])].map((i) => {
                const on = form.interests.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set("interests", on ? form.interests.filter((x) => x !== i) : [...form.interests, i])}
                    className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition", on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/40")}
                  >
                    {on ? <Check className="size-3.5" /> : <Plus className="size-3.5 text-muted-foreground" />}
                    {i}
                  </button>
                );
              })}
            </div>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addInterest(interestDraft);
              }}
            >
              <Input value={interestDraft} onChange={(e) => setInterestDraft(e.target.value)} placeholder="Add your own interest" aria-label="Add your own interest" className="h-9 max-w-xs" />
              <Button type="submit" variant="outline" className="h-9" disabled={!interestDraft.trim()}>
                Add
              </Button>
            </form>
          </Panel>

          <Panel title="Goals" description="What you want to achieve in the next 6–12 months">
            <ul className="space-y-2">
              {form.goals.map((g, idx) => {
                const p = parseGoal(g);
                return (
                  <li key={`${idx}-${g}`} className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm">
                    {p.done ? <Check className="size-4 text-success" /> : <span className="size-1.5 rounded-full bg-brand" />}
                    <span className={cn("flex-1", p.done && "text-muted-foreground line-through")}>{p.text}</span>
                    <Button variant="ghost" size="icon-sm" aria-label={`Remove goal ${p.text}`} onClick={() => set("goals", form.goals.filter((_, i) => i !== idx))}>
                      <X />
                    </Button>
                  </li>
                );
              })}
            </ul>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addGoal();
              }}
            >
              <Input value={goalDraft} onChange={(e) => setGoalDraft(e.target.value)} placeholder="e.g. Clear campus placement interviews" aria-label="Add a goal" className="h-9" />
              <Button type="submit" variant="outline" className="h-9" disabled={goalDraft.trim().length < 4}>
                <Plus /> Add
              </Button>
            </form>
          </Panel>

          <Panel title="Notification preferences" description="Stored on this device for the demo">
            <ul className="divide-y">
              {NOTIFICATION_PREFS.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div>
                    <Label htmlFor={`pref-${p.id}`} className="text-sm font-medium">
                      {p.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{p.hint}</p>
                  </div>
                  <Switch
                    id={`pref-${p.id}`}
                    checked={prefs[p.id]}
                    onCheckedChange={(v) => {
                      setPrefs((s) => ({ ...s, [p.id]: v }));
                      toast.success(`${p.label} ${v ? "on" : "off"}`);
                    }}
                  />
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <aside className="space-y-6">
          <div className="lg:sticky lg:top-20 space-y-6">
            <Panel title="Profile completion" description="Updates as you edit">
              <div className="flex items-center gap-4">
                <ProgressRing value={completion} size={76} stroke={8}>
                  <span className="font-heading text-lg font-semibold tabular-nums">{completion}%</span>
                </ProgressRing>
                <p className="text-sm text-muted-foreground">{completion === 100 ? "Everything's filled in — great!" : `${checklist.filter((c) => !c.done).length} item${checklist.filter((c) => !c.done).length === 1 ? "" : "s"} left for fully personalised recommendations.`}</p>
              </div>
              <ul className="mt-4 space-y-1.5">
                {checklist.map((c) => (
                  <li key={c.id} className={cn("flex items-center gap-2 text-sm", c.done ? "text-muted-foreground" : "font-medium")}>
                    {c.done ? <Check className="size-4 text-success" /> : <span className="ml-1 size-2 rounded-full bg-warning" />}
                    {c.label}
                  </li>
                ))}
              </ul>
              {dirty && <p className="mt-4 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">You have unsaved changes.</p>}
              <Button onClick={save} className="mt-4 w-full bg-brand text-brand-foreground hover:bg-brand/90">
                <Save /> Save changes
              </Button>
            </Panel>
            <p className="flex items-start gap-2 px-1 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" /> Demo profile — nothing leaves your browser.
            </p>
          </div>
        </aside>
      </div>

      <Panel
        title={
          <span className="flex flex-wrap items-center gap-2">
            <RefreshCw className="size-4 text-brand" /> Has your situation changed?
          </span>
        }
        description="Graduated, started a job or changing direction? See how your recommendations would change."
        action={<DemoBadge>Illustrative</DemoBadge>}
      >
        <div className="flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setPreviewStage(s)}
              aria-pressed={previewStage === s}
              className={cn("rounded-full border px-3 py-1.5 text-sm transition", previewStage === s ? "border-brand bg-brand-soft font-medium text-brand" : "hover:border-brand/40")}
            >
              {STAGE_META[s].label}
              {s === user.stage && <span className="ml-1 text-xs text-muted-foreground">(current)</span>}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{STAGE_META[previewStage].description}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <RecList title={`Now · ${STAGE_META[user.stage].label}`} recs={current} muted />
          <RecList title={`If you're a ${STAGE_META[previewStage].label.toLowerCase()}`} recs={preview} highlight={preview.filter((p) => !current.some((c) => c.course.id === p.course.id)).map((p) => p.course.id)} />
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            disabled={previewStage === form.stage}
            onClick={() => {
              set("stage", previewStage);
              toast("Stage updated in the form", { description: "Review your background details, then save." });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Use this stage
          </Button>
          <Button asChild variant="ghost">
            <Link href="/dashboard/development">
              My Development <ArrowRight />
            </Link>
          </Button>
        </div>
      </Panel>
    </div>
  );
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function RecList({ title, recs, muted, highlight = [] }: { title: string; recs: ReturnType<typeof recommendCourses>; muted?: boolean; highlight?: string[] }) {
  return (
    <div className={cn("rounded-xl border p-4", muted ? "bg-muted/40" : "border-brand/30 bg-brand-soft/30")}>
      <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</p>
      {recs.length ? (
        <ul className="space-y-2.5">
          {recs.map((r) => (
            <li key={r.course.id}>
              <Link href={`/courses/${r.course.id}`} className="group flex items-start gap-2">
                <Sparkles className={cn("mt-0.5 size-4 shrink-0", highlight.includes(r.course.id) ? "text-brand" : "text-muted-foreground")} />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium group-hover:text-primary">
                    {r.course.title}
                    <FormatBadge format={r.format} short className="h-5 px-1.5 text-[10px]" />
                    {highlight.includes(r.course.id) && <span className="text-[10px] font-semibold text-brand uppercase">New</span>}
                  </span>
                  <span className="block text-xs text-muted-foreground">{r.reason}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No new recommendations — you&apos;re enrolled in the best fits.</p>
      )}
    </div>
  );
}
