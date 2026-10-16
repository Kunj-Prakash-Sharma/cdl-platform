"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  Check,
  CircleCheck,
  Circle,
  FlaskConical,
  GraduationCap,
  HeartHandshake,
  KeyRound,
  Mail,
  Plus,
  School,
  Smartphone,
  Sparkles,
  UserRoundSearch,
} from "lucide-react";
import { toast } from "sonner";
import { DEMO_LEARNER_ID, DEMO_PARENT_ID, STAGE_META, STAGES } from "@/data/constants";
import type { LearnerStage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useCurrentUser, useHydrated } from "@/store/hooks";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEMO_OTP = "123456";
const STEP_LABELS = ["Phone", "Verify", "Email", "Profile", "Goals"];

const STAGE_ICON: Record<LearnerStage, React.ComponentType<{ className?: string }>> = {
  school: School,
  college: GraduationCap,
  graduate: UserRoundSearch,
  professional: BriefcaseBusiness,
  parent: HeartHandshake,
};

const INTERESTS = [
  "Communication",
  "Public speaking",
  "Leadership",
  "Marketing",
  "Finance",
  "Technology",
  "Design",
  "Psychology",
  "Entrepreneurship",
  "Teaching",
  "Science & research",
  "Media & writing",
];

const GOALS: Record<LearnerStage, string[]> = {
  school: ["Choose the right stream", "Discover my interests", "Build confidence", "Improve communication"],
  college: ["Clear placement interviews", "Improve group discussions", "Build a strong resume", "Find my career direction"],
  graduate: ["Land my first job", "Prepare for interviews", "Choose the right role", "Build workplace skills"],
  professional: ["Grow into leadership", "Switch careers", "Communicate with impact", "Plan my next move"],
  parent: ["Help my child choose a stream", "Understand my child's strengths", "Plan entrance exams", "Support without pressure"],
};

interface Profile {
  name: string;
  stage?: LearnerStage;
  city: string;
  // school
  klass: string;
  school: string;
  // college / graduate
  degree: string;
  specialisation: string;
  year: string;
  college: string;
  gradYear: string;
  // professional
  role: string;
  company: string;
  experience: string;
  // parent
  childName: string;
  childStage: string;
}

const EMPTY_PROFILE: Profile = {
  name: "",
  city: "",
  klass: "",
  school: "",
  degree: "",
  specialisation: "",
  year: "",
  college: "",
  gradYear: "",
  role: "",
  company: "",
  experience: "",
  childName: "",
  childStage: "",
};

const DETAIL_FIELDS: Record<LearnerStage, (keyof Profile)[]> = {
  school: ["klass", "school"],
  college: ["degree", "specialisation", "year", "college"],
  graduate: ["degree", "gradYear"],
  professional: ["role", "company", "experience"],
  parent: ["childName", "childStage"],
};

function completion(p: Profile, email: string, interests: string[], goals: string[]) {
  const fields = p.stage ? DETAIL_FIELDS[p.stage] : [];
  const filled = fields.filter((f) => String(p[f]).trim()).length;
  const items = [
    { label: "Mobile number verified", done: true, weight: 15 },
    { label: "Name", done: !!p.name.trim(), weight: 15 },
    { label: "Email address", done: !!email, weight: 10 },
    { label: "Current stage", done: !!p.stage, weight: 10 },
    { label: p.stage === "professional" ? "Work details" : p.stage === "parent" ? "Your child's details" : "Education details", done: fields.length > 0 && filled === fields.length, weight: 20, partial: fields.length ? filled / fields.length : 0 },
    { label: "Career interests", done: interests.length > 0, weight: 15 },
    { label: "Goals", done: goals.length > 0, weight: 15 },
  ];
  const score = Math.round(items.reduce((s, i) => s + ("partial" in i && i.partial !== undefined ? i.weight * i.partial : i.done ? i.weight : 0), 0));
  return { score, items };
}

