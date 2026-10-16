import { cohortsForCourse, getCourse, getMentorOffer, publicCourses } from "@/data";
import { DEMO_TODAY, FORMAT_META } from "@/data/constants";
import type {
  CheckoutItem,
  Cohort,
  Course,
  LearningFormat,
  Mentor,
  MentoringOffer,
  PricingPackage,
  PromoCode,
} from "@/lib/types";

// ---------- Cohorts ----------

export const seatsLeft = (c: Cohort) => Math.max(0, c.seats - c.enrolled);

/** Public cohorts a learner can still join (running or upcoming, with seats left). */
export function joinableCohorts(courseId: string) {
  return cohortsForCourse(courseId).filter((c) => c.status !== "completed" && seatsLeft(c) > 0);
}

/** The cohort a Live Cohort purchase is placed into: first running/upcoming public cohort. */
export function nextCohort(courseId: string): Cohort | undefined {
  return joinableCohorts(courseId)[0] ?? cohortsForCourse(courseId).find((c) => c.status !== "completed");
}

// ---------- Pricing ----------

/** Lowest paid price for a learning format across the public catalog ("from ₹X"). */
export function fromPrice(format: LearningFormat) {
  const prices = publicCourses.map((c) => c.pricing[format]).filter((p): p is number => typeof p === "number" && p > 0);
  return prices.length ? Math.min(...prices) : 0;
}

export function priceRange(format: LearningFormat) {
  const prices = publicCourses.map((c) => c.pricing[format]).filter((p): p is number => typeof p === "number" && p > 0);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export const formatLevel = (f: LearningFormat) => FORMAT_META[f].level;

/** Mentoring offer that matches a course's One-to-One Mentoring price (falls back to the first offer). */
export function mentoringOfferForCourse(course: Course, mentor: Mentor | undefined) {
  if (!mentor) return undefined;
  return mentor.offers.find((o) => o.price === course.pricing.mentoring) ?? mentor.offers[0];
}

// ---------- Promo codes ----------

export type PromoScope = LearningFormat | "bundle";

export function validatePromo(
  rawCode: string,
  promoCodes: PromoCode[],
  scope: PromoScope,
): { ok: true; promo: PromoCode } | { ok: false; error: string } {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a promo code." };
  const promo = promoCodes.find((p) => p.code.toUpperCase() === code);
  if (!promo) return { ok: false, error: `We couldn't find "${code}". Check the spelling and try again.` };
  if (promo.status === "paused") return { ok: false, error: `${promo.code} is paused right now and can't be used.` };
  if (promo.status !== "active" || promo.validTill < DEMO_TODAY) return { ok: false, error: `${promo.code} has expired.` };
  if (promo.uses >= promo.maxUses) return { ok: false, error: `${promo.code} has reached its usage limit.` };
  if (promo.appliesTo !== "all" && promo.appliesTo !== scope) {
    const target = promo.appliesTo === "bundle" ? "bundles" : `${FORMAT_META[promo.appliesTo].label} purchases`;
    return { ok: false, error: `${promo.code} only applies to ${target}.` };
  }
  return { ok: true, promo };
}

export function promoDiscount(promo: PromoCode | undefined, amount: number) {
  if (!promo || amount <= 0) return 0;
  const raw = promo.discountType === "percent" ? Math.round((amount * promo.value) / 100) : promo.value;
  return Math.min(raw, amount);
}

// ---------- Checkout line resolution ----------

export interface CheckoutLine {
  kind: CheckoutItem["kind"];
  refId: string;
  title: string;
  /** Title stored on the order item, e.g. "Group Discussion Mastery · Live Cohort" */
  orderTitle: string;
  price: number;
  scope: PromoScope;
  format?: LearningFormat;
  course?: Course;
  cohort?: Cohort;
  pkg?: PricingPackage;
  mentor?: Mentor;
  offer?: MentoringOffer;
  slot?: { date: string; time: string };
}

export function resolveCheckout(item: CheckoutItem | null, packages: PricingPackage[]): CheckoutLine | null {
  if (!item) return null;
  if (item.kind === "course") {
    const course = getCourse(item.refId);
    if (!course || course.collegeId) return null;
    const format = item.format && course.formats.includes(item.format) ? item.format : course.formats[0];
    const price = course.pricing[format] ?? 0;
    return {
      kind: "course",
      refId: course.id,
      title: course.title,
      orderTitle: `${course.title} · ${FORMAT_META[format].label}`,
      price,
      scope: format,
      format,
      course,
      cohort: format === "live-cohort" ? nextCohort(course.id) : undefined,
    };
  }
  if (item.kind === "package") {
    const pkg = packages.find((p) => p.id === item.refId);
    if (!pkg) return null;
    return {
      kind: "package",
      refId: pkg.id,
      title: pkg.name,
      orderTitle: pkg.name,
      price: pkg.price,
      scope: pkg.format,
      format: pkg.format === "bundle" ? undefined : pkg.format,
      pkg,
    };
  }
  const found = getMentorOffer(item.refId);
  if (!found) return null;
  return {
    kind: "mentoring",
    refId: found.offer.id,
    title: found.offer.title,
    orderTitle: `${found.offer.title} · ${found.mentor.name}`,
    price: found.offer.price,
    scope: "mentoring",
    format: "mentoring",
    mentor: found.mentor,
    offer: found.offer,
    slot: item.slot,
  };
}

/** Enrolment plan for a package purchase (course → format, cohort). */
export function packageEnrollments(pkg: PricingPackage): { courseId: string; format: LearningFormat; cohortId?: string }[] {
  return pkg.courseIds.map((courseId) => {
    if (pkg.format === "bundle") {
      if (pkg.id === "pkg-placement-bundle" && courseId === "group-discussion-mastery") {
        return { courseId, format: "live-cohort" as const, cohortId: "coh-gdm-oct" };
      }
      return { courseId, format: "self-paced" as const };
    }
    return { courseId, format: pkg.format, cohortId: pkg.format === "live-cohort" ? nextCohort(courseId)?.id : undefined };
  });
}

/** Sum of individual list prices for the courses in a package, in the format they'd be enrolled in. */
export function packageListValue(pkg: PricingPackage) {
  return packageEnrollments(pkg).reduce((sum, e) => sum + (getCourse(e.courseId)?.pricing[e.format] ?? 0), 0);
}

export function packageSavings(pkg: PricingPackage) {
  const compare = pkg.compareAt ?? 0;
  return compare > pkg.price ? compare - pkg.price : 0;
}

export const PACKAGE_FORMAT_LABEL = (pkg: PricingPackage) => (pkg.format === "bundle" ? "Bundle" : FORMAT_META[pkg.format].label);
