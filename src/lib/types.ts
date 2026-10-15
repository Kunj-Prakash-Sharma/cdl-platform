// Shared domain model for the CDL prototype. All data is synthetic demo data.

export type LearnerStage = "school" | "college" | "graduate" | "professional" | "parent";

/** The three learning levels. Use FORMAT_META for labels — never show bare level numbers alone. */
export type LearningFormat = "self-paced" | "live-cohort" | "mentoring";

export type CourseCategory =
  | "Career Discovery"
  | "Leadership"
  | "Communication"
  | "Employability"
  | "Personal Growth";

export type Role =
  | "visitor"
  | "learner"
  | "parent"
  | "college-admin"
  | "college-student"
  | "mentor"
  | "admin";

export type ThumbnailTheme = {
  /** Two-stop gradient, as CSS colors */
  from: string;
  to: string;
  /** lucide icon name key, resolved in CourseThumbnail */
  icon: string;
  pattern: "rings" | "grid" | "waves" | "dots" | "bars";
};

export interface Lesson {
  id: string;
  title: string;
  durationSec: number;
  kind: "video" | "reading" | "quiz";
  /** Free preview on the course detail page */
  preview?: boolean;
  summary?: string;
}

export interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface CourseReview {
  name: string;
  stage: LearnerStage;
  rating: number;
  text: string;
  date: string;
}

export interface Course {
  id: string; // slug, used in URLs: /courses/[id]
  title: string;
  subtitle: string;
  description: string;
  category: CourseCategory;
  /** Learning levels this course is offered in */
  formats: LearningFormat[];
  /** Price in INR per format. 0 = Free */
  pricing: Partial<Record<LearningFormat, number>>;
  audience: LearnerStage[];
  instructorId: string;
  durationLabel: string; // e.g. "4 weeks"
  rating: number;
  reviewCount: number;
  learners: number;
  outcomes: string[];
  includes: string[];
  chapters: Chapter[];
  thumbnail: ThumbnailTheme;
  tags: string[];
  relatedIds: string[];
  reviews: CourseReview[];
  status: "published" | "draft" | "in-review" | "unpublished";
  lastUpdated: string; // ISO date
  /** Institution-specific course: only visible to that college's students */
  collegeId?: string;
  featured?: boolean;
}

export interface MentoringOffer {
  id: string;
  title: string;
  description: string;
  durationMin: number;
  price: number; // INR
  sessions: number; // number of sessions included
}

export interface Mentor {
  id: string;
  name: string;
  title: string;
  headline: string;
  bio: string;
  expertise: string[];
  experienceYears: number;
  rating: number;
  reviewCount: number;
  sessionsDelivered: number;
  languages: string[];
  city: string;
  email: string;
  formats: LearningFormat[];
  offers: MentoringOffer[];
  /** Weekly availability pattern used to generate bookable slots (0 = Sunday) */
  availability: { weekdays: number[]; times: string[] };
  status: "active" | "pending-approval" | "inactive";
  joinedOn: string;
  avatar: AvatarSpec;
}

export interface AvatarSpec {
  skin: number; // index into skin palette
  hair: "short" | "long" | "bun" | "curly" | "bald" | "wavy" | "hijab";
  hairColor: number;
  bg: number;
  shirt: number;
  glasses?: boolean;
  beard?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string; // dummy numbers only
  email?: string;
  stage: LearnerStage;
  city: string;
  education: string; // e.g. "B.Com (Final year)"
  institution?: string;
  occupation?: string;
  interests: string[];
  goals: string[];
  collegeId?: string;
  childName?: string; // parents
  childStage?: LearnerStage;
  joinedOn: string;
  lastActive: string;
  status: "active" | "invited" | "inactive";
  profileCompletion: number; // 0-100
  avatar: AvatarSpec;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  format: LearningFormat;
  enrolledOn: string;
  cohortId?: string;
  orderId?: string;
  source: "purchase" | "college" | "free";
}

export interface Cohort {
  id: string;
  courseId: string;
  name: string;
  mentorId: string;
  startDate: string;
  endDate: string;
  scheduleLabel: string; // e.g. "Tue & Thu · 7:00 PM IST"
  seats: number;
  enrolled: number;
  collegeId?: string;
  status: "upcoming" | "running" | "completed";
}

