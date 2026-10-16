"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  CreditCard,
  FlaskConical,
  Loader2,
  PartyPopper,
  PlayCircle,
  Receipt,
  ShoppingBag,
  Smartphone,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { getCourse } from "@/data";
import { DEMO_LEARNER_ID, FORMAT_META } from "@/data/constants";
import { formatDate, formatINR, formatTime } from "@/lib/format";
import type { LearningFormat, Order, PromoCode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useCurrentUser, useHydrated } from "@/store/hooks";
import { EmptyState } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  formatLevel,
  nextCohort,
  packageEnrollments,
  packageSavings,
  promoDiscount,
  resolveCheckout,
  validatePromo,
  type CheckoutLine,
} from "../commerce";
import { LineArtwork, OrderSummary, type Totals } from "./order-summary";

type Method = "upi" | "card" | "netbanking";
const METHOD_LABEL: Record<Method, Order["method"]> = {
  upi: "UPI (simulated)",
  card: "Card (simulated)",
  netbanking: "Net banking (simulated)",
};
const BANKS = ["Demo Bank of India", "Sample National Bank", "Prototype Co-operative Bank", "Placeholder Finance Bank"];

interface SuccessState {
  order: Order;
  line: CheckoutLine;
  courses: { id: string; title: string; format: LearningFormat }[];
  firstName: string;
}

export function CheckoutFlow() {
  const hydrated = useHydrated();
  const checkout = useDemoStore((s) => s.checkout);
  const packages = useDemoStore((s) => s.packages);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  if (success) return <SuccessScreen data={success} />;
  if (!hydrated) {
    return (
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:px-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <Skeleton className="h-[480px] rounded-2xl" />
      </div>
    );
  }
  const line = resolveCheckout(checkout, packages);
  if (!line) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 md:py-24">
        <EmptyState
          icon={ShoppingBag}
          title="Your checkout is empty"
          description="Pick a course, a learning level or a package to continue. Not sure yet? A free career discovery conversation can suggest where to start."
          className="bg-card py-16"
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href="/courses">Browse courses</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/programs">Programs &amp; packages</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/discover">Start free discovery</Link>
              </Button>
            </div>
          }
        />
      </div>
    );
  }
  return <CheckoutForm key={`${line.kind}-${line.refId}-${line.format ?? ""}`} line={line} onSuccess={setSuccess} />;
}

