"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft, CalendarCheck, CalendarDays, Check, Clock, IndianRupee, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatINR, formatTime } from "@/lib/format";
import type { Mentor } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useCurrentUser, useMentorSlots } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Portrait } from "./portrait";

const STEPS = ["Session", "Date", "Time", "Review"] as const;

/**
 * Level 3 booking flow. `mode="checkout"` hands the selection to /checkout (public visitors);
 * `mode="instant"` confirms immediately with a simulated payment (logged-in learners).
 */
export function MentorBookingDialog({
  mentor,
  open,
  onOpenChange,
  defaultOfferId,
  mode = "instant",
}: {
  mentor: Mentor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultOfferId?: string;
  mode?: "instant" | "checkout";
}) {
  const router = useRouter();
  const { userId } = useCurrentUser();
  const addBooking = useDemoStore((s) => s.addBooking);
  const placeOrder = useDemoStore((s) => s.placeOrder);
  const addNotification = useDemoStore((s) => s.addNotification);
  const setCheckout = useDemoStore((s) => s.setCheckout);
  const days = useMentorSlots(mentor);

  const [step, setStep] = useState(defaultOfferId ? 1 : 0);
  const [offerId, setOfferId] = useState(defaultOfferId ?? mentor.offers[0]?.id);
  const [date, setDate] = useState<string>();
  const [time, setTime] = useState<string>();
  const [topic, setTopic] = useState("");
  const [done, setDone] = useState(false);

  const offer = mentor.offers.find((o) => o.id === offerId);
  const day = useMemo(() => days.find((d) => d.date === date), [days, date]);
  const firstAvailable = useMemo(() => days.find((d) => d.slots.some((s) => s.available)), [days]);

  const reset = () => {
    setStep(defaultOfferId ? 1 : 0);
    setDate(undefined);
    setTime(undefined);
    setTopic("");
    setDone(false);
  };

  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) setTimeout(reset, 200);
  };

  const confirm = () => {
    if (!offer || !date || !time) return;
    if (mode === "checkout") {
      setCheckout({ kind: "mentoring", refId: offer.id, mentorId: mentor.id, slot: { date, time } });
      close(false);
      router.push("/checkout");
      return;
    }
    addBooking({ userId, kind: "mentoring", mentorId: mentor.id, offerId: offer.id, date, time, durationMin: offer.durationMin, topic: topic || undefined });
    placeOrder({
      userId,
      items: [{ kind: "mentoring", refId: offer.id, title: `${offer.title} · ${mentor.name}`, price: offer.price }],
      subtotal: offer.price,
      discount: 0,
      total: offer.price,
      method: "UPI (simulated)",
    });
    addNotification({
      kind: "mentoring",
      title: "Mentoring session booked",
      body: `${offer.title} with ${mentor.name} on ${formatDate(date, "EEE, d MMM")} at ${formatTime(time)}.`,
      href: "/dashboard/mentoring",
    });
    toast.success("Session booked", { description: "Simulated payment completed — no real charge." });
    setDone(true);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Portrait avatar={mentor.avatar} name={mentor.name} className="size-11" rounded="xl" />
            <div className="text-left">
              <DialogTitle>Book a session with {mentor.name}</DialogTitle>
              <DialogDescription>{mentor.title} · One-to-One Mentoring</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
              <PartyPopper className="size-7" />
            </span>
            <h3 className="mt-4 font-heading text-lg font-semibold">You&apos;re booked!</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {offer?.title} on {date && formatDate(date, "EEEE, d MMMM")} at {time && formatTime(time)}. A calendar invite and joining link
              would be sent by email (simulated).
            </p>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={() => close(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  close(false);
                  router.push("/dashboard/mentoring");
                }}
              >
                View in My Mentoring
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Stepper */}
            <ol className="flex items-center gap-2 text-xs">
              {STEPS.map((label, i) => (
                <li key={label} className="flex flex-1 items-center gap-2">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                      i < step && "border-brand bg-brand text-brand-foreground",
                      i === step && "border-primary bg-primary text-primary-foreground",
                      i > step && "text-muted-foreground",
                    )}
                  >
                    {i < step ? <Check className="size-3.5" /> : i + 1}
                  </span>
                  <span className={cn("hidden font-medium sm:inline", i > step && "text-muted-foreground")}>{label}</span>
                  {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
                </li>
              ))}
            </ol>

            <div className="min-h-56">
              {step === 0 && (
                <div className="space-y-2">
                  {mentor.offers.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setOfferId(o.id)}
                      className={cn(
                        "w-full rounded-xl border p-4 text-left transition hover:border-primary/40",
                        offerId === o.id && "border-primary bg-accent/60 ring-1 ring-primary/30",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{o.title}</p>
                          <p className="mt-0.5 text-sm text-muted-foreground">{o.description}</p>
                        </div>
                        <span className="font-heading font-semibold whitespace-nowrap">{formatINR(o.price)}</span>
                      </div>
                      <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5" /> {o.durationMin} min
                        </span>
                        {o.sessions > 1 && <span>{o.sessions} sessions</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {step === 1 && (
                <div>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Available dates over the next three weeks
                    {firstAvailable && <> · earliest {formatDate(firstAvailable.date, "EEE d MMM")}</>}
                  </p>
                  {days.length === 0 ? (
                    <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No availability published yet.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {days.map((d) => {
                        const free = d.slots.filter((s) => s.available).length;
                        return (
                          <button
                            key={d.date}
                            type="button"
                            disabled={!free}
                            onClick={() => {
                              setDate(d.date);
                              setTime(undefined);
                            }}
                            className={cn(
                              "rounded-xl border px-2 py-2.5 text-center transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40",
                              date === d.date && "border-primary bg-accent ring-1 ring-primary/30",
                            )}
                          >
                            <span className="block text-[11px] text-muted-foreground uppercase">{format(parseISO(d.date), "EEE")}</span>
                            <span className="block font-heading text-lg leading-tight font-semibold">{format(parseISO(d.date), "d")}</span>
                            <span className="block text-[11px] text-muted-foreground">{format(parseISO(d.date), "MMM")}</span>
                            <span className={cn("mt-1 block text-[10px] font-medium", free ? "text-brand" : "text-muted-foreground")}>
                              {free ? `${free} slot${free > 1 ? "s" : ""}` : "Full"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {step === 2 && day && (
                <div>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {formatDate(day.date, "EEEE, d MMMM")} · times in IST · {offer?.durationMin} min session
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {day.slots.map((s) => (
                      <button
                        key={s.time}
                        type="button"
                        disabled={!s.available}
                        onClick={() => setTime(s.time)}
                        className={cn(
                          "rounded-lg border px-3 py-2.5 text-sm font-medium transition hover:border-primary/40 disabled:cursor-not-allowed disabled:line-through disabled:opacity-40",
                          time === s.time && "border-primary bg-primary text-primary-foreground hover:border-primary",
                        )}
                      >
                        {formatTime(s.time)}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">Crossed-out times are already booked.</p>
                </div>
              )}

              {step === 3 && offer && date && time && (
                <div className="space-y-4">
                  <div className="divide-y rounded-xl border">
                    <Row icon={CalendarCheck} label="Session" value={offer.title} />
                    <Row icon={CalendarDays} label="When" value={`${formatDate(date, "EEE, d MMM yyyy")} · ${formatTime(time)} IST`} />
                    <Row icon={Clock} label="Duration" value={`${offer.durationMin} minutes${offer.sessions > 1 ? ` · ${offer.sessions} sessions` : ""}`} />
                    <Row icon={IndianRupee} label="Price" value={formatINR(offer.price)} strong />
                  </div>
                  {mode === "instant" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="booking-topic">What would you like to focus on? (optional)</Label>
                      <Textarea
                        id="booking-topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. Mock HR interview for marketing roles"
                        rows={3}
                      />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Prototype: no payment is collected and no calendar invite is sent.</p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                <ArrowLeft /> Back
              </Button>
              {step < 3 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={(step === 0 && !offerId) || (step === 1 && !date) || (step === 2 && !time)}
                >
                  Continue
                </Button>
              ) : (
                <Button onClick={confirm} className="bg-brand text-brand-foreground hover:bg-brand/90">
                  {mode === "checkout" ? "Continue to checkout" : `Confirm & pay ${offer ? formatINR(offer.price) : ""}`}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ icon: Icon, label, value, strong }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 text-sm">
      <Icon className="size-4 text-muted-foreground" />
      <span className="w-20 text-muted-foreground">{label}</span>
      <span className={cn("ml-auto text-right", strong && "font-heading text-base font-semibold")}>{value}</span>
    </div>
  );
}