export interface LiveSession {
  id: string;
  title: string;
  courseId: string;
  cohortId?: string;
  mentorId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24h, IST)
  durationMin: number;
  type: "cohort-class" | "doubt-clearing" | "workshop" | "webinar";
  audience: LearnerStage[];
  capacity: number;
  booked: number;
  status: "scheduled" | "live" | "completed" | "cancelled";
  recording?: { durationSec: number; views: number };
  collegeId?: string;
  description: string;
}

export interface Booking {
  id: string;
  userId: string;
  kind: "mentoring" | "live-session";
  mentorId: string;
  offerId?: string;
  sessionId?: string;
  date: string;
  time: string;
  durationMin: number;
  status: "confirmed" | "completed" | "cancelled";
  topic?: string;
  createdAt: string;
  notes?: string; // mock post-session notes
  followUps?: string[];
  recommendedCourseIds?: string[];
}

export interface Resource {
  id: string;
  title: string;
  fileType: "PDF" | "DOCX" | "XLSX" | "PPTX" | "ZIP";
  courseId: string;
  chapterId?: string;
  mentorId: string;
  sizeKb: number;
  description: string;
  previewLines: string[];
  updatedOn: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  kind: "quiz" | "assignment";
  description: string;
  dueDate: string;
  points: number;
  estimatedMin: number;
  questions?: QuizQuestion[];
  /** Initial state for the demo learner */
  status: "not-started" | "in-progress" | "submitted" | "graded";
  score?: number;
  feedback?: string;
}

export type AssessmentDimension = string;

export interface AssessmentOption {
  id: string;
  label: string;
  /** dimension key → points */
  scores: Record<AssessmentDimension, number>;
}

export interface AssessmentQuestion {
  id: string;
  section: string;
  prompt: string;
  options: AssessmentOption[];
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  category: "Interests" | "Personality" | "Employability" | "Strengths";
  estimatedMin: number;
  audience: LearnerStage[];
  status: "active" | "draft";
  questions: AssessmentQuestion[];
  /** dimension key → label + group */
  dimensions: Record<AssessmentDimension, { label: string; group: "interest" | "trait" | "skill" }>;
  completions: number;
  avgCompletionMin: number;
}

export interface AssessmentResult {
  id: string;
  assessmentId: string;
  userId: string;
  completedOn: string;
  /** dimension key → 0-100 */
  scores: Record<AssessmentDimension, number>;
  topInterests: string[];
  strengths: string[];
  developmentAreas: string[];
  recommendedCourseIds: string[];
}

export interface PricingPackage {
  id: string;
  name: string;
  format: LearningFormat | "bundle";
  description: string;
  price: number;
  compareAt?: number;
  courseIds: string[];
  features: string[];
  validity: string;
  highlight?: boolean;
  active: boolean;
}

export interface PromoCode {
  code: string;
  description: string;
  discountType: "percent" | "flat";
  value: number;
  validTill: string;
  uses: number;
  maxUses: number;
  status: "active" | "expired" | "paused";
  appliesTo: "all" | LearningFormat | "bundle";
}

export interface OrderItem {
  kind: "course" | "package" | "mentoring";
  refId: string; // course id, package id or mentor offer id
  format?: LearningFormat;
  title: string;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  promoCode?: string;
  /** All payments are simulated */
  paymentStatus: "paid" | "pending" | "failed" | "refunded";
  method: "UPI (simulated)" | "Card (simulated)" | "Net banking (simulated)" | "College licence";
  createdAt: string;
}

export interface ThreadReply {
  id: string;
  authorName: string;
  authorRole: "learner" | "mentor" | "admin";
  authorId?: string;
  body: string;
  createdAt: string;
  accepted?: boolean;
}

export interface DiscussionThread {
  id: string;
  courseId: string;
  /** doubt = instructor-led doubt clearing, community = peer discussion */
  channel: "doubt" | "community";
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  status: "unanswered" | "answered" | "resolved";
  tags: string[];
  upvotes: number;
  replies: ThreadReply[];
  lessonId?: string;
  flagged?: boolean;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  category: "Account" | "Payments" | "Course access" | "Live sessions" | "Certificates" | "Other";
  description: string;
  status: "open" | "in-progress" | "resolved";
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  issuedOn: string;
  hours: number;
}