export function LoginFlow() {
  const router = useRouter();
  const hydrated = useHydrated();
  const isLoggedIn = useDemoStore((s) => s.isLoggedIn);
  const checkout = useDemoStore((s) => s.checkout);
  const login = useDemoStore((s) => s.login);
  const logout = useDemoStore((s) => s.logout);
  const setRole = useDemoStore((s) => s.setRole);
  const updateProfile = useDemoStore((s) => s.updateProfile);
  const { user } = useCurrentUser();

  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string>();
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string>();
  const [seconds, setSeconds] = useState(0);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [profileErrors, setProfileErrors] = useState<{ name?: string; stage?: string }>({});
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [finished, setFinished] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  // Resend countdown — state only changes inside the timeout callback.
  useEffect(() => {
    if (seconds <= 0) return;
    const id = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [seconds]);

  const set = (k: keyof Profile, v: string) => setProfile((p) => ({ ...p, [k]: v }));
  const prettyPhone = `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
  const { score, items } = completion(profile, email, interests, goals);

  const sendOtp = () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setPhoneError(phone.length < 10 ? "Enter your 10-digit mobile number." : "Indian mobile numbers start with 6, 7, 8 or 9.");
      return;
    }
    setPhoneError(undefined);
    setOtp("");
    setOtpError(undefined);
    setSeconds(30);
    setStep(1);
    toast.success("OTP sent (simulated)", { description: `Use the demo code ${DEMO_OTP}.` });
  };

  const verify = (code = otp) => {
    if (code.length < 6) {
      setOtpError("Enter all 6 digits.");
      return;
    }
    if (code !== DEMO_OTP) {
      setOtpError("That code doesn't match. In this demo, the OTP is always 123456.");
      return;
    }
    setOtpError(undefined);
    setStep(2);
  };

  const exploreAsRiya = () => {
    login();
    setRole("learner");
    setJustLoggedIn(true);
    toast.success("Welcome back, Riya", { description: "You're exploring as the demo learner." });
    router.push("/dashboard");
  };

  const toggle = (list: string[], v: string, setter: (l: string[]) => void) => setter(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const finish = () => {
    const p = profile;
    const stage = p.stage!;
    let education = "";
    let institution: string | undefined;
    let occupation: string | undefined;
    if (stage === "school") {
      education = p.klass ? `Class ${p.klass}` : "School student";
      institution = p.school || undefined;
    } else if (stage === "college") {
      education = [p.degree || "College student", p.specialisation && `(${p.specialisation})`].filter(Boolean).join(" ") + (p.year ? `, ${p.year}` : "");
      institution = p.college || undefined;
    } else if (stage === "graduate") {
      education = `${p.degree || "Graduate"}${p.gradYear ? `, graduated ${p.gradYear}` : ""}`;
    } else if (stage === "professional") {
      occupation = [p.role, p.company && `at ${p.company}`].filter(Boolean).join(" ") || "Working professional";
      education = p.experience ? `${p.experience} years of experience` : "Working professional";
    } else {
      education = "Parent";
    }
    const targetId = stage === "parent" ? DEMO_PARENT_ID : DEMO_LEARNER_ID;
    updateProfile(targetId, {
      name: p.name.trim(),
      phone: `+91 ${phone.slice(0, 2)}XXX ${phone.slice(5)}`,
      email: email || undefined,
      stage,
      city: p.city || (stage === "parent" ? "Chennai" : "Pune"),
      education,
      institution,
      occupation,
      interests,
      goals,
      profileCompletion: score,
      ...(stage === "parent" ? { childName: p.childName || undefined, childStage: (p.childStage || undefined) as LearnerStage | undefined } : {}),
    });
    login();
    setRole(stage === "parent" ? "parent" : "learner");
    setFinished(true);
    setStep(5);
  };

  const saveProfile = () => {
    const errors: typeof profileErrors = {};
    if (profile.name.trim().length < 2) errors.name = "Please enter your name.";
    if (!profile.stage) errors.stage = "Choose the option that describes you best.";
    setProfileErrors(errors);
    if (!Object.keys(errors).length) setStep(4);
  };

  const showSignedIn = hydrated && isLoggedIn && !finished && !justLoggedIn && step === 0;

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:px-6 md:py-14 lg:grid-cols-[1fr_440px] lg:items-start lg:gap-12">
      {/* Card */}
      <div className="mx-auto w-full max-w-lg lg:order-2">
        <div className="overflow-hidden rounded-3xl border bg-card shadow-xl shadow-primary/5">
          {step < 5 && (
            <div className="border-b px-6 pt-5 pb-4">
              <ol className="flex items-center gap-1.5" aria-label="Progress">
                {STEP_LABELS.map((label, i) => (
                  <li key={label} className="flex flex-1 flex-col gap-1.5">
                    <span className={cn("h-1 rounded-full transition", i < step ? "bg-brand" : i === step ? "bg-primary" : "bg-muted")} />
                    <span className={cn("text-[11px] font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>{label}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="p-6 md:p-8">
            {showSignedIn && (
              <div className="mb-6 flex items-center gap-3 rounded-xl bg-success-soft p-3 text-sm">
                <Portrait avatar={user.avatar} name={user.name} className="size-9" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">You&apos;re signed in as {user.name}</p>
                  <p className="text-xs text-muted-foreground">Demo session</p>
                </div>
                <Button asChild size="sm">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    logout();
                    toast("Logged out of the demo");
                  }}
                >
                  Log out
                </Button>
              </div>
            )}

            {step === 0 && (
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  sendOtp();
                }}
              >
                <StepIcon icon={Smartphone} />
                <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight">Log in or create your account</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">Enter your mobile number. We&apos;ll send a one-time code to verify it.</p>
                <Label htmlFor="login-phone" className="mt-6 mb-1.5">
                  Mobile number
                </Label>
                <div
                  className={cn(
                    "flex h-12 overflow-hidden rounded-xl border border-input transition focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
                    phoneError && "border-destructive ring-3 ring-destructive/15",
                  )}
                >
                  <span className="flex items-center gap-1.5 border-r bg-muted px-3.5 text-[15px] font-medium text-muted-foreground">+91</span>
                  <input
                    id="login-phone"
                    inputMode="numeric"
                    autoComplete="off"
                    autoFocus
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                      if (phoneError) setPhoneError(undefined);
                    }}
                    aria-invalid={!!phoneError}
                    aria-describedby="login-phone-hint"
                    placeholder="98765 43210"
                    className="min-w-0 flex-1 bg-transparent px-3.5 text-[15px] tracking-wide outline-none"
                  />
                </div>
                <p id="login-phone-hint" className={cn("mt-1.5 text-xs", phoneError ? "text-destructive" : "text-muted-foreground")}>
                  {phoneError ?? "Demo only — any number works and nothing is sent or stored."}
                </p>
                <Button type="submit" className="mt-5 h-12 w-full bg-brand text-base text-brand-foreground hover:bg-brand/90">
                  Send OTP <ArrowRight />
                </Button>

                <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
                </div>
                <button
                  type="button"
                  onClick={exploreAsRiya}
                  className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition hover:border-primary/30 hover:bg-muted/50"
                >
                  <Portrait avatar={{ skin: 1, hair: "long", hairColor: 1, bg: 1, shirt: 2 }} name="Riya Mehta" className="size-10" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">Explore as our demo learner (Riya)</span>
                    <span className="block text-xs text-muted-foreground">Final-year BBA · sample courses, sessions & mentoring</span>
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </button>
              </form>
            )}

            {step === 1 && (
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  verify();
                }}
              >
                <BackButton onClick={() => setStep(0)} />
                <StepIcon icon={KeyRound} />
                <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight">Verify your number</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Enter the 6-digit code sent to <span className="font-medium text-foreground">{prettyPhone}</span>.{" "}
                  <button type="button" className="font-medium text-primary hover:underline" onClick={() => setStep(0)}>
                    Edit
                  </button>
                </p>
                <div className="mt-6 flex justify-center">
                  <InputOTP
                    maxLength={6}
                    pattern={REGEXP_ONLY_DIGITS}
                    value={otp}
                    onChange={(v) => {
                      setOtp(v);
                      if (otpError) setOtpError(undefined);
                    }}
                    onComplete={(v: string) => verify(v)}
                    autoFocus
                    aria-label="One-time password"
                  >
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          aria-invalid={!!otpError}
                          className="size-12 rounded-xl border-l text-lg font-semibold first:rounded-xl last:rounded-xl sm:size-13"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {otpError && (
                  <p role="alert" className="mt-3 text-center text-sm text-destructive">
                    {otpError}
                  </p>
                )}
                <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-dashed border-warning/50 bg-warning-soft px-3 py-2.5 text-sm">
                  <span className="flex items-center gap-2">
                    <FlaskConical className="size-4 text-warning" /> Demo OTP: <span className="font-mono font-semibold tracking-widest">{DEMO_OTP}</span>
                  </span>
                  <button
                    type="button"
                    className="text-xs font-medium text-primary hover:underline"
                    onClick={() => {
                      setOtp(DEMO_OTP);
                      setOtpError(undefined);
                    }}
                  >
                    Fill it in
                  </button>
                </div>
                <Button type="submit" className="mt-5 h-12 w-full text-base">
                  Verify &amp; continue
                </Button>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Didn&apos;t get it?{" "}
                  {seconds > 0 ? (
                    <span>Resend in 0:{String(seconds).padStart(2, "0")}</span>
                  ) : (
                    <button
                      type="button"
                      className="font-medium text-primary hover:underline"
                      onClick={() => {
                        setSeconds(30);
                        setOtp("");
                        toast.success("New OTP sent (simulated)", { description: `It's still ${DEMO_OTP} in the demo.` });
                      }}
                    >
                      Resend OTP
                    </button>
                  )}
                </p>
              </form>
            )}

            {step === 2 && (
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
                    setEmailError("That email doesn't look right.");
                    return;
                  }
                  setEmailError(undefined);
                  setStep(3);
                }}
              >
                <StepIcon icon={Mail} done />
                <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-success">
                  <CircleCheck className="size-3.5" /> {prettyPhone} verified
                </p>
                <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight">Add your email</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">Optional — for receipts, certificates and session reminders.</p>
                <Label htmlFor="login-email" className="mt-6 mb-1.5">
                  Email address <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value.trim());
                    if (emailError) setEmailError(undefined);
                  }}
                  aria-invalid={!!emailError}
                  placeholder="you@example.com"
                  className="h-12 rounded-xl text-[15px]"
                />
                {emailError && <p className="mt-1.5 text-xs text-destructive">{emailError}</p>}
                <div className="mt-5 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 flex-1"
                    onClick={() => {
                      setEmail("");
                      setStep(3);
                    }}
                  >
                    Skip for now
                  </Button>
                  <Button type="submit" className="h-12 flex-1" disabled={!email}>
                    Continue
                  </Button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  saveProfile();
                }}
              >
                <BackButton onClick={() => setStep(2)} />
                <h1 className="font-heading text-2xl font-bold tracking-tight">Tell us a little about you</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">This personalises your recommendations. You can change it any time.</p>
                <Label htmlFor="p-name" className="mt-6 mb-1.5">
                  Your name
                </Label>
                <Input
                  id="p-name"
                  value={profile.name}
                  onChange={(e) => {
                    set("name", e.target.value);
                    if (profileErrors.name) setProfileErrors((x) => ({ ...x, name: undefined }));
                  }}
                  aria-invalid={!!profileErrors.name}
                  placeholder="Full name"
                  className="h-11 rounded-xl"
                />
                {profileErrors.name && <p className="mt-1 text-xs text-destructive">{profileErrors.name}</p>}

                <p className="mt-5 mb-2 text-sm font-medium" id="stage-label">
                  I am a…
                </p>
                <div role="radiogroup" aria-labelledby="stage-label" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {STAGES.map((s) => {
                    const Icon = STAGE_ICON[s];
                    const on = profile.stage === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => {
                          setProfile((p) => ({ ...p, stage: s }));
                          setGoals([]);
                          if (profileErrors.stage) setProfileErrors((x) => ({ ...x, stage: undefined }));
                        }}
                        className={cn(
                          "flex flex-col items-start gap-2 rounded-xl border p-3 text-left text-sm font-medium transition hover:border-primary/30",
                          on && "border-primary bg-accent/60 ring-2 ring-primary/15",
                        )}
                      >
                        <Icon className={cn("size-4", on ? "text-primary" : "text-muted-foreground")} />
                        {STAGE_META[s].label}
                      </button>
                    );
                  })}
                </div>
                {profileErrors.stage && <p className="mt-1.5 text-xs text-destructive">{profileErrors.stage}</p>}

                {profile.stage && (
                  <div className="mt-5 grid gap-3 rounded-2xl bg-muted/50 p-4 sm:grid-cols-2">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase sm:col-span-2">
                      {profile.stage === "professional" ? "Employment" : profile.stage === "parent" ? "About your child" : "Education"}
                    </p>
                    {profile.stage === "school" && (
                      <>
                        <SelectField id="p-class" label="Class" value={profile.klass} onChange={(v) => set("klass", v)} options={["8", "9", "10", "11", "12"].map((c) => ({ value: c, label: `Class ${c}` }))} />
                        <TextField id="p-school" label="School" value={profile.school} onChange={(v) => set("school", v)} placeholder="School name" />
                      </>
                    )}
                    {profile.stage === "college" && (
                      <>
                        <TextField id="p-degree" label="Degree" value={profile.degree} onChange={(v) => set("degree", v)} placeholder="e.g. BBA, B.Tech" />
                        <TextField id="p-spec" label="Specialisation" value={profile.specialisation} onChange={(v) => set("specialisation", v)} placeholder="e.g. Marketing" />
                        <SelectField id="p-year" label="Year" value={profile.year} onChange={(v) => set("year", v)} options={["1st year", "2nd year", "3rd year", "Final year"].map((y) => ({ value: y, label: y }))} />
                        <TextField id="p-college" label="College" value={profile.college} onChange={(v) => set("college", v)} placeholder="College name" />
                      </>
                    )}
                    {profile.stage === "graduate" && (
                      <>
                        <TextField id="p-gdegree" label="Degree" value={profile.degree} onChange={(v) => set("degree", v)} placeholder="e.g. B.Com" />
                        <SelectField id="p-gyear" label="Year of graduation" value={profile.gradYear} onChange={(v) => set("gradYear", v)} options={["2026", "2025", "2024", "2023", "2022", "Earlier"].map((y) => ({ value: y, label: y }))} />
                      </>
                    )}
                    {profile.stage === "professional" && (
                      <>
                        <TextField id="p-role" label="Current role" value={profile.role} onChange={(v) => set("role", v)} placeholder="e.g. Sales Executive" />
                        <TextField id="p-company" label="Company" value={profile.company} onChange={(v) => set("company", v)} placeholder="Company name" />
                        <SelectField id="p-exp" label="Experience" value={profile.experience} onChange={(v) => set("experience", v)} options={["0–2", "3–5", "6–10", "10+"].map((y) => ({ value: y, label: `${y} years` }))} />
                      </>
                    )}
                    {profile.stage === "parent" && (
                      <>
                        <TextField id="p-child" label="Child's name" value={profile.childName} onChange={(v) => set("childName", v)} placeholder="First name" />
                        <SelectField
                          id="p-cstage"
                          label="Child's stage"
                          value={profile.childStage}
                          onChange={(v) => set("childStage", v)}
                          options={(["school", "college", "graduate"] as LearnerStage[]).map((s) => ({ value: s, label: STAGE_META[s].label }))}
                        />
                      </>
                    )}
                    <TextField id="p-city" label="City (optional)" value={profile.city} onChange={(v) => set("city", v)} placeholder="e.g. Pune" />
                  </div>
                )}
                <Button type="submit" className="mt-6 h-12 w-full text-base">
                  Continue <ArrowRight />
                </Button>
              </form>
            )}

            {step === 4 && profile.stage && (
              <div>
                <BackButton onClick={() => setStep(3)} />
                <h1 className="font-heading text-2xl font-bold tracking-tight">
                  {profile.stage === "parent" ? "What would you like for your child?" : "What are you interested in?"}
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">Pick as many as you like — or add your own.</p>
                <ChipGroup
                  title="Career interests"
                  options={Array.from(new Set([...INTERESTS, ...interests]))}
                  selected={interests}
                  onToggle={(v) => toggle(interests, v, setInterests)}
                  custom={customInterest}
                  setCustom={setCustomInterest}
                  onAdd={() => {
                    const v = customInterest.trim();
                    if (v && !interests.includes(v)) setInterests([...interests, v]);
                    setCustomInterest("");
                  }}
                />
                <ChipGroup
                  title="Goals"
                  options={Array.from(new Set([...GOALS[profile.stage], ...goals]))}
                  selected={goals}
                  onToggle={(v) => toggle(goals, v, setGoals)}
                  custom={customGoal}
                  setCustom={setCustomGoal}
                  onAdd={() => {
                    const v = customGoal.trim();
                    if (v && !goals.includes(v)) setGoals([...goals, v]);
                    setCustomGoal("");
                  }}
                />
                <Button className="mt-6 h-12 w-full bg-brand text-base text-brand-foreground hover:bg-brand/90" onClick={finish}>
                  Finish setup <Check />
                </Button>
                {!interests.length && !goals.length && <p className="mt-2 text-center text-xs text-muted-foreground">You can skip this — but recommendations work better with it.</p>}
              </div>
            )}

            {step === 5 && (
              <div className="text-center">
                <CompletionRing value={score} />
                <h1 className="mt-5 font-heading text-2xl font-bold tracking-tight">Welcome to CDL, {profile.name.split(" ")[0]}!</h1>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  Your profile is {score}% complete. It personalises your course recommendations, assessments and mentor suggestions.
                </p>
                <ul className="mt-6 space-y-2 text-left">
                  {items.map((i) => (
                    <li key={i.label} className="flex items-center gap-2.5 text-sm">
                      {i.done ? <CircleCheck className="size-4 text-brand" /> : <Circle className="size-4 text-muted-foreground/50" />}
                      <span className={cn(!i.done && "text-muted-foreground")}>{i.label}</span>
                      {!i.done && <span className="ml-auto text-xs text-muted-foreground">Add later</span>}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 rounded-xl bg-muted/60 p-3 text-left text-xs text-muted-foreground">
                  Moved to a new class, graduated or changed jobs? Update your profile any time from Profile Settings so recommendations stay
                  relevant. For this demo, your dashboard also includes sample learning history.
                </p>
                <Button
                  className="mt-6 h-12 w-full bg-brand text-base text-brand-foreground hover:bg-brand/90"
                  onClick={() => router.push(checkout ? "/checkout" : "/dashboard")}
                >
                  {checkout ? "Continue to checkout" : "Go to my dashboard"} <ArrowRight />
                </Button>
                <Button asChild variant="ghost" className="mt-2 h-10 w-full">
                  <Link href="/dashboard/profile">Review my profile</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">Prototype — no real OTP, account or personal data is created.</p>
      </div>

      {/* Side panel */}
      <div className="lg:order-1 lg:pt-6">
        <p className="text-xs font-semibold tracking-[0.14em] text-brand uppercase">Your CDL account</p>
        <h2 className="mt-3 font-heading text-3xl leading-tight font-bold tracking-tight text-balance md:text-4xl">
          One place for your courses, live sessions and mentoring
        </h2>
        <div className="mt-8 grid gap-4">
          <div className="rounded-2xl border bg-card p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Sparkles className="size-5" />
              </span>
              <p className="font-heading font-semibold">Just exploring?</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              You don&apos;t need an account. The free career discovery conversation, course catalog and mentor profiles are open to everyone.
            </p>
            <Link href="/discover" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Start free discovery <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <BookOpenCheck className="size-5" />
              </span>
              <p className="font-heading font-semibold">Enrolled or ready to enrol?</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">An account keeps everything you&apos;ve purchased in one dashboard:</p>
            <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {["Recorded lessons & progress", "Live cohort calendar", "Mentoring bookings & notes", "Certificates & assessments"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="size-4 text-brand" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepIcon({ icon: Icon, done }: { icon: React.ComponentType<{ className?: string }>; done?: boolean }) {
  return (
    <span className={cn("flex size-11 items-center justify-center rounded-xl", done ? "bg-success-soft text-success" : "bg-secondary text-primary")}>
      <Icon className="size-5" />
    </span>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> Back
    </button>
  );
}

function TextField({ id, label, value, onChange, placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5">
        {label}
      </Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-10 bg-card" />
    </div>
  );
}

function SelectField({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-10 w-full bg-card">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ChipGroup({
  title,
  options,
  selected,
  onToggle,
  custom,
  setCustom,
  onAdd,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  custom: string;
  setCustom: (v: string) => void;
  onAdd: () => void;
}) {
  const inputId = `custom-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <fieldset className="mt-6">
      <legend className="text-sm font-medium">
        {title} {selected.length > 0 && <span className="text-xs font-normal text-muted-foreground">· {selected.length} selected</span>}
      </legend>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(o)}
              className={cn(
                "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-sm transition",
                on ? "border-brand/40 bg-brand-soft font-medium text-brand" : "bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              {on && <Check className="size-3.5" />}
              {o}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex gap-2">
        <label htmlFor={inputId} className="sr-only">
          Add your own {title.toLowerCase()}
        </label>
        <Input
          id={inputId}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={`Add your own ${title === "Goals" ? "goal" : "interest"}`}
          className="h-9"
        />
        <Button type="button" variant="outline" className="h-9" onClick={onAdd} disabled={!custom.trim()}>
          <Plus /> Add
        </Button>
      </div>
    </fieldset>
  );
}

function CompletionRing({ value }: { value: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto size-28">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth="9" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--brand)" strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-2xl font-bold">{value}%</span>
        <span className="text-[10px] text-muted-foreground uppercase">complete</span>
      </div>
    </div>
  );
}
