import { Brain, ClipboardCheck, Compass, FileText, HandHeart, Info, Lock, MessagesSquare, PlayCircle, Scale, Sparkles, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

/** The note that keeps Phase 1 and Phase 2 clearly separate. */
export function AiPrototypeNote({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col rounded-2xl border border-dashed border-primary/30 bg-secondary/50 p-5", className)}>
      <span className="flex size-11 items-center justify-center rounded-xl bg-background text-primary ring-1 ring-border">
        <Info className="size-5" />
      </span>
      <h3 className="mt-4 font-heading font-semibold">How it works today (Phase 1)</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        The free career discovery conversation uses <span className="font-medium text-foreground">predefined dialogue</span>, and recommendations come from simple,
        transparent rules. <span className="font-medium text-foreground">No AI model runs in this prototype.</span>
      </p>
      <p className="mt-3 text-xs text-muted-foreground">Everything on this page is an illustrative preview of Phase 2.</p>
    </div>
  );
}

const SIGNALS = [
  { icon: MessagesSquare, label: "Discovery conversation" },
  { icon: ClipboardCheck, label: "Assessment results" },
  { icon: PlayCircle, label: "Course progress" },
  { icon: FileText, label: "Mentor notes" },
];

/** Decorative "what it connects" panel for heroes. */
export function AiSignalsPanel({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/15 backdrop-blur-sm", className)}>
      <p className="text-[11px] font-semibold tracking-wider text-white/60 uppercase">Learns from what you already do on CDL</p>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {SIGNALS.map((s) => (
          <li key={s.label} className="flex items-center gap-2 rounded-lg bg-white/[0.08] px-2.5 py-2 text-xs text-white/85">
            <s.icon className="size-4 shrink-0 text-teal-300" /> {s.label}
          </li>
        ))}
      </ul>
      <div className="my-3 flex items-center gap-2 text-white/40">
        <span className="h-px flex-1 bg-white/15" />
        <Sparkles className="size-4 text-teal-300" />
        <span className="h-px flex-1 bg-white/15" />
      </div>
      <div className="rounded-xl bg-white px-3.5 py-3 text-navy shadow-lg">
        <p className="text-[11px] font-semibold tracking-wide text-primary/70 uppercase">Your next best step</p>
        <p className="mt-0.5 text-sm font-semibold">Practise two GD entry phrases before tonight&apos;s class</p>
        <p className="mt-0.5 text-xs text-slate-500">Because: Mock GD round 1 at 7 PM · mentor flagged group confidence</p>
      </div>
      <p className="mt-2 text-center text-[10px] text-white/50">Illustrative preview — not live AI</p>
    </div>
  );
}

const STEPS = [
  { icon: Compass, title: "Understands you", text: "Starts from your discovery snapshot, interests, assessments and goals — with your consent." },
  { icon: Brain, title: "Guides every day", text: "Turns your courses, sessions, assignments and mentor notes into clear next steps." },
  { icon: UsersRound, title: "Works with your mentor", text: "Prepares you for mentoring sessions and keeps plans reviewed by real experts." },
];

export function AiHowItWorks({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-3", className)}>
      {STEPS.map((s, i) => (
        <div key={s.title} className="relative rounded-2xl border bg-card p-5 shadow-xs">
          <span className="absolute top-5 right-5 font-heading text-3xl font-semibold text-muted-foreground/20">0{i + 1}</span>
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <s.icon className="size-5" />
          </span>
          <h3 className="mt-4 font-heading font-semibold">{s.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
        </div>
      ))}
    </div>
  );
}

const PRINCIPLES = [
  { icon: HandHeart, title: "Mentors stay in the loop", text: "AI suggestions support — never replace — human mentors. Career plans are reviewed by an expert." },
  { icon: Lock, title: "Your data, your choice", text: "Opt-in only. You decide what My Self AI can use, and you can switch it off anytime." },
  { icon: Scale, title: "Explains its reasoning", text: "Every suggestion shows why it was made, so you can question it. No hidden scores or verdicts." },
];

export function AiPrinciples({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-3", className)}>
      {PRINCIPLES.map((p) => (
        <div key={p.title} className="flex gap-3 rounded-2xl border bg-card p-5 shadow-xs">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <p.icon className="size-5" />
          </span>
          <div>
            <h3 className="font-heading font-semibold">{p.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
