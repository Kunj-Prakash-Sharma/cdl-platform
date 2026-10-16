"use client";

import { useState } from "react";
import { BellPlus, Check, CheckCircle2, Eye, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AI_FEATURES, type AiFeature, type AiFeatureId } from "./ai-features";
import { AiFeaturePreview, IllustrativeBanner } from "./ai-previews";
import { useAiWaitlist, useRehydrateAiWaitlist } from "./ai-waitlist-store";

export function AiStatusBadge({ status, className }: { status: AiFeature["status"]; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset",
        status === "Coming soon" ? "bg-brand-soft text-brand ring-brand/25" : "bg-secondary text-primary ring-primary/15",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function FeatureIcon({ feature, className }: { feature: AiFeature; className?: string }) {
  return (
    <span
      className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-xs", className)}
      style={{ backgroundImage: `linear-gradient(135deg, ${feature.from}, ${feature.to})` }}
    >
      <feature.icon className="size-5" />
    </span>
  );
}

/** Decorative mini transcript on the flagship card (static, illustrative). */
function ChatTeaser() {
  return (
    <div aria-hidden="true" className="ml-5 hidden w-[44%] shrink-0 flex-col justify-center gap-2 rounded-xl bg-muted/60 p-3 sm:flex">
      <span className="self-end rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-xs text-primary-foreground">What should I focus on before tonight&apos;s GD class?</span>
      <span className="max-w-[92%] rounded-2xl rounded-tl-sm border bg-card px-3 py-2 text-xs leading-relaxed">
        Rewatch <span className="font-medium">“Building on others&apos; points”</span> (10 min) and prepare two bridge phrases — tonight is Mock GD round 1.
      </span>
      <span className="self-end rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-xs text-primary-foreground">Remind me at 6:30?</span>
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-warning">
        <Sparkles className="size-3" /> Illustrative preview — not live AI
      </span>
    </div>
  );
}

function useNotify() {
  const features = useAiWaitlist((s) => s.features);
  const toggle = useAiWaitlist((s) => s.toggleFeature);
  return {
    isOn: (id: AiFeatureId) => features.includes(id),
    toggle: (feature: AiFeature) => {
      const on = toggle(feature.id);
      if (on) toast.success("You're on the list", { description: `We'll let you know when ${feature.short} launches (demo — nothing is sent).` });
      else toast("Removed from the list", { description: feature.title });
    },
  };
}

/** The seven Phase 2 AI feature cards, each with an illustrative example dialog and a local "Notify me". */
export function AiFeatureGrid({ className, extraTile }: { className?: string; /** Optional 8th tile that completes the grid */ extraTile?: React.ReactNode }) {
  useRehydrateAiWaitlist();
  const notify = useNotify();
  const [openId, setOpenId] = useState<AiFeatureId>();
  const feature = AI_FEATURES.find((f) => f.id === openId);

  return (
    <>
      <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}>
        {AI_FEATURES.map((f, i) => {
          const on = notify.isOn(f.id);
          return (
            <article
              key={f.id}
              className={cn(
                "group flex rounded-2xl border bg-card p-5 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md",
                i === 0 && "relative overflow-hidden sm:col-span-2",
              )}
            >
              <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <FeatureIcon feature={f} />
                <AiStatusBadge status={f.status} />
              </div>
              <h3 className="mt-4 font-heading leading-snug font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.description}</p>
              <ul className="mt-3 space-y-1.5">
                {f.capabilities.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="mt-px size-3.5 shrink-0 text-brand" /> {c}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                <Button variant="outline" onClick={() => setOpenId(f.id)}>
                  <Eye /> {f.exampleLabel}
                </Button>
                <Button
                  variant={on ? "secondary" : "ghost"}
                  className={cn(on && "text-success")}
                  onClick={() => notify.toggle(f)}
                  aria-pressed={on}
                >
                  {on ? (
                    <>
                      <CheckCircle2 /> You&apos;re on the list
                    </>
                  ) : (
                    <>
                      <BellPlus /> Notify me
                    </>
                  )}
                </Button>
              </div>
              </div>
              {i === 0 && <ChatTeaser />}
            </article>
          );
        })}
        {extraTile && <div className="flex sm:col-span-2 xl:col-span-1 [&>*]:flex-1">{extraTile}</div>}
      </div>

      <Dialog open={Boolean(feature)} onOpenChange={(o) => !o && setOpenId(undefined)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          {feature && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3 pr-6">
                  <FeatureIcon feature={feature} className="size-10" />
                  <div className="min-w-0 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <DialogTitle className="leading-snug">{feature.title}</DialogTitle>
                      <AiStatusBadge status={feature.status} />
                    </div>
                    <DialogDescription className="mt-0.5">{feature.exampleLabel} · example learner: Riya, final-year BBA</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <IllustrativeBanner />
              <AiFeaturePreview id={feature.id} />
              <DialogFooter className="items-center sm:justify-between">
                <p className="hidden text-xs text-muted-foreground sm:block">Planned for Phase 2 · subject to change</p>
                <Button onClick={() => notify.toggle(feature)} variant={notify.isOn(feature.id) ? "secondary" : "default"}>
                  {notify.isOn(feature.id) ? (
                    <>
                      <CheckCircle2 /> You&apos;re on the list
                    </>
                  ) : (
                    <>
                      <BellPlus /> Notify me when it launches
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** "Join the waitlist" band. Collects nothing — confirmation is local only. */
export function AiWaitlistCard({ defaultEmail = "", tone = "light", className }: { defaultEmail?: string; tone?: "light" | "dark"; className?: string }) {
  useRehydrateAiWaitlist();
  const joined = useAiWaitlist((s) => s.joined);
  const join = useAiWaitlist((s) => s.join);
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState<string>();
  const dark = tone === "dark";

  if (joined) {
    return (
      <div className={cn("flex items-center gap-3 rounded-xl px-4 py-3", dark ? "bg-white/10 text-white ring-1 ring-white/15" : "bg-success-soft text-success", className)}>
        <CheckCircle2 className="size-5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold">You&apos;re on the My Self AI waitlist</p>
          <p className={cn("text-xs", dark ? "text-white/70" : "text-success/80")}>We&apos;ll invite you to early access when Phase 2 opens (demo — nothing is sent).</p>
        </div>
      </div>
    );
  }
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          setError("Enter a valid email address.");
          return;
        }
        join();
        toast.success("You're on the waitlist", { description: "Early access invites go out when Phase 2 opens (simulated)." });
      }}
      className={cn("space-y-1.5", className)}
    >
      <Label htmlFor="ai-waitlist-email" className={cn("text-sm", dark && "text-white/85")}>
        Get early access
      </Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="ai-waitlist-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(undefined);
          }}
          placeholder="you@example.com"
          aria-invalid={Boolean(error)}
          className={cn("h-10 sm:w-72", dark ? "border-white/20 bg-white/10 text-white placeholder:text-white/50" : "bg-background")}
        />
        <Button type="submit" className="h-10 bg-brand px-5 text-brand-foreground hover:bg-brand/90">
          <Sparkles /> Join the waitlist
        </Button>
      </div>
      {error && <p className={cn("text-xs", dark ? "text-rose-300" : "text-destructive")}>{error}</p>}
    </form>
  );
}
