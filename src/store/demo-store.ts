"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  assessmentResults as seedAssessmentResults,
  bookings as seedBookings,
  colleges as seedColleges,
  contentItems as seedContentItems,
  enrollments as seedEnrollments,
  notifications as seedNotifications,
  orders as seedOrders,
  packages as seedPackages,
  promoCodes as seedPromoCodes,
  seedLessonProgress,
  supportTickets as seedTickets,
  threads as seedThreads,
} from "@/data";
import { DEMO_NOW } from "@/data/constants";
import type {
  AppNotification,
  AssessmentResult,
  Booking,
  CallbackRequest,
  CheckoutItem,
  College,
  ContentItem,
  Course,
  DiscoveryAnswers,
  DiscoveryResult,
  DiscussionThread,
  Enrollment,
  LearningFormat,
  Mentor,
  Order,
  PricingPackage,
  PromoCode,
  Role,
  SupportTicket,
  ThreadReply,
  UserProfile,
} from "@/lib/types";

let counter = 0;
/** Short unique-ish id for records created during the demo. */
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(counter++).toString(36)}`;
/** Demo "now" timestamp for created records — keeps timelines consistent with seeded data. */
export const demoTimestamp = () => {
  const d = new Date();
  return `${DEMO_NOW.slice(0, 10)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`;
};

export interface DiscoveryState {
  answers: DiscoveryAnswers;
  /** index into the flow's step list, owned by the discovery UI */
  stepIndex: number;
  startedAt?: string;
  result?: DiscoveryResult;
}

export interface Submission {
  status: "in-progress" | "submitted" | "graded";
  answers?: number[];
  note?: string;
  score?: number;
  feedback?: string;
  submittedAt?: string;
}

export interface AssessmentDraft {
  answers: Record<string, string>; // questionId → optionId
  index: number;
  updatedAt: string;
}

interface DemoData {
  role: Role;
  isLoggedIn: boolean;
  profileOverrides: Record<string, Partial<UserProfile>>;
  profileReminderDismissed: boolean;

  enrollments: Enrollment[];
  lessonProgress: Record<string, string[]>;
  lastLesson: Record<string, string>;
  bookings: Booking[];
  orders: Order[];
  checkout: CheckoutItem | null;
  notifications: AppNotification[];

  discovery: DiscoveryState;
  callbackRequests: CallbackRequest[];
  assessmentDrafts: Record<string, AssessmentDraft>;
  assessmentResults: AssessmentResult[];
  submissions: Record<string, Submission>;

  threads: DiscussionThread[];
  supportTickets: SupportTicket[];
  contentItems: ContentItem[];

  colleges: College[];
  /** Courses created in the admin console during the demo (drafts; not shown in the public catalog) */
  customCourses: Course[];
  packages: PricingPackage[];
  promoCodes: PromoCode[];
  courseStatus: Record<string, Course["status"]>;
  mentorStatus: Record<string, Mentor["status"]>;
  /** mentorId → "YYYY-MM-DD|HH:mm" slots the mentor has blocked */
  blockedSlots: Record<string, string[]>;
  /** mentorId → extra "YYYY-MM-DD|HH:mm" slots the mentor opened */
  extraSlots: Record<string, string[]>;
}

interface DemoActions {
  setRole: (role: Role) => void;
  login: () => void;
  logout: () => void;
  updateProfile: (userId: string, patch: Partial<UserProfile>) => void;
  dismissProfileReminder: () => void;

  enroll: (input: { userId: string; courseId: string; format: LearningFormat; cohortId?: string; orderId?: string; source?: Enrollment["source"] }) => Enrollment;
  setLessonComplete: (courseId: string, lessonId: string, done: boolean) => void;
  setLastLesson: (courseId: string, lessonId: string) => void;

  addBooking: (b: Omit<Booking, "id" | "createdAt" | "status"> & { status?: Booking["status"] }) => Booking;
  cancelBooking: (id: string) => void;
  rescheduleBooking: (id: string, date: string, time: string) => void;
  /** e.g. mentor marks a session completed and adds notes / follow-ups for the learner */
  updateBooking: (id: string, patch: Partial<Booking>) => void;

  setCheckout: (item: CheckoutItem | null) => void;
  placeOrder: (o: Omit<Order, "id" | "createdAt" | "paymentStatus">) => Order;

  addNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  saveDiscovery: (patch: Partial<DiscoveryState>) => void;
  resetDiscovery: () => void;
  requestCallback: (r: Omit<CallbackRequest, "id" | "createdAt" | "status">) => CallbackRequest;

  saveAssessmentDraft: (assessmentId: string, draft: Omit<AssessmentDraft, "updatedAt">) => void;
  clearAssessmentDraft: (assessmentId: string) => void;
  addAssessmentResult: (r: Omit<AssessmentResult, "id">) => AssessmentResult;

  saveSubmission: (assignmentId: string, s: Submission) => void;

  addThread: (t: Omit<DiscussionThread, "id" | "createdAt" | "replies" | "upvotes" | "status">) => DiscussionThread;
  addReply: (threadId: string, r: Omit<ThreadReply, "id" | "createdAt">) => void;
  setThreadStatus: (threadId: string, status: DiscussionThread["status"]) => void;
  setThreadFlag: (threadId: string, flagged: boolean) => void;
  removeReply: (threadId: string, replyId: string) => void;
  removeThread: (threadId: string) => void;
  upvoteThread: (threadId: string) => void;

  addTicket: (t: Omit<SupportTicket, "id" | "createdAt" | "updatedAt" | "status">) => SupportTicket;
  setTicketStatus: (id: string, status: SupportTicket["status"]) => void;

  addContentItem: (c: Omit<ContentItem, "id" | "uploadedOn" | "views">) => ContentItem;
  updateContentItem: (id: string, patch: Partial<ContentItem>) => void;
  removeContentItem: (id: string) => void;

  addCollege: (c: Omit<College, "id">) => College;
  updateCollege: (id: string, patch: Partial<College>) => void;
  addCustomCourse: (c: Course) => void;
  updateCustomCourse: (id: string, patch: Partial<Course>) => void;
  updatePackage: (id: string, patch: Partial<PricingPackage>) => void;
  addPromoCode: (p: PromoCode) => void;
  updatePromoCode: (code: string, patch: Partial<PromoCode>) => void;
  setCourseStatus: (courseId: string, status: Course["status"]) => void;
  setMentorStatus: (mentorId: string, status: Mentor["status"]) => void;
  toggleMentorSlot: (mentorId: string, slotKey: string, open: boolean) => void;

  resetDemo: () => void;
}

export type DemoStore = DemoData & DemoActions;

/**
 * localStorage when available; otherwise (server render, private mode, blocked site data) an
 * in-memory fallback so the persist API always exists and hydration always completes.
 */
const memory = new Map<string, string>();
const memoryStorage = {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
};
function baseStorage() {
  try {
    if (typeof window === "undefined") return memoryStorage;
    const probe = "__cdl_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return memoryStorage;
  }
}

/**
 * Writes are ignored until the saved state has been restored. Otherwise a component that changes
 * state on mount (e.g. a portal switching the demo role) would overwrite the saved demo with seed
 * data before it was read back.
 */
let hydrationDone = false;
function safeStorage() {
  const base = baseStorage();
  return {
    getItem: (k: string) => base.getItem(k),
    setItem: (k: string, v: string) => {
      if (hydrationDone) base.setItem(k, v);
    },
    removeItem: (k: string) => base.removeItem(k),
  };
}

const initialData = (): DemoData => ({
  role: "visitor",
  isLoggedIn: false,
  profileOverrides: {},
  profileReminderDismissed: false,
  enrollments: seedEnrollments,
  lessonProgress: seedLessonProgress,
  lastLesson: { "group-discussion-mastery": "gdm-4", "interview-preparation": "inp-3" },
  bookings: seedBookings,
  orders: seedOrders,
  checkout: null,
  notifications: seedNotifications,
  discovery: { answers: { interests: [], challenges: [], goals: [] }, stepIndex: 0 },
  callbackRequests: [],
  assessmentDrafts: {},
  assessmentResults: seedAssessmentResults,
  submissions: {},
  threads: seedThreads,
  supportTickets: seedTickets,
  contentItems: seedContentItems,
  colleges: seedColleges,
  customCourses: [],
  packages: seedPackages,
  promoCodes: seedPromoCodes,
  courseStatus: {},
  mentorStatus: {},
  blockedSlots: {},
  extraSlots: {},
});

export const useDemoStore = create<DemoStore>()(
  persist(
    (set, get) => ({
      ...initialData(),

      setRole: (role) => set({ role, isLoggedIn: role === "learner" || role === "parent" ? true : get().isLoggedIn }),
      login: () => set((s) => ({ isLoggedIn: true, role: s.role === "parent" ? "parent" : "learner" })),
      logout: () => set({ isLoggedIn: false, role: "visitor" }),
      updateProfile: (userId, patch) =>
        set((s) => ({ profileOverrides: { ...s.profileOverrides, [userId]: { ...s.profileOverrides[userId], ...patch } } })),
      dismissProfileReminder: () => set({ profileReminderDismissed: true }),

      enroll: ({ userId, courseId, format, cohortId, orderId, source = "purchase" }) => {
        const existing = get().enrollments.find((e) => e.userId === userId && e.courseId === courseId);
        if (existing) {
          // Upgrades (e.g. Self-Paced → Live Cohort) replace the format but keep progress
          const upgraded = { ...existing, format, cohortId: cohortId ?? existing.cohortId, orderId: orderId ?? existing.orderId };
          set((s) => ({ enrollments: s.enrollments.map((e) => (e.id === existing.id ? upgraded : e)) }));
          return upgraded;
        }
        const enrollment: Enrollment = { id: newId("en"), userId, courseId, format, cohortId, orderId, source, enrolledOn: DEMO_NOW.slice(0, 10) };
        set((s) => ({ enrollments: [enrollment, ...s.enrollments] }));
        return enrollment;
      },
      setLessonComplete: (courseId, lessonId, done) =>
        set((s) => {
          const current = s.lessonProgress[courseId] ?? [];
          const next = done ? Array.from(new Set([...current, lessonId])) : current.filter((id) => id !== lessonId);
          return { lessonProgress: { ...s.lessonProgress, [courseId]: next } };
        }),
      setLastLesson: (courseId, lessonId) => set((s) => ({ lastLesson: { ...s.lastLesson, [courseId]: lessonId } })),

      addBooking: (b) => {
        const booking: Booking = { ...b, id: newId("bk"), createdAt: demoTimestamp(), status: b.status ?? "confirmed" };
        set((s) => ({ bookings: [booking, ...s.bookings] }));
        return booking;
      },
      cancelBooking: (id) => set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)) })),
      rescheduleBooking: (id, date, time) =>
        set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, date, time, status: "confirmed" } : b)) })),
      updateBooking: (id, patch) => set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),

      setCheckout: (checkout) => set({ checkout }),
      placeOrder: (o) => {
        const order: Order = { ...o, id: `ORD-26-${Math.floor(2000 + Math.random() * 7000)}`, createdAt: demoTimestamp(), paymentStatus: "paid" };
        set((s) => ({ orders: [order, ...s.orders] }));
        return order;
      },

      addNotification: (n) =>
        set((s) => ({ notifications: [{ ...n, id: newId("n"), createdAt: demoTimestamp(), read: false }, ...s.notifications] })),
      markNotificationRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      saveDiscovery: (patch) => set((s) => ({ discovery: { ...s.discovery, ...patch, answers: { ...s.discovery.answers, ...patch.answers } } })),
      resetDiscovery: () => set({ discovery: initialData().discovery }),
      requestCallback: (r) => {
        const req: CallbackRequest = { ...r, id: newId("cb"), createdAt: demoTimestamp(), status: "requested" };
        set((s) => ({ callbackRequests: [req, ...s.callbackRequests] }));
        return req;
      },

      saveAssessmentDraft: (assessmentId, draft) =>
        set((s) => ({ assessmentDrafts: { ...s.assessmentDrafts, [assessmentId]: { ...draft, updatedAt: demoTimestamp() } } })),
      clearAssessmentDraft: (assessmentId) =>
        set((s) => {
          const next = { ...s.assessmentDrafts };
          delete next[assessmentId];
          return { assessmentDrafts: next };
        }),
      addAssessmentResult: (r) => {
        const result: AssessmentResult = { ...r, id: newId("ar") };
        set((s) => ({ assessmentResults: [result, ...s.assessmentResults] }));
        return result;
      },

      saveSubmission: (assignmentId, sub) => set((s) => ({ submissions: { ...s.submissions, [assignmentId]: sub } })),

      addThread: (t) => {
        const thread: DiscussionThread = { ...t, id: newId("th"), createdAt: demoTimestamp(), replies: [], upvotes: 0, status: "unanswered" };
        set((s) => ({ threads: [thread, ...s.threads] }));
        return thread;
      },
      addReply: (threadId, r) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  replies: [...t.replies, { ...r, id: newId("rp"), createdAt: demoTimestamp() }],
                  status: t.status === "unanswered" && r.authorRole !== "learner" ? "answered" : t.status,
                }
              : t,
          ),
        })),
      setThreadStatus: (threadId, status) => set((s) => ({ threads: s.threads.map((t) => (t.id === threadId ? { ...t, status } : t)) })),
      setThreadFlag: (threadId, flagged) => set((s) => ({ threads: s.threads.map((t) => (t.id === threadId ? { ...t, flagged } : t)) })),
      removeReply: (threadId, replyId) =>
        set((s) => ({ threads: s.threads.map((t) => (t.id === threadId ? { ...t, replies: t.replies.filter((r) => r.id !== replyId) } : t)) })),
      removeThread: (threadId) => set((s) => ({ threads: s.threads.filter((t) => t.id !== threadId) })),
      upvoteThread: (threadId) => set((s) => ({ threads: s.threads.map((t) => (t.id === threadId ? { ...t, upvotes: t.upvotes + 1 } : t)) })),

      addTicket: (t) => {
        const ticket: SupportTicket = { ...t, id: `SR-${2050 + get().supportTickets.length}`, createdAt: demoTimestamp(), updatedAt: demoTimestamp(), status: "open" };
        set((s) => ({ supportTickets: [ticket, ...s.supportTickets] }));
        return ticket;
      },
      setTicketStatus: (id, status) =>
        set((s) => ({ supportTickets: s.supportTickets.map((t) => (t.id === id ? { ...t, status, updatedAt: demoTimestamp() } : t)) })),

      addContentItem: (c) => {
        const item: ContentItem = { ...c, id: newId("ci"), uploadedOn: DEMO_NOW.slice(0, 10), views: 0 };
        set((s) => ({ contentItems: [item, ...s.contentItems] }));
        return item;
      },
      updateContentItem: (id, patch) => set((s) => ({ contentItems: s.contentItems.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeContentItem: (id) => set((s) => ({ contentItems: s.contentItems.filter((c) => c.id !== id) })),

      addCollege: (c) => {
        const college: College = { ...c, id: newId("col") };
        set((s) => ({ colleges: [...s.colleges, college] }));
        return college;
      },
      updateCollege: (id, patch) => set((s) => ({ colleges: s.colleges.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      addCustomCourse: (c) => set((s) => ({ customCourses: [c, ...s.customCourses] })),
      updateCustomCourse: (id, patch) => set((s) => ({ customCourses: s.customCourses.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      updatePackage: (id, patch) => set((s) => ({ packages: s.packages.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      addPromoCode: (p) => set((s) => ({ promoCodes: [p, ...s.promoCodes] })),
      updatePromoCode: (code, patch) => set((s) => ({ promoCodes: s.promoCodes.map((p) => (p.code === code ? { ...p, ...patch } : p)) })),
      setCourseStatus: (courseId, status) => set((s) => ({ courseStatus: { ...s.courseStatus, [courseId]: status } })),
      setMentorStatus: (mentorId, status) => set((s) => ({ mentorStatus: { ...s.mentorStatus, [mentorId]: status } })),
      toggleMentorSlot: (mentorId, slotKey, open) =>
        set((s) => {
          const blocked = new Set(s.blockedSlots[mentorId] ?? []);
          const extra = new Set(s.extraSlots[mentorId] ?? []);
          if (open) {
            blocked.delete(slotKey);
            extra.add(slotKey);
          } else {
            blocked.add(slotKey);
            extra.delete(slotKey);
          }
          return {
            blockedSlots: { ...s.blockedSlots, [mentorId]: [...blocked] },
            extraSlots: { ...s.extraSlots, [mentorId]: [...extra] },
          };
        }),

      resetDemo: () => set({ ...initialData() }),
    }),
    {
      name: "cdl-demo-v1",
      version: 1,
      storage: createJSONStorage(safeStorage),
      // Rehydrated manually in <DemoProvider> after mount to avoid SSR hydration mismatches.
      skipHydration: true,
      onRehydrateStorage: () => () => {
        hydrationDone = true;
      },
    },
  ),
);