export interface AppNotification {
  id: string;
  kind: "session" | "assignment" | "enrollment" | "profile" | "recommendation" | "announcement" | "mentoring";
  title: string;
  body: string;
  createdAt: string; // ISO datetime
  read: boolean;
  href?: string;
}

export interface FaqItem {
  id: string;
  category: "Getting started" | "Courses & levels" | "Payments" | "Live sessions" | "Mentoring" | "Certificates" | "Colleges";
  question: string;
  answer: string;
}

export interface College {
  id: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  type: "Engineering" | "Management" | "Arts & Commerce" | "University" | "School";
  brandColor: string;
  plan: "Campus Starter" | "Campus Pro" | "Campus Enterprise";
  seats: number;
  activeStudents: number;
  assignedCourseIds: string[];
  status: "active" | "onboarding" | "pending-review" | "paused";
  contactName: string;
  contactEmail: string;
  onboardedOn: string;
  licenceEnds: string;
  departments: string[];
}

export interface CollegeStudent {
  id: string;
  collegeId: string;
  name: string;
  rollNo: string;
  department: string;
  year: string;
  email: string;
  assignedCourseIds: string[];
  /** courseId → progress 0-100 */
  progress: Record<string, number>;
  lastActive: string;
  assessmentCompleted: boolean;
  cohortId?: string;
  avatar: AvatarSpec;
}

export interface ContentItem {
  id: string;
  courseId: string;
  chapterId: string;
  title: string;
  description: string;
  durationSec: number;
  resolution: "720p" | "1080p" | "1440p" | "4K";
  sizeMb: number;
  mentorId: string;
  uploadedOn: string;
  status: "published" | "in-review" | "draft" | "changes-requested";
  views: number;
  resourceIds?: string[];
  reviewNote?: string;
}

export interface DiscoveryStep {
  id: "contact" | "name" | "persona" | "stage" | "background" | "interests" | "challenges" | "goals" | "snapshot";
  label: string;
  order: number;
}

export interface ConversationMessage {
  from: "assistant" | "visitor";
  text: string;
  at: string; // HH:mm
}

export interface AnonymousConversation {
  id: string; // e.g. "V-20481"
  startedAt: string; // ISO datetime
  source: "Instagram" | "Google Search" | "Direct" | "YouTube" | "WhatsApp" | "College partner" | "Referral";
  device: "Mobile" | "Desktop" | "Tablet";
  stage?: LearnerStage;
  persona: "self" | "parent" | "unknown";
  lastStepId: DiscoveryStep["id"];
  messages: number;
  durationSec: number;
  completed: boolean;
  interestCategory?: CourseCategory;
  programViewed?: string; // course id
  checkoutStarted: boolean;
  purchased: boolean;
  followUp: "none" | "callback-requested" | "follow-up-scheduled" | "nurture" | "converted";
  transcript?: ConversationMessage[];
  city?: string;
}

export interface FunnelDay {
  date: string; // YYYY-MM-DD
  visitors: number;
  conversations: number;
  snapshots: number;
  programViews: number;
  checkouts: number;
  purchases: number;
  assessments: number;
  courseViews: number;
}

export interface CheckoutItem {
  kind: OrderItem["kind"];
  refId: string;
  format?: LearningFormat;
  /** For mentoring bookings carried into checkout */
  mentorId?: string;
  slot?: { date: string; time: string };
}

export interface DiscoveryAnswers {
  phone?: string;
  name?: string;
  persona?: "self" | "parent";
  stage?: LearnerStage;
  childName?: string;
  background?: string;
  interests: string[];
  challenges: string[];
  goals: string[];
  freeText?: Record<string, string>;
}

export interface DiscoveryResult {
  createdAt: string;
  headline: string;
  summary: string;
  interestAreas: string[];
  developmentAreas: string[];
  recommendations: { title: string; reason: string; courseId: string; format: LearningFormat }[];
  suggestedPackageId?: string;
}

export interface CallbackRequest {
  id: string;
  name: string;
  phone: string;
  topic: string;
  preferredTime: string;
  createdAt: string;
  status: "requested" | "scheduled" | "done";
}
