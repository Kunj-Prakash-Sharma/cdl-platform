"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  IndianRupee,
  Languages,
  MapPin,
  Plus,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { FORMAT_META, FORMATS } from "@/data/constants";
import { formatDate, formatINR, formatNumber, formatTime } from "@/lib/format";
import type { AvatarSpec, LearningFormat, MentoringOffer } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMentorSlots } from "@/store/hooks";
import { baseMentor, completeness, myCourses, profileChecklist, useMentorProfile } from "@/components/mentor/mentor-data";
import { Panel } from "@/components/mentor/panel";
import { AutoStatus, FormatBadge } from "@/components/shared/badges";
import { PageHeader } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

const AVATAR_OPTIONS: AvatarSpec[] = [
  baseMentor.avatar,
  { ...baseMentor.avatar, bg: 0, shirt: 0 },
  { ...baseMentor.avatar, bg: 1, shirt: 1 },
  { ...baseMentor.avatar, bg: 3, shirt: 5 },
  { ...baseMentor.avatar, hair: "bun", bg: 5, shirt: 4 },
  { ...baseMentor.avatar, hair: "wavy", bg: 7, shirt: 6, glasses: true },
];

type OfferErrors = Partial<Record<keyof MentoringOffer, string>>;

function validateOffer(o: MentoringOffer): OfferErrors {
  const e: OfferErrors = {};
  if (o.title.trim().length < 3) e.title = "Add a title (3+ characters).";
  if (!Number.isFinite(o.durationMin) || o.durationMin < 15 || o.durationMin > 180) e.durationMin = "15–180 minutes.";
  if (!Number.isFinite(o.price) || o.price < 299 || o.price > 50000) e.price = "₹299 – ₹50,000.";
  if (!Number.isInteger(o.sessions) || o.sessions < 1 || o.sessions > 12) e.sessions = "1–12 sessions.";
  return e;
}

