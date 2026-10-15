import { addDays, format, getDay, parseISO } from "date-fns";
import type { Booking, Cohort, LiveSession } from "@/lib/types";
import { DEMO_TODAY } from "./constants";

export const cohorts: Cohort[] = [
  { id: "coh-gdm-oct", courseId: "group-discussion-mastery", name: "GD Mastery · October Evening Cohort", mentorId: "m-vikram", startDate: "2026-10-06", endDate: "2026-10-29", scheduleLabel: "Tue & Thu · 7:00 PM IST", seats: 40, enrolled: 36, status: "running" },
  { id: "coh-cms-oct", courseId: "communication-skills", name: "Communication Skills · October Cohort", mentorId: "m-kavya", startDate: "2026-10-05", endDate: "2026-10-29", scheduleLabel: "Mon & Thu · 8:00 PM IST", seats: 50, enrolled: 47, status: "running" },
  { id: "coh-psc-oct", courseId: "public-speaking-confidence", name: "Public Speaking · Autumn Cohort", mentorId: "m-kavya", startDate: "2026-10-13", endDate: "2026-11-03", scheduleLabel: "Tue · 6:30 PM IST", seats: 30, enrolled: 22, status: "running" },
  { id: "coh-lde-oct", courseId: "leadership-essentials", name: "Leadership Essentials · Cohort 7", mentorId: "m-rohan", startDate: "2026-09-30", endDate: "2026-11-11", scheduleLabel: "Wed · 8:00 PM IST", seats: 35, enrolled: 31, status: "running" },
  { id: "coh-cpr-sep", courseId: "campus-placement-readiness", name: "Placement Readiness · Season 2026", mentorId: "m-arjun", startDate: "2026-09-05", endDate: "2026-10-31", scheduleLabel: "Sat · 11:00 AM IST", seats: 80, enrolled: 74, status: "running" },
  { id: "coh-prr-oct", courseId: "professional-readiness", name: "Professional Readiness · October", mentorId: "m-sameer", startDate: "2026-10-13", endDate: "2026-11-10", scheduleLabel: "Tue · 8:30 PM IST", seats: 30, enrolled: 18, status: "running" },
  { id: "coh-inp-nov", courseId: "interview-preparation", name: "Interview Preparation · November Cohort", mentorId: "m-arjun", startDate: "2026-11-02", endDate: "2026-11-27", scheduleLabel: "Mon & Fri · 7:00 PM IST", seats: 40, enrolled: 23, status: "upcoming" },
  { id: "coh-cms-nov", courseId: "communication-skills", name: "Communication Skills · November Cohort", mentorId: "m-kavya", startDate: "2026-11-04", endDate: "2026-11-27", scheduleLabel: "Wed · 7:30 PM IST", seats: 50, enrolled: 19, status: "upcoming" },
  { id: "coh-psd-nov", courseId: "personality-development", name: "Personality Development · Teens Batch", mentorId: "m-neha", startDate: "2026-10-24", endDate: "2026-11-21", scheduleLabel: "Sat · 5:00 PM IST", seats: 30, enrolled: 14, status: "upcoming" },
  { id: "coh-ccp-oct", courseId: "career-clarity-for-parents", name: "Parents' Circle · Monthly Webinar", mentorId: "m-meera", startDate: "2026-09-26", endDate: "2026-12-26", scheduleLabel: "Last Saturday · 6:00 PM IST", seats: 200, enrolled: 132, status: "running" },
  { id: "coh-ait-a", courseId: "campus-placement-readiness", name: "AIT Placement Cohort · Batch A", mentorId: "m-arjun", startDate: "2026-09-08", endDate: "2026-11-14", scheduleLabel: "Mon · 6:00 PM IST", seats: 60, enrolled: 58, status: "running", collegeId: "col-ait" },
  { id: "coh-ait-b", courseId: "campus-placement-readiness", name: "AIT Placement Cohort · Batch B", mentorId: "m-sameer", startDate: "2026-09-10", endDate: "2026-11-16", scheduleLabel: "Thu · 6:00 PM IST", seats: 60, enrolled: 54, status: "running", collegeId: "col-ait" },
];