function CheckoutForm({ line, onSuccess }: { line: CheckoutLine; onSuccess: (s: SuccessState) => void }) {
  const router = useRouter();
  const isLoggedIn = useDemoStore((s) => s.isLoggedIn);
  const promoCodes = useDemoStore((s) => s.promoCodes);
  const packages = useDemoStore((s) => s.packages);
  const enrollments = useDemoStore((s) => s.enrollments);
  const setCheckout = useDemoStore((s) => s.setCheckout);
  const login = useDemoStore((s) => s.login);
  const placeOrder = useDemoStore((s) => s.placeOrder);
  const enroll = useDemoStore((s) => s.enroll);
  const addBooking = useDemoStore((s) => s.addBooking);
  const addNotification = useDemoStore((s) => s.addNotification);
  const { user, userId } = useCurrentUser();
  const buyerId = isLoggedIn ? userId : DEMO_LEARNER_ID;

  // Contact
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [contactErrors, setContactErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [editingContact, setEditingContact] = useState(!isLoggedIn);
  const [contactDone, setContactDone] = useState(isLoggedIn);

  // Promo
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<PromoCode | undefined>();
  const [promoError, setPromoError] = useState<string>();

  // Payment
  const [method, setMethod] = useState<Method>("upi");
  const [upi, setUpi] = useState("demo@upi");
  const [card, setCard] = useState({ number: "4111 1111 1111 1111", expiry: "12/29", cvv: "123", name: "" });
  const [bank, setBank] = useState(BANKS[0]);
  const [decline, setDecline] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "failed">("idle");
  const [offerDismissed, setOfferDismissed] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Upgrade credit (logged-in learner moving up a level on a course they bought)
  const existing = line.course && isLoggedIn ? enrollments.find((e) => e.userId === buyerId && e.courseId === line.course!.id) : undefined;
  const credit =
    existing && line.format && existing.source === "purchase" && formatLevel(existing.format) < formatLevel(line.format)
      ? (line.course!.pricing[existing.format] ?? 0)
      : 0;
  const base = Math.max(0, line.price - credit);
  const discount = promoDiscount(promo, base);
  const totals: Totals = {
    price: line.price,
    credit,
    creditLabel: existing ? `${FORMAT_META[existing.format].label} already purchased` : undefined,
    discount,
    total: base - discount,
  };

  // Contextual offer
  const bundle =
    line.kind === "course" ? packages.find((p) => p.active && p.format === "bundle" && p.courseIds.length > 1 && p.courseIds.includes(line.refId)) : undefined;
  const liveUpgrade =
    !bundle && line.kind === "course" && line.format === "self-paced" && line.course?.formats.includes("live-cohort") ? nextCohort(line.refId) : undefined;

  const applyPromo = () => {
    const res = validatePromo(promoInput, promoCodes, line.scope);
    if (!res.ok) {
      setPromoError(res.error);
      return;
    }
    setPromo(res.promo);
    setPromoError(undefined);
    setPromoInput("");
    toast.success(`${res.promo.code} applied`, { description: `You save ${formatINR(promoDiscount(res.promo, base))}.` });
  };

  const saveContact = () => {
    const errors: typeof contactErrors = {};
    if (contact.name.trim().length < 2) errors.name = "Please enter your full name.";
    if (!/^[6-9]\d{9}$/.test(contact.phone)) errors.phone = "Enter a valid 10-digit mobile number starting with 6–9.";
    if (contact.email && !/^\S+@\S+\.\S+$/.test(contact.email)) errors.email = "That email doesn't look right.";
    setContactErrors(errors);
    if (Object.keys(errors).length) return;
    setEditingContact(false);
    setContactDone(true);
  };

  const complete = () => {
    if (!isLoggedIn) login();
    const order = placeOrder({
      userId: buyerId,
      items: [{ kind: line.kind, refId: line.refId, format: line.format, title: line.orderTitle, price: line.price }],
      subtotal: line.price,
      discount: credit + discount,
      total: totals.total,
      promoCode: promo?.code,
      method: METHOD_LABEL[method],
    });
    const enrolled: SuccessState["courses"] = [];
    if (line.kind === "course" && line.course && line.format) {
      enroll({ userId: buyerId, courseId: line.course.id, format: line.format, cohortId: line.cohort?.id, orderId: order.id, source: "purchase" });
      enrolled.push({ id: line.course.id, title: line.course.title, format: line.format });
      addNotification({
        kind: "enrollment",
        title: credit ? "Upgrade confirmed" : "Enrolment confirmed",
        body: `You're enrolled in ${line.orderTitle}.${line.cohort ? ` Classes: ${line.cohort.scheduleLabel}.` : ""}`,
        href: line.cohort ? "/dashboard/sessions" : `/dashboard/learn/${line.course.id}`,
      });
    } else if (line.kind === "package" && line.pkg) {
      for (const plan of packageEnrollments(line.pkg)) {
        const course = getCourse(plan.courseId);
        if (!course) continue;
        const prior = enrollments.find((e) => e.userId === buyerId && e.courseId === plan.courseId);
        if (!prior || formatLevel(prior.format) < formatLevel(plan.format)) {
          enroll({ userId: buyerId, courseId: plan.courseId, format: plan.format, cohortId: plan.cohortId, orderId: order.id, source: "purchase" });
        }
        enrolled.push({ id: course.id, title: course.title, format: prior && formatLevel(prior.format) > formatLevel(plan.format) ? prior.format : plan.format });
      }
      addNotification({ kind: "enrollment", title: "Package activated", body: `${line.pkg.name}: ${enrolled.length} course${enrolled.length > 1 ? "s" : ""} added to My Learning.`, href: "/dashboard/learning" });
    } else if (line.kind === "mentoring" && line.mentor && line.offer && line.slot) {
      addBooking({ userId: buyerId, kind: "mentoring", mentorId: line.mentor.id, offerId: line.offer.id, date: line.slot.date, time: line.slot.time, durationMin: line.offer.durationMin });
      addNotification({
        kind: "mentoring",
        title: "Mentoring session booked",
        body: `${line.offer.title} with ${line.mentor.name} on ${formatDate(line.slot.date, "EEE, d MMM")} at ${formatTime(line.slot.time)}.`,
        href: "/dashboard/mentoring",
      });
    }
    setCheckout(null);
    onSuccess({ order, line, courses: enrolled, firstName: (isLoggedIn ? user.name : contact.name).split(" ")[0] });
  };

  const pay = () => {
    if (!contactDone) {
      toast.error("Add your contact details first");
      return;
    }
    setStatus("processing");
    window.setTimeout(() => {
      if (decline) {
        setStatus("failed");
        return;
      }
      complete();
    }, 1200);
  };

  const processing = status === "processing";
  const summary = (
    <OrderSummary
      line={line}
      totals={totals}
      promo={promo}
      promoInput={promoInput}
      setPromoInput={(v) => {
        setPromoInput(v);
        if (promoError) setPromoError(undefined);
      }}
      onApply={applyPromo}
      onRemovePromo={() => setPromo(undefined)}
      promoError={promoError}
      onRemoveItem={() => {
        setCheckout(null);
        toast("Removed from checkout");
      }}
      locked={processing}
    />
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
      <button type="button" onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground">
        ← Back
      </button>
      <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">Checkout</h1>
      <p className="mt-1 text-sm text-muted-foreground">Two quick steps. Everything here is simulated — no real data, OTP or payment is used.</p>

      {/* Mobile summary */}
      <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen} className="mt-6 lg:hidden">
        <CollapsibleTrigger asChild>
          <button type="button" className="flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left shadow-xs">
            <LineArtwork line={line} className="w-20 shrink-0 [&_p]:hidden [&>span]:hidden" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{line.title}</span>
              <span className="text-xs text-muted-foreground">{summaryOpen ? "Hide" : "Show"} order summary</span>
            </span>
            <span className="font-heading font-bold">{formatINR(totals.total)}</span>
            <ChevronDown className={cn("size-4 transition", summaryOpen && "rotate-180")} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">{summary}</CollapsibleContent>
      </Collapsible>

      <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[1fr_380px] lg:gap-8">
        <div className="min-w-0 space-y-5">
          {/* Contextual offer */}
          {!offerDismissed && (bundle || liveUpgrade) && (
            <div className="flex flex-col gap-3 rounded-2xl border border-brand/30 bg-brand-soft/60 p-4 sm:flex-row sm:items-center">
              <Sparkles className="size-5 shrink-0 text-brand" />
              <div className="min-w-0 flex-1 text-sm">
                {bundle ? (
                  <>
                    <p className="font-semibold">
                      Get the {bundle.name} and save {formatINR(packageSavings(bundle))}
                    </p>
                    <p className="text-muted-foreground">{bundle.description}</p>
                  </>
                ) : (
                  liveUpgrade &&
                  line.course && (
                    <>
                      <p className="font-semibold">
                        Prefer to learn live? Live Cohort is {formatINR((line.course.pricing["live-cohort"] ?? 0) - line.price)} more
                      </p>
                      <p className="text-muted-foreground">
                        {liveUpgrade.scheduleLabel} with a mentor, recordings and doubt-clearing — {liveUpgrade.seats - liveUpgrade.enrolled} seats left.
                      </p>
                    </>
                  )
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOfferDismissed(true)}>
                  No thanks
                </Button>
                <Button
                  size="sm"
                  className="bg-brand text-brand-foreground hover:bg-brand/90"
                  onClick={() => {
                    if (bundle) setCheckout({ kind: "package", refId: bundle.id });
                    else setCheckout({ kind: "course", refId: line.refId, format: "live-cohort" });
                    toast.success(bundle ? `Switched to ${bundle.name}` : "Switched to Live Cohort");
                  }}
                >
                  {bundle ? "Switch to bundle" : "Switch to Live Cohort"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 1: contact */}
          <StepCard n={1} title="Your details" done={contactDone && !editingContact} active>
            {!editingContact ? (
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary">
                  <UserRound className="size-5" />
                </span>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium">{isLoggedIn && !contact.name ? user.name : contact.name}</p>
                  <p className="text-muted-foreground">
                    {isLoggedIn && !contact.phone ? user.phone : `+91 ${contact.phone.slice(0, 5)} ${contact.phone.slice(5)}`}
                    {(contact.email || (isLoggedIn && !contact.name && user.email)) && ` · ${contact.email || user.email}`}
                  </p>
                  {isLoggedIn && <p className="mt-1 text-xs text-muted-foreground">Signed in as the demo learner.</p>}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={processing}
                  onClick={() => {
                    if (isLoggedIn && !contact.name) setContact({ name: user.name, phone: "", email: user.email ?? "" });
                    setEditingContact(true);
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  saveContact();
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="co-name" className="mb-1.5">
                      Full name
                    </Label>
                    <Input
                      id="co-name"
                      autoComplete="off"
                      value={contact.name}
                      onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                      aria-invalid={!!contactErrors.name}
                      placeholder="e.g. Ananya Sharma"
                      className="h-10"
                    />
                    {contactErrors.name && <p className="mt-1 text-xs text-destructive">{contactErrors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="co-phone" className="mb-1.5">
                      Mobile number
                    </Label>
                    <div className="flex h-10 overflow-hidden rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-aria-invalid:border-destructive">
                      <span className="flex items-center border-r bg-muted px-3 text-sm text-muted-foreground">+91</span>
                      <input
                        id="co-phone"
                        inputMode="numeric"
                        autoComplete="off"
                        value={contact.phone}
                        onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                        aria-invalid={!!contactErrors.phone}
                        placeholder="98765 43210"
                        className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                      />
                    </div>
                    {contactErrors.phone && <p className="mt-1 text-xs text-destructive">{contactErrors.phone}</p>}
                  </div>
                  <div>
                    <Label htmlFor="co-email" className="mb-1.5">
                      Email <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="co-email"
                      type="email"
                      autoComplete="off"
                      value={contact.email}
                      onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                      aria-invalid={!!contactErrors.email}
                      placeholder="For your receipt"
                      className="h-10"
                    />
                    {contactErrors.email && <p className="mt-1 text-xs text-destructive">{contactErrors.email}</p>}
                  </div>
                </div>
                <p className="mt-4 flex items-start gap-2 rounded-lg bg-muted/70 p-3 text-xs text-muted-foreground">
                  <FlaskConical className="mt-px size-3.5 shrink-0" />
                  Prototype: no OTP is sent and nothing is stored beyond this browser. Use any 10-digit number starting with 6–9.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button type="submit" className="h-10 px-4">
                    Continue to payment <ArrowRight />
                  </Button>
                  {!isLoggedIn && (
                    <Link href="/login" className="text-sm font-medium text-primary hover:underline">
                      Already have an account? Log in
                    </Link>
                  )}
                </div>
              </form>
            )}
          </StepCard>

          {/* Step 2: payment */}
          <StepCard n={2} title="Payment" active={contactDone && !editingContact}>
            {!contactDone || editingContact ? (
              <p className="text-sm text-muted-foreground">Add your details to choose a payment method.</p>
            ) : (
              <div>
                <div className="flex gap-3 rounded-xl border border-warning/40 bg-warning-soft p-3.5 text-sm">
                  <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" />
                  <p>
                    <span className="font-semibold">This is a prototype — no payment will be processed.</span>{" "}
                    <span className="text-muted-foreground">Dummy details are prefilled. Please don&apos;t enter real card or bank information.</span>
                  </p>
                </div>

                <div role="radiogroup" aria-label="Payment method" className="mt-4 grid gap-2 sm:grid-cols-3">
                  {(
                    [
                      { id: "upi", label: "UPI", icon: Smartphone },
                      { id: "card", label: "Card", icon: CreditCard },
                      { id: "netbanking", label: "Net banking", icon: Building },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={method === m.id}
                      disabled={processing}
                      onClick={() => {
                        setMethod(m.id);
                        if (status === "failed") setStatus("idle");
                      }}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl border bg-card p-3 text-sm font-medium transition hover:border-primary/30",
                        method === m.id && "border-primary ring-2 ring-primary/15",
                      )}
                    >
                      <m.icon className="size-4 text-primary" /> {m.label}
                      {method === m.id && <Check className="ml-auto size-4 text-primary" />}
                    </button>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border bg-muted/30 p-4">
                  {method === "upi" && (
                    <div>
                      <Label htmlFor="pay-upi" className="mb-1.5">
                        UPI ID
                      </Label>
                      <Input id="pay-upi" value={upi} onChange={(e) => setUpi(e.target.value)} className="h-10 bg-card" autoComplete="off" />
                      <p className="mt-1.5 text-xs text-muted-foreground">A collect request would be sent to your UPI app (simulated).</p>
                    </div>
                  )}
                  {method === "card" && (
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="sm:col-span-4">
                        <Label htmlFor="pay-card" className="mb-1.5">
                          Card number
                        </Label>
                        <Input id="pay-card" value={card.number} onChange={(e) => setCard((c) => ({ ...c, number: e.target.value }))} className="h-10 bg-card font-mono" autoComplete="off" />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="pay-name" className="mb-1.5">
                          Name on card
                        </Label>
                        <Input id="pay-name" value={card.name} onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))} placeholder="DEMO LEARNER" className="h-10 bg-card" autoComplete="off" />
                      </div>
                      <div>
                        <Label htmlFor="pay-exp" className="mb-1.5">
                          Expiry
                        </Label>
                        <Input id="pay-exp" value={card.expiry} onChange={(e) => setCard((c) => ({ ...c, expiry: e.target.value }))} className="h-10 bg-card" autoComplete="off" />
                      </div>
                      <div>
                        <Label htmlFor="pay-cvv" className="mb-1.5">
                          CVV
                        </Label>
                        <Input id="pay-cvv" value={card.cvv} onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value }))} className="h-10 bg-card" autoComplete="off" />
                      </div>
                      <p className="text-xs text-muted-foreground sm:col-span-4">Test card for the demo. Card details are never stored.</p>
                    </div>
                  )}
                  {method === "netbanking" && (
                    <div>
                      <Label htmlFor="pay-bank" className="mb-1.5">
                        Choose your bank
                      </Label>
                      <Select value={bank} onValueChange={setBank}>
                        <SelectTrigger id="pay-bank" className="h-10 w-full bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BANKS.map((b) => (
                            <SelectItem key={b} value={b}>
                              {b}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="mt-1.5 text-xs text-muted-foreground">Fictional banks — you&apos;d be redirected to your bank&apos;s page (simulated).</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-dashed p-3">
                  <Label htmlFor="pay-decline" className="text-sm font-normal">
                    <span>
                      <span className="block font-medium">Simulate a declined payment</span>
                      <span className="block text-xs text-muted-foreground">Demo the failure &amp; retry experience</span>
                    </span>
                  </Label>
                  <Switch id="pay-decline" checked={decline} onCheckedChange={setDecline} disabled={processing} />
                </div>

                {status === "failed" && (
                  <div role="alert" className="mt-4 flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                    <CircleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
                    <div className="flex-1">
                      <p className="font-semibold text-destructive">Payment declined by the (simulated) bank</p>
                      <p className="mt-0.5 text-muted-foreground">No money was deducted. Retry, or choose a different payment method.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setDecline(false)} disabled={!decline}>
                          Turn off decline simulation
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setMethod(method === "upi" ? "card" : "upi")}>
                          Try {method === "upi" ? "a card" : "UPI"} instead
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  className="mt-5 h-12 w-full bg-brand text-base text-brand-foreground shadow-md shadow-brand/20 hover:bg-brand/90"
                  onClick={pay}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="animate-spin" /> Processing simulated payment…
                    </>
                  ) : status === "failed" ? (
                    `Retry payment · ${formatINR(totals.total)}`
                  ) : totals.total === 0 ? (
                    "Complete enrolment"
                  ) : (
                    `Pay ${formatINR(totals.total)} (simulated)`
                  )}
                </Button>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  By continuing you agree to the illustrative terms and 7-day refund policy.
                </p>
              </div>
            )}
          </StepCard>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-20">{summary}</div>
        </aside>
      </div>
    </div>
  );
}

function StepCard({ n, title, done, active, children }: { n: number; title: string; done?: boolean; active?: boolean; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5 shadow-xs md:p-6", !active && "opacity-70")}>
      <div className="mb-4 flex items-center gap-3">
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-full text-xs font-semibold",
            done ? "bg-brand text-brand-foreground" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {done ? <Check className="size-4" /> : n}
        </span>
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SuccessScreen({ data }: { data: SuccessState }) {
  const { order, line, courses } = data;
  const hasCohort = courses.some((c) => c.format === "live-cohort");
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-16">
      <div className="overflow-hidden rounded-3xl border bg-card shadow-lg shadow-primary/5">
        <div className="relative isolate overflow-hidden bg-navy px-6 py-10 text-center text-navy-foreground md:py-12">
          <div className="absolute inset-0 -z-10 bg-grid opacity-10" />
          <div className="absolute -top-24 left-1/2 -z-10 size-72 -translate-x-1/2 rounded-full bg-brand/40 blur-3xl" />
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <PartyPopper className="size-7" />
          </span>
          <h1 className="mt-4 font-heading text-2xl font-bold text-white md:text-3xl">
            {line.kind === "mentoring" ? "Your session is booked" : "You're all set"}
            {data.firstName ? `, ${data.firstName}` : ""}!
          </h1>
          <p className="mt-2 text-white/70">Simulated payment of {formatINR(order.total)} completed — no real money was charged.</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 ring-1 ring-white/15">
            <Receipt className="size-3.5" /> Order {order.id} · {order.method}
          </p>
        </div>

        <div className="p-6 md:p-8">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">What you purchased</p>
          <div className="mt-3 flex items-center gap-4 rounded-2xl border p-3">
            <LineArtwork line={line} className="w-28 shrink-0 [&_p]:hidden [&>span]:hidden" />
            <div className="min-w-0 flex-1">
              <p className="font-heading font-semibold">{line.orderTitle}</p>
              {line.cohort && <p className="text-sm text-muted-foreground">{line.cohort.name} · {line.cohort.scheduleLabel}</p>}
              {line.slot && (
                <p className="text-sm text-muted-foreground">
                  {formatDate(line.slot.date, "EEEE, d MMMM")} · {formatTime(line.slot.time)} IST
                </p>
              )}
              {line.pkg && <p className="text-sm text-muted-foreground">{courses.length} courses added to My Learning</p>}
            </div>
            <span className="font-heading font-bold">{formatINR(order.total)}</span>
          </div>

          <p className="mt-8 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Next steps</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {courses.slice(0, 3).map((c) => (
              <NextStep
                key={c.id}
                href={`/dashboard/learn/${c.id}`}
                icon={PlayCircle}
                title={courses.length > 1 ? `Start ${c.title}` : "Start learning"}
                body={`${FORMAT_META[c.format].label} · jump into the first lesson`}
                primary
              />
            ))}
            {hasCohort && <NextStep href="/dashboard/sessions" icon={CalendarDays} title="View your schedule" body="Live classes, reminders and recordings" />}
            {line.kind === "mentoring" && (
              <NextStep href="/dashboard/mentoring" icon={CalendarDays} title="View in My Mentoring" body="Joining link, reschedule and session notes" primary />
            )}
            <NextStep href="/dashboard" icon={ArrowRight} title="Go to dashboard" body="Your learning, sessions and progress" />
          </div>
          <p className="mt-6 rounded-xl bg-muted/60 p-4 text-xs text-muted-foreground">
            For this demo, purchases are added to the sample learner account (Riya Mehta), so the dashboard includes sample learning history. A
            receipt would normally be emailed to you.{" "}
            <Link href="/dashboard/orders" className="font-medium text-primary hover:underline">
              View purchases
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function NextStep({ href, icon: Icon, title, body, primary }: { href: string; icon: React.ComponentType<{ className?: string }>; title: string; body: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start gap-3 rounded-2xl border p-4 transition hover:shadow-md",
        primary ? "border-brand/30 bg-brand-soft/50 hover:border-brand/50" : "hover:border-primary/25",
      )}
    >
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", primary ? "bg-brand text-brand-foreground" : "bg-secondary text-primary")}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block font-medium group-hover:text-primary">{title}</span>
        <span className="block text-xs text-muted-foreground">{body}</span>
      </span>
    </Link>
  );
}