export default function MentorProfilePage() {
  const mentor = useMentorProfile();
  const slots = useMentorSlots(baseMentor, 7);

  const [avatar, setAvatar] = useState<AvatarSpec>(baseMentor.avatar);
  const [name, setName] = useState(baseMentor.name);
  const [title, setTitle] = useState(baseMentor.title);
  const [headline, setHeadline] = useState(baseMentor.headline);
  const [bio, setBio] = useState(baseMentor.bio);
  const [expertise, setExpertise] = useState<string[]>(baseMentor.expertise);
  const [newSkill, setNewSkill] = useState("");
  const [languages, setLanguages] = useState<string[]>(baseMentor.languages);
  const [newLanguage, setNewLanguage] = useState("");
  const [years, setYears] = useState(String(baseMentor.experienceYears));
  const [city, setCity] = useState(baseMentor.city);
  const [formats, setFormats] = useState<LearningFormat[]>(baseMentor.formats);
  const [offers, setOffers] = useState<MentoringOffer[]>(baseMentor.offers);
  const [introVideo, setIntroVideo] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);

  const yearsNum = Number(years);
  const errors = {
    name: name.trim().length < 3 ? "Enter your full name." : undefined,
    title: title.trim().length < 3 ? "Add your professional title." : undefined,
    headline: headline.trim().length < 20 ? "Write a headline of at least 20 characters." : headline.length > 120 ? "Keep it under 120 characters." : undefined,
    bio: bio.trim().length < 80 ? "Your bio should be at least 80 characters." : bio.length > 800 ? "Keep it under 800 characters." : undefined,
    expertise: expertise.length === 0 ? "Add at least one area of expertise." : undefined,
    languages: languages.length === 0 ? "Add at least one language." : undefined,
    years: !Number.isInteger(yearsNum) || yearsNum < 0 || yearsNum > 60 ? "Enter a whole number of years (0–60)." : undefined,
    formats: formats.length === 0 ? "Choose at least one format." : undefined,
  };
  const offerErrors = offers.map(validateOffer);
  const hasErrors = Object.values(errors).some(Boolean) || offerErrors.some((e) => Object.keys(e).length > 0) || offers.length === 0;

  const checklist = profileChecklist({ headline, bio, expertise, languages, offers, availability: baseMentor.availability }, { introVideo });
  const pct = completeness(checklist);
  const err = (msg?: string) => (submitted && msg ? <p className="text-xs text-destructive">{msg}</p> : null);

  const addChip = (value: string, list: string[], set: (v: string[]) => void, reset: () => void) => {
    const v = value.trim();
    if (!v) return;
    if (list.some((x) => x.toLowerCase() === v.toLowerCase())) {
      toast.info(`“${v}” is already on your profile`);
      return;
    }
    set([...list, v]);
    reset();
  };

  const updateOffer = (id: string, patch: Partial<MentoringOffer>) => setOffers((list) => list.map((o) => (o.id === id ? { ...o, ...patch } : o)));

  const save = () => {
    setSubmitted(true);
    if (hasErrors) {
      toast.error("Please fix the highlighted fields", { description: "Some details need attention before saving." });
      return;
    }
    setPending(true);
    toast.success("Saved — changes go live after admin review", { description: "The CDL team usually reviews profile edits within one working day (simulated)." });
  };

  const freeDays = slots.map((d) => ({ ...d, open: d.slots.filter((s) => s.available) })).filter((d) => d.open.length);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Mentor Profile"
        description="How learners see you on CDL. Edits are reviewed by the CDL team before they go live."
        actions={
          <>
            <Button variant="outline" className="h-10 px-4" asChild>
              <Link href={`/mentors/${baseMentor.id}`}>
                <ExternalLink /> View public profile
              </Link>
            </Button>
            <Button className="h-10 bg-brand px-4 text-brand-foreground hover:bg-brand/90" onClick={save}>
              <Save /> Save changes
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 shadow-xs">
        <AutoStatus status={mentor.status === "active" ? "approved" : mentor.status} label={mentor.status === "active" ? "Approved & active" : undefined} />
        {pending && <AutoStatus status="pending" label="Edits pending admin review" />}
        <span className="text-sm text-muted-foreground">Member since {formatDate(baseMentor.joinedOn, "MMMM yyyy")}</span>
        <div className="flex min-w-48 flex-1 items-center gap-3 sm:justify-end">
          <span className="text-sm text-muted-foreground">Profile {pct}% complete</span>
          <Progress value={pct} className="h-1.5 max-w-40 [&>[data-slot=progress-indicator]]:bg-brand" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Form */}
        <div className="space-y-6">
          <Panel title="Identity" description="Your name, photo and the one-line pitch learners see first.">
            <div className="flex flex-col gap-5 sm:flex-row">
              <div className="flex flex-col items-center gap-2">
                <Portrait avatar={avatar} name={name} className="size-24" rounded="xl" />
                <Button variant="outline" size="sm" onClick={() => setPhotoOpen(true)}>
                  <Camera /> Change photo
                </Button>
              </div>
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="p-name">Full name</Label>
                  <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={submitted && Boolean(errors.name)} />
                  {err(errors.name)}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-title">Professional title</Label>
                  <Input id="p-title" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={submitted && Boolean(errors.title)} />
                  {err(errors.title)}
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="p-headline">Headline</Label>
                    <span className={cn("text-xs tabular-nums", headline.length > 120 ? "text-destructive" : "text-muted-foreground")}>{headline.length}/120</span>
                  </div>
                  <Input id="p-headline" value={headline} onChange={(e) => setHeadline(e.target.value)} aria-invalid={submitted && Boolean(errors.headline)} />
                  {err(errors.headline)}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-years">Years of experience</Label>
                  <Input id="p-years" inputMode="numeric" value={years} onChange={(e) => setYears(e.target.value)} aria-invalid={submitted && Boolean(errors.years)} />
                  {err(errors.years)}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-city">City</Label>
                  <Input id="p-city" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="About you" description="A short, specific bio builds trust — mention who you help and how.">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="p-bio">Bio</Label>
                <span className={cn("text-xs tabular-nums", bio.length > 800 ? "text-destructive" : "text-muted-foreground")}>{bio.length}/800</span>
              </div>
              <Textarea id="p-bio" rows={5} value={bio} onChange={(e) => setBio(e.target.value)} aria-invalid={submitted && Boolean(errors.bio)} />
              {err(errors.bio)}
            </div>
          </Panel>

          <Panel title="Expertise, languages & programmes">
            <div className="space-y-5">
              <ChipField
                id="p-skill"
                label="Areas of expertise"
                items={expertise}
                value={newSkill}
                onValue={setNewSkill}
                placeholder="e.g. Storytelling"
                onAdd={() => addChip(newSkill, expertise, setExpertise, () => setNewSkill(""))}
                onRemove={(v) => setExpertise((l) => l.filter((x) => x !== v))}
                error={submitted ? errors.expertise : undefined}
              />
              <ChipField
                id="p-lang"
                label="Languages"
                items={languages}
                value={newLanguage}
                onValue={setNewLanguage}
                placeholder="e.g. Tamil"
                onAdd={() => addChip(newLanguage, languages, setLanguages, () => setNewLanguage(""))}
                onRemove={(v) => setLanguages((l) => l.filter((x) => x !== v))}
                error={submitted ? errors.languages : undefined}
              />
              <div className="space-y-2">
                <Label>Associated programmes</Label>
                <div className="flex flex-wrap gap-2">
                  {myCourses.map((c) => (
                    <Link key={c.id} href={`/mentor/courses/${c.id}`} className="inline-flex items-center gap-1.5 rounded-full border bg-secondary px-3 py-1 text-sm font-medium text-primary hover:border-primary/30">
                      <BadgeCheck className="size-3.5" /> {c.title}
                    </Link>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Programme assignments are managed by CDL admins.</p>
              </div>
              <div className="space-y-2">
                <Label>Session formats you offer</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {FORMATS.map((f) => {
                    const on = formats.includes(f);
                    return (
                      <label
                        key={f}
                        htmlFor={`fmt-${f}`}
                        className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm", on && "border-brand/40 bg-brand-soft/40")}
                      >
                        <Checkbox id={`fmt-${f}`} checked={on} onCheckedChange={(v) => setFormats((l) => (v ? [...l, f] : l.filter((x) => x !== f)))} />
                        {FORMAT_META[f].label}
                      </label>
                    );
                  })}
                </div>
                {err(errors.formats)}
              </div>
            </div>
          </Panel>

          <Panel
            title="Session offers & rates"
            description="1:1 mentoring offers shown on your public profile. Prices in INR; payments are simulated in this prototype."
            action={
              <Button
                variant="outline"
                size="sm"
                disabled={offers.length >= 4}
                onClick={() =>
                  setOffers((l) => [...l, { id: `o-kavya-new-${l.length + 1}`, title: "", description: "", durationMin: 45, price: 1499, sessions: 1 }])
                }
              >
                <Plus /> Add offer
              </Button>
            }
          >
            <div className="space-y-3">
              {offers.map((o, idx) => {
                const e = submitted ? offerErrors[idx] : {};
                return (
                  <div key={o.id} className="space-y-3 rounded-xl border p-3 md:p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Offer {idx + 1}</p>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove offer ${idx + 1}`}
                        disabled={offers.length === 1}
                        onClick={() => setOffers((l) => l.filter((x) => x.id !== o.id))}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
                      <div className="space-y-1.5 sm:col-span-6">
                        <Label htmlFor={`${o.id}-title`}>Title</Label>
                        <Input id={`${o.id}-title`} value={o.title} placeholder="e.g. Interview Communication Drill" onChange={(ev) => updateOffer(o.id, { title: ev.target.value })} aria-invalid={Boolean(e.title)} />
                        {e.title && <p className="text-xs text-destructive">{e.title}</p>}
                      </div>
                      <div className="space-y-1.5 sm:col-span-6">
                        <Label htmlFor={`${o.id}-desc`}>Short description</Label>
                        <Input id={`${o.id}-desc`} value={o.description} placeholder="What the learner gets from this session" onChange={(ev) => updateOffer(o.id, { description: ev.target.value })} />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor={`${o.id}-dur`}>Duration (min)</Label>
                        <Input id={`${o.id}-dur`} type="number" min={15} max={180} step={5} value={Number.isNaN(o.durationMin) ? "" : o.durationMin} onChange={(ev) => updateOffer(o.id, { durationMin: ev.target.valueAsNumber })} aria-invalid={Boolean(e.durationMin)} />
                        {e.durationMin && <p className="text-xs text-destructive">{e.durationMin}</p>}
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor={`${o.id}-price`}>Price (₹)</Label>
                        <Input id={`${o.id}-price`} type="number" min={299} step={100} value={Number.isNaN(o.price) ? "" : o.price} onChange={(ev) => updateOffer(o.id, { price: ev.target.valueAsNumber })} aria-invalid={Boolean(e.price)} />
                        {e.price && <p className="text-xs text-destructive">{e.price}</p>}
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor={`${o.id}-ses`}>Sessions</Label>
                        <Input id={`${o.id}-ses`} type="number" min={1} max={12} value={Number.isNaN(o.sessions) ? "" : o.sessions} onChange={(ev) => updateOffer(o.id, { sessions: ev.target.valueAsNumber })} aria-invalid={Boolean(e.sessions)} />
                        {e.sessions && <p className="text-xs text-destructive">{e.sessions}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className="h-10" asChild>
              <Link href="/mentor/schedule">Manage availability</Link>
            </Button>
            <Button className="h-10 bg-brand px-5 text-brand-foreground hover:bg-brand/90" onClick={save}>
              <Save /> Save changes
            </Button>
          </div>
        </div>

        {/* Preview */}
        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
            <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
              Public profile preview
              <Link href={`/mentors/${baseMentor.id}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                Open <ExternalLink className="size-3" />
              </Link>
            </div>
            <div className="space-y-4 p-4">
              <div className="flex items-start gap-3">
                <Portrait avatar={avatar} name={name} className="size-16" rounded="xl" />
                <div className="min-w-0">
                  <p className="font-heading text-lg leading-tight font-semibold">{name || "Your name"}</p>
                  <p className="text-sm text-muted-foreground">{title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-foreground">{mentor.rating.toFixed(1)}</span> ({formatNumber(mentor.reviewCount)})
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" /> {city}
                    </span>
                    <span>{Number.isInteger(yearsNum) ? yearsNum : "—"} yrs exp.</span>
                  </p>
                </div>
              </div>
              <p className="text-sm font-medium">{headline}</p>
              <p className="line-clamp-4 text-sm text-muted-foreground">{bio}</p>
              <div className="flex flex-wrap gap-1.5">
                {expertise.map((x) => (
                  <span key={x} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-primary">
                    {x}
                  </span>
                ))}
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Languages className="size-3.5" /> {languages.join(", ")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {formats.map((f) => (
                  <FormatBadge key={f} format={f} short />
                ))}
              </div>
              <div className="space-y-2 border-t pt-3">
                {offers.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{o.title || "Untitled offer"}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" /> {Number.isFinite(o.durationMin) ? o.durationMin : "—"} min
                        {o.sessions > 1 && ` · ${o.sessions} sessions`}
                      </p>
                    </div>
                    <p className="flex shrink-0 items-center font-heading text-sm font-semibold">
                      <IndianRupee className="size-3.5" />
                      {Number.isFinite(o.price) ? formatINR(o.price).replace("₹", "") : "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Panel
            title="Availability preview"
            description="Open 1:1 slots in the next 7 days"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/mentor/schedule">Edit</Link>
              </Button>
            }
            bodyClassName="pt-3"
          >
            {freeDays.length ? (
              <ul className="space-y-2">
                {freeDays.map((d) => (
                  <li key={d.date} className="flex items-start gap-3">
                    <span className="w-20 shrink-0 pt-1 text-xs font-semibold">{formatDate(d.date, "EEE, d MMM")}</span>
                    <span className="flex flex-wrap gap-1">
                      {d.open.map((s) => (
                        <span key={s.time} className="rounded-md border border-brand/30 bg-brand-soft/50 px-2 py-0.5 text-xs font-medium text-brand">
                          {formatTime(s.time)}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No open slots this week — learners will see your next availability.</p>
            )}
          </Panel>

          <Panel title="Profile checklist" description={`${pct}% complete`} bodyClassName="pt-3">
            <ul className="space-y-1.5">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-sm">
                  {c.done ? <CheckCircle2 className="size-4 text-success" /> : <Circle className="size-4 text-muted-foreground" />}
                  <span className={cn(!c.done && "text-muted-foreground")}>{c.label}</span>
                  {!c.done && c.label.includes("intro video") && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="ml-auto text-brand"
                      onClick={() => {
                        setIntroVideo(true);
                        toast.success("Intro video added (simulated)", { description: "It will appear on your profile after admin review." });
                      }}
                    >
                      Add
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </div>

      <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change profile photo</DialogTitle>
            <DialogDescription>Photo uploads are simulated in this prototype — pick an illustrated portrait style instead.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            {AVATAR_OPTIONS.map((a, i) => {
              const selected = JSON.stringify(a) === JSON.stringify(avatar);
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`Portrait style ${i + 1}`}
                  aria-pressed={selected}
                  onClick={() => setAvatar(a)}
                  className={cn(
                    "rounded-xl border-2 p-1 transition focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    selected ? "border-brand" : "border-transparent hover:border-border",
                  )}
                >
                  <Portrait avatar={a} name={name} className="aspect-square size-auto w-full" rounded="xl" />
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPhotoOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setPhotoOpen(false);
                toast.success("Photo updated", { description: "Remember to save — photo changes are reviewed with your profile." });
              }}
            >
              Use this photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChipField({
  id,
  label,
  items,
  value,
  onValue,
  onAdd,
  onRemove,
  placeholder,
  error,
}: {
  id: string;
  label: string;
  items: string[];
  value: string;
  onValue: (v: string) => void;
  onAdd: () => void;
  onRemove: (v: string) => void;
  placeholder: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {items.map((x) => (
          <span key={x} className="inline-flex h-7 items-center gap-0.5 rounded-full border bg-secondary pr-0.5 pl-3 text-sm font-medium text-primary">
            {x}
            <Button variant="ghost" size="icon-xs" aria-label={`Remove ${x}`} onClick={() => onRemove(x)}>
              <X />
            </Button>
          </span>
        ))}
        {items.length === 0 && <span className="text-sm text-muted-foreground">None yet</span>}
      </div>
      <div className="flex max-w-md gap-2">
        <Input
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
        />
        <Button variant="outline" onClick={onAdd} disabled={!value.trim()}>
          <Plus /> Add
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