type CohortPlan = {
  cohortId: string;
  weekdays: number[];
  time: string;
  durationMin: number;
  titles: string[];
};

const plans: CohortPlan[] = [
  { cohortId: "coh-gdm-oct", weekdays: [2, 4], time: "19:00", durationMin: 75, titles: ["Kick-off: how GDs are scored", "Topic types and quick research", "Opening strong — live drills", "Mock GD round 1", "Building on others' points", "Mock GD round 2", "Summarising with impact", "Final mock GD + feedback"] },
  { cohortId: "coh-cms-oct", weekdays: [1, 4], time: "20:00", durationMin: 60, titles: ["Communication loop & listening", "Active listening practice", "PREP structure drills", "Voice, pace and pauses", "Email writing clinic", "Video-call communication", "Mini presentations", "Wrap-up & action plan"] },
  { cohortId: "coh-psc-oct", weekdays: [2], time: "18:30", durationMin: 75, titles: ["Taming stage fear", "Openers lab", "Storytelling workshop", "Final talks showcase"] },
  { cohortId: "coh-lde-oct", weekdays: [3], time: "20:00", durationMin: 90, titles: ["Leadership mindset", "Ownership in practice", "Feedback conversations role-play", "Delegation clinic", "Influence & stakeholder mapping", "Leading through change"] },
  { cohortId: "coh-cpr-sep", weekdays: [6], time: "11:00", durationMin: 120, titles: ["Placement season orientation", "Aptitude: quant strategies", "Aptitude: logical reasoning", "GD round practice", "Technical-HR interview prep", "Mock placement day", "HR interview drills", "Offer evaluation & final Q&A"] },
  { cohortId: "coh-prr-oct", weekdays: [2], time: "20:30", durationMin: 60, titles: ["Your first 90 days", "Workplace culture decoded", "Prioritisation lab", "Collaboration & feedback"] },
  { cohortId: "coh-inp-nov", weekdays: [1, 5], time: "19:00", durationMin: 75, titles: ["Interview landscape", "Tell me about yourself", "STAR stories workshop", "Tricky questions", "Mock interview night", "Offers & negotiation"] },
  { cohortId: "coh-cms-nov", weekdays: [3], time: "19:30", durationMin: 60, titles: ["Communication loop", "Structured speaking", "Professional writing", "Presentation practice"] },
  { cohortId: "coh-psd-nov", weekdays: [6], time: "17:00", durationMin: 60, titles: ["Knowing yourself", "Confidence habits", "Etiquette essentials", "Managing emotions"] },
  { cohortId: "coh-ait-a", weekdays: [1], time: "18:00", durationMin: 90, titles: ["Orientation with T&P cell", "Aptitude strategy", "GD practice", "Resume clinic", "Technical-HR prep", "Mock interviews", "Industry panel", "Offer readiness", "Final review", "Drive briefing"] },
  { cohortId: "coh-ait-b", weekdays: [4], time: "18:00", durationMin: 90, titles: ["Orientation with T&P cell", "Aptitude strategy", "GD practice", "Resume clinic", "Technical-HR prep", "Mock interviews", "Industry panel", "Offer readiness", "Final review", "Drive briefing"] },
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function buildCohortSessions(): LiveSession[] {
  const out: LiveSession[] = [];
  for (const plan of plans) {
    const cohort = cohorts.find((c) => c.id === plan.cohortId)!;
    let day = parseISO(cohort.startDate);
    const end = parseISO(cohort.endDate);
    let n = 0;
    while (day <= end && n < plan.titles.length) {
      if (plan.weekdays.includes(getDay(day))) {
        const date = format(day, "yyyy-MM-dd");
        const past = date < DEMO_TODAY;
        const id = `ses-${plan.cohortId.replace("coh-", "")}-${n + 1}`;
        out.push({
          id,
          title: `Class ${n + 1}: ${plan.titles[n]}`,
          courseId: cohort.courseId,
          cohortId: cohort.id,
          mentorId: cohort.mentorId,
          date,
          time: plan.time,
          durationMin: plan.durationMin,
          type: "cohort-class",
          audience: cohort.collegeId ? ["college"] : ["college", "graduate", "professional"],
          capacity: cohort.seats,
          booked: cohort.enrolled,
          status: past ? "completed" : "scheduled",
          recording: past ? { durationSec: plan.durationMin * 60 - 300 + (hash(id) % 240), views: 12 + (hash(id) % 40) } : undefined,
          collegeId: cohort.collegeId,
          description: `Live class for ${cohort.name}. Bring your questions — the recording is shared within 24 hours.`,
        });
        n++;
      }
      day = addDays(day, 1);
    }
  }
  return out;
}

/** Open sessions anyone can book (workshops, webinars, doubt-clearing hours). */
const openSessions: LiveSession[] = [
  { id: "ses-open-1", title: "GD doubt-clearing hour", courseId: "group-discussion-mastery", cohortId: "coh-gdm-oct", mentorId: "m-vikram", date: "2026-10-17", time: "18:00", durationMin: 60, type: "doubt-clearing", audience: ["college", "graduate"], capacity: 25, booked: 17, status: "scheduled", description: "Bring any GD question — topics, structure, nerves, evaluator feedback. Vikram answers live." },
  { id: "ses-open-2", title: "Workshop: Professional profile teardown", courseId: "resume-building", mentorId: "m-farah", date: "2026-10-18", time: "17:00", durationMin: 75, type: "workshop", audience: ["college", "graduate", "professional"], capacity: 60, booked: 41, status: "scheduled", description: "Live review of volunteer resumes and profiles, with a checklist you can apply immediately." },
  { id: "ses-open-3", title: "Webinar: Choosing a stream after Class 10", courseId: "career-clarity-for-parents", cohortId: "coh-ccp-oct", mentorId: "m-meera", date: "2026-10-24", time: "18:00", durationMin: 60, type: "webinar", audience: ["parent", "school"], capacity: 200, booked: 148, status: "scheduled", description: "For parents and Class 9–10 students: Science, Commerce or Humanities — how to decide together." },
  { id: "ses-open-4", title: "Interview doubt-clearing hour", courseId: "interview-preparation", mentorId: "m-arjun", date: "2026-10-21", time: "20:00", durationMin: 60, type: "doubt-clearing", audience: ["college", "graduate", "professional"], capacity: 30, booked: 12, status: "scheduled", description: "Open Q&A on HR rounds, tricky questions and follow-up emails." },
  { id: "ses-open-5", title: "Workshop: Speak without notes", courseId: "public-speaking-confidence", cohortId: "coh-psc-oct", mentorId: "m-kavya", date: "2026-10-23", time: "19:30", durationMin: 75, type: "workshop", audience: ["school", "college", "professional"], capacity: 40, booked: 33, status: "scheduled", description: "Practical techniques to speak fluently without reading from slides or cue cards." },
  { id: "ses-open-6", title: "Leadership AMA with Rohan Desai", courseId: "leadership-essentials", mentorId: "m-rohan", date: "2026-10-25", time: "19:00", durationMin: 60, type: "webinar", audience: ["graduate", "professional"], capacity: 100, booked: 54, status: "scheduled", description: "Ask-me-anything on first-time management, feedback and career growth." },
  { id: "ses-open-7", title: "Communication doubt-clearing hour", courseId: "communication-skills", cohortId: "coh-cms-oct", mentorId: "m-kavya", date: "2026-10-26", time: "19:00", durationMin: 45, type: "doubt-clearing", audience: ["college", "graduate", "professional"], capacity: 30, booked: 30, status: "scheduled", description: "Clear doubts from the PREP and email-writing assignments. Currently full — join the waitlist." },
  { id: "ses-open-8", title: "Teen confidence workshop", courseId: "personality-development", mentorId: "m-neha", date: "2026-10-31", time: "16:00", durationMin: 60, type: "workshop", audience: ["school"], capacity: 40, booked: 15, status: "scheduled", description: "Interactive confidence-building activities for Class 8–12 students." },
  { id: "ses-open-9", title: "Career switch clinic", courseId: "career-transition-blueprint", mentorId: "m-sameer", date: "2026-11-05", time: "20:30", durationMin: 60, type: "workshop", audience: ["professional"], capacity: 40, booked: 9, status: "scheduled", description: "Map transferable skills and test-drive a new career path." },
  { id: "ses-open-10", title: "Webinar: How placements really work", courseId: "campus-placement-readiness", mentorId: "m-arjun", date: "2026-10-08", time: "19:00", durationMin: 60, type: "webinar", audience: ["college"], capacity: 200, booked: 186, status: "completed", recording: { durationSec: 3420, views: 412 }, description: "Recorded webinar walking through a typical campus placement process." },
  { id: "ses-open-11", title: "GD doubt-clearing hour (week 1)", courseId: "group-discussion-mastery", cohortId: "coh-gdm-oct", mentorId: "m-vikram", date: "2026-10-10", time: "18:00", durationMin: 60, type: "doubt-clearing", audience: ["college", "graduate"], capacity: 25, booked: 22, status: "completed", recording: { durationSec: 3300, views: 64 }, description: "Week 1 doubts on evaluator scorecards and topic research." },
  { id: "ses-open-12", title: "Parents' Circle: September webinar", courseId: "career-clarity-for-parents", cohortId: "coh-ccp-oct", mentorId: "m-meera", date: "2026-09-26", time: "18:00", durationMin: 60, type: "webinar", audience: ["parent"], capacity: 200, booked: 171, status: "completed", recording: { durationSec: 3560, views: 238 }, description: "Talking to teenagers about careers without pressure." },
];

export const liveSessions: LiveSession[] = [...buildCohortSessions(), ...openSessions].sort((a, b) =>
  (a.date + a.time).localeCompare(b.date + b.time),
);

/** Seed bookings. The demo learner's bookings appear on the dashboard; the rest power mentor/admin views. */
export const bookings: Booking[] = [
  {
    id: "bk-1001",
    userId: "u-riya",
    kind: "mentoring",
    mentorId: "m-meera",
    offerId: "o-meera-clarity",
    date: "2026-09-26",
    time: "18:00",
    durationMin: 45,
    status: "completed",
    topic: "Choosing between marketing and HR roles",
    createdAt: "2026-09-20T14:12:00",
    notes:
      "Riya shows strong interest in people-facing, persuasive work. Her discovery snapshot and assessment both point to Enterprising + Social interests. Marketing (brand / digital) is a strong fit; HR is a reasonable second option. Main gap: confidence in group settings and structured answers under pressure.",
    followUps: [
      "Join the GD Mastery live cohort before placement season",
      "Draft three STAR stories from internship and college fest experience",
      "Book a mock interview with Arjun before 20 October",
    ],
    recommendedCourseIds: ["group-discussion-mastery", "interview-preparation"],
  },
  { id: "bk-1002", userId: "u-riya", kind: "mentoring", mentorId: "m-arjun", offerId: "o-arjun-mock", date: "2026-10-19", time: "19:00", durationMin: 50, status: "confirmed", topic: "Mock HR interview for marketing roles", createdAt: "2026-10-08T21:40:00" },
  { id: "bk-1003", userId: "u-riya", kind: "live-session", mentorId: "m-vikram", sessionId: "ses-open-1", date: "2026-10-17", time: "18:00", durationMin: 60, status: "confirmed", createdAt: "2026-10-12T09:15:00" },
  { id: "bk-1004", userId: "u-fatima", kind: "mentoring", mentorId: "m-kavya", offerId: "o-kavya-speak", date: "2026-10-15", time: "18:30", durationMin: 45, status: "confirmed", topic: "Seminar presentation nerves", createdAt: "2026-10-10T11:02:00" },
  { id: "bk-1005", userId: "u-ananya", kind: "mentoring", mentorId: "m-kavya", offerId: "o-kavya-present", date: "2026-10-15", time: "17:30", durationMin: 60, status: "confirmed", topic: "Quarterly review presentation rehearsal", createdAt: "2026-10-09T19:44:00" },
  { id: "bk-1006", userId: "u-tanvi", kind: "mentoring", mentorId: "m-kavya", offerId: "o-kavya-speak", date: "2026-10-16", time: "18:30", durationMin: 45, status: "confirmed", topic: "Speaking up in class discussions", createdAt: "2026-10-11T16:20:00" },
  { id: "bk-1007", userId: "u-aditya", kind: "mentoring", mentorId: "m-kavya", offerId: "o-kavya-present", date: "2026-10-20", time: "17:30", durationMin: 60, status: "confirmed", topic: "Final-year project viva rehearsal", createdAt: "2026-10-13T08:55:00" },
  { id: "bk-1008", userId: "u-meghna", kind: "mentoring", mentorId: "m-kavya", offerId: "o-kavya-present", date: "2026-10-22", time: "21:00", durationMin: 60, status: "confirmed", topic: "Product case presentation practice", createdAt: "2026-10-14T22:10:00" },
  { id: "bk-1009", userId: "u-nisha", kind: "mentoring", mentorId: "m-kavya", offerId: "o-kavya-speak", date: "2026-10-08", time: "18:30", durationMin: 45, status: "completed", topic: "Executive presence in meetings", createdAt: "2026-10-01T10:00:00", notes: "Worked on pausing and structured openers. Assigned: record a 2-minute update using PREP." },
  { id: "bk-1010", userId: "u-karan", kind: "mentoring", mentorId: "m-kavya", offerId: "o-kavya-speak", date: "2026-10-12", time: "18:30", durationMin: 45, status: "cancelled", topic: "Interview communication", createdAt: "2026-10-05T13:30:00" },
  { id: "bk-1011", userId: "u-karan", kind: "mentoring", mentorId: "m-arjun", offerId: "o-arjun-pack", date: "2026-10-16", time: "20:00", durationMin: 50, status: "confirmed", topic: "Operations role interviews", createdAt: "2026-10-07T17:25:00" },
  { id: "bk-1012", userId: "u-meghna", kind: "mentoring", mentorId: "m-sameer", offerId: "o-sameer-switch", date: "2026-10-17", time: "19:00", durationMin: 60, status: "confirmed", topic: "QA to product management switch", createdAt: "2026-10-06T12:00:00" },
  { id: "bk-1013", userId: "u-sunita", kind: "mentoring", mentorId: "m-meera", offerId: "o-meera-parent", date: "2026-10-24", time: "17:00", durationMin: 75, status: "confirmed", topic: "Arjun's stream selection after Class 10", createdAt: "2026-10-03T20:05:00" },
  { id: "bk-1014", userId: "u-ananya", kind: "mentoring", mentorId: "m-rohan", offerId: "o-rohan-pack", date: "2026-10-20", time: "20:00", durationMin: 60, status: "confirmed", topic: "First 90 days as a team lead", createdAt: "2026-10-02T09:30:00" },
  { id: "bk-1015", userId: "u-dev", kind: "mentoring", mentorId: "m-meera", offerId: "o-meera-report", date: "2026-10-12", time: "18:00", durationMin: 60, status: "completed", topic: "B.Tech vs B.Des decision", createdAt: "2026-10-04T15:45:00", notes: "Strong Artistic + Investigative profile. Recommended exploring B.Des (Interaction Design) and attending two design open days." },
];

/** Deterministic availability: which of a mentor's pattern slots are free on a date. */
export function isSlotTaken(mentorId: string, date: string, time: string) {
  if (bookings.some((b) => b.mentorId === mentorId && b.date === date && b.time === time && b.status !== "cancelled")) return true;
  return hash(`${mentorId}|${date}|${time}`) % 4 === 0;
}
