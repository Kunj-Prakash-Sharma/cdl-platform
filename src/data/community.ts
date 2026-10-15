import type { AppNotification, DiscussionThread, FaqItem, SupportTicket } from "@/lib/types";

export const threads: DiscussionThread[] = [
  {
    id: "th-301", courseId: "group-discussion-mastery", channel: "doubt", lessonId: "gdm-3",
    title: "Is it okay to open a GD with a question instead of a stance?",
    body: "In class 2 Vikram sir mentioned the question opener. Won't evaluators think I'm avoiding taking a position?",
    authorId: "u-riya", authorName: "Riya Mehta", createdAt: "2026-10-09T21:12:00", status: "resolved", tags: ["Openers"], upvotes: 14,
    replies: [
      { id: "rp-1", authorName: "Vikram Rao", authorRole: "mentor", authorId: "m-vikram", body: "Great question. A question opener works when you follow it within 20–30 seconds with your own framing — e.g. 'Is remote work here to stay? I'd argue it depends on three factors…'. Avoid ending on the question alone.", createdAt: "2026-10-10T09:05:00", accepted: true },
      { id: "rp-2", authorName: "Aditya Menon", authorRole: "learner", body: "This helped me in yesterday's mock too — framing right after the question kept the group focused.", createdAt: "2026-10-10T12:40:00" },
    ],
  },
  {
    id: "th-302", courseId: "group-discussion-mastery", channel: "doubt", lessonId: "gdm-4",
    title: "How do I enter when two people keep talking over each other?",
    body: "In the live drills in Class 3 I barely got space to speak. Any tips beyond 'wait for a pause'?",
    authorId: "u-fatima", authorName: "Fatima Sheikh", createdAt: "2026-10-13T20:31:00", status: "answered", tags: ["Participation"], upvotes: 9,
    replies: [
      { id: "rp-3", authorName: "Vikram Rao", authorRole: "mentor", authorId: "m-vikram", body: "Use a bridge phrase that acknowledges both: 'Both Rahul and Neha raise valid points — let me add a third angle…'. Lean in, open palm, and keep your first sentence short. We'll practise this live on Thursday.", createdAt: "2026-10-14T08:20:00" },
    ],
  },
  {
    id: "th-303", courseId: "group-discussion-mastery", channel: "doubt",
    title: "Should we use statistics if we're not 100% sure of the exact number?",
    body: "I remember approximate figures from news articles but not exact numbers. Is it risky?",
    authorId: "u-aditya", authorName: "Aditya Menon", createdAt: "2026-10-14T22:02:00", status: "unanswered", tags: ["Content"], upvotes: 6, replies: [],
  },
  {
    id: "th-304", courseId: "group-discussion-mastery", channel: "community",
    title: "Practice group for weekend GD drills?",
    body: "Anyone from the October cohort want to do 30-min online GD drills on Saturday mornings?",
    authorId: "u-aditya", authorName: "Aditya Menon", createdAt: "2026-10-11T10:15:00", status: "answered", tags: ["Practice"], upvotes: 11,
    replies: [
      { id: "rp-4", authorName: "Riya Mehta", authorRole: "learner", authorId: "u-riya", body: "Count me in! 10 AM works for me.", createdAt: "2026-10-11T11:02:00" },
      { id: "rp-5", authorName: "Fatima Sheikh", authorRole: "learner", body: "Same here — let's use the topic bank PDF.", createdAt: "2026-10-11T13:47:00" },
    ],
  },
  {
    id: "th-305", courseId: "interview-preparation", channel: "doubt", lessonId: "inp-2",
    title: "How long should 'Tell me about yourself' be?",
    body: "My current answer is around 3 minutes. Is that too long for a fresher?",
    authorId: "u-riya", authorName: "Riya Mehta", createdAt: "2026-10-12T19:44:00", status: "answered", tags: ["Self-introduction"], upvotes: 18,
    replies: [
      { id: "rp-6", authorName: "Arjun Malhotra", authorRole: "mentor", authorId: "m-arjun", body: "Aim for 60–90 seconds. Present → past → why this role. Cut anything that doesn't support the role you're interviewing for. We'll refine yours in our mock on the 19th.", createdAt: "2026-10-13T09:10:00" },
    ],
  },
  {
    id: "th-306", courseId: "interview-preparation", channel: "doubt", lessonId: "inp-3",
    title: "Can a STAR story come from a college fest instead of an internship?",
    body: "I have only one internship. Are fest and club experiences acceptable for behavioural questions?",
    authorId: "u-rohit", authorName: "Rohit Sharma", createdAt: "2026-10-14T17:30:00", status: "unanswered", tags: ["STAR"], upvotes: 7, replies: [],
  },
  {
    id: "th-307", courseId: "communication-skills", channel: "doubt", lessonId: "cms-3",
    title: "PREP vs STAR — when do I use which?",
    body: "Both seem similar. Which one is better for GDs vs interviews?",
    authorId: "u-tanvi", authorName: "Tanvi Deshmukh", createdAt: "2026-10-12T20:05:00", status: "unanswered", tags: ["Frameworks"], upvotes: 12, replies: [],
  },
  {
    id: "th-308", courseId: "communication-skills", channel: "doubt", lessonId: "cms-5",
    title: "Is it unprofessional to use bullet points in emails?",
    body: "My manager writes long paragraphs. Will bullets look too casual?",
    authorId: "u-ananya", authorName: "Ananya Rao", createdAt: "2026-10-10T08:50:00", status: "resolved", tags: ["Email"], upvotes: 15,
    replies: [
      { id: "rp-7", authorName: "Kavya Nair", authorRole: "mentor", authorId: "m-kavya", body: "Bullets are perfectly professional — they're kinder to busy readers. Keep a one-line context sentence above them and a clear ask below.", createdAt: "2026-10-10T12:15:00", accepted: true },
    ],
  },
  {
    id: "th-309", courseId: "public-speaking-confidence", channel: "doubt", lessonId: "psc-2",
    title: "My voice shakes in the first minute — any quick fix?",
    body: "Breathing helps a bit but my voice still trembles at the start of every talk.",
    authorId: "u-fatima", authorName: "Fatima Sheikh", createdAt: "2026-10-14T21:18:00", status: "unanswered", tags: ["Stage fear"], upvotes: 8, replies: [],
  },
  {
    id: "th-310", courseId: "leadership-essentials", channel: "doubt", lessonId: "lde-4",
    title: "How do I delegate to someone senior to me in age?",
    body: "I lead a small team where two members are older than me. Delegating feels awkward.",
    authorId: "u-ananya", authorName: "Ananya Rao", createdAt: "2026-10-08T19:20:00", status: "answered", tags: ["Delegation"], upvotes: 10,
    replies: [
      { id: "rp-8", authorName: "Rohan Desai", authorRole: "mentor", authorId: "m-rohan", body: "Frame delegation around their expertise and the outcome, not the task: 'You know this client best — could you own the renewal proposal?' Ask how they'd like to be kept in the loop.", createdAt: "2026-10-09T08:00:00" },
    ],
  },
  {
    id: "th-311", courseId: "interview-preparation", channel: "community",
    title: "Share your best 'Why should we hire you?' answers",
    body: "Let's pool answers and give each other feedback.",
    authorId: "u-karan", authorName: "Karan Bhatia", createdAt: "2026-10-06T14:00:00", status: "answered", tags: ["Peer review"], upvotes: 21, flagged: true,
    replies: [
      { id: "rp-9", authorName: "Rohit Sharma", authorRole: "learner", body: "Mine: 'Because I combine strong numbers skills with customer empathy…' — feedback welcome!", createdAt: "2026-10-06T15:12:00" },
      { id: "rp-10", authorName: "Anonymous user", authorRole: "learner", body: "Check out my paid answer pack on [external link removed]", createdAt: "2026-10-07T01:20:00" },
    ],
  },
  {
    id: "th-312", courseId: "campus-placement-readiness", channel: "doubt", lessonId: "cpr-3",
    title: "Time per question in aptitude sections?",
    body: "How much time should we spend before skipping a question?",
    authorId: "u-aditya", authorName: "Aditya Menon", createdAt: "2026-10-03T18:40:00", status: "resolved", tags: ["Aptitude"], upvotes: 13,
    replies: [
      { id: "rp-11", authorName: "Arjun Malhotra", authorRole: "mentor", authorId: "m-arjun", body: "Use the 60-second rule on first pass. Mark and move. Return only if time remains — most cut-offs reward accuracy over attempts.", createdAt: "2026-10-04T09:30:00", accepted: true },
    ],
  },
];

export const supportTickets: SupportTicket[] = [
  { id: "SR-2041", userId: "u-riya", userName: "Riya Mehta", subject: "Class 3 recording not visible", category: "Live sessions", description: "The recording for GD Mastery Class 3 isn't showing in my recordings tab.", status: "resolved", priority: "medium", createdAt: "2026-10-14T08:10:00", updatedAt: "2026-10-14T15:22:00" },
  { id: "SR-2043", userId: "u-rohit", userName: "Rohit Sharma", subject: "Payment failed but amount debited", category: "Payments", description: "My card payment for the Placement Ready Bundle failed but I see a debit (simulated scenario).", status: "in-progress", priority: "high", createdAt: "2026-10-09T15:55:00", updatedAt: "2026-10-13T11:00:00" },
  { id: "SR-2044", userId: "u-sahil", userName: "Sahil Verma", subject: "Can't finish profile setup", category: "Account", description: "The education step keeps asking for my college name even after I enter it.", status: "open", priority: "medium", createdAt: "2026-10-12T23:20:00", updatedAt: "2026-10-12T23:20:00" },
  { id: "SR-2045", userId: "u-sunita", userName: "Sunita Iyer", subject: "Add my son to the webinar", category: "Live sessions", description: "Can Arjun join the stream selection webinar with me on the same booking?", status: "open", priority: "low", createdAt: "2026-10-13T19:05:00", updatedAt: "2026-10-13T19:05:00" },
  { id: "SR-2046", userId: "u-ananya", userName: "Ananya Rao", subject: "Certificate name spelling", category: "Certificates", description: "Please update my certificate name to 'Ananya S. Rao'.", status: "resolved", priority: "low", createdAt: "2026-10-05T10:00:00", updatedAt: "2026-10-06T09:30:00" },
  { id: "SR-2047", userId: "u-fatima", userName: "Fatima Sheikh", subject: "College course not showing", category: "Course access", description: "My college says Campus Placement Readiness is assigned, but I can't see it.", status: "in-progress", priority: "medium", createdAt: "2026-10-14T12:15:00", updatedAt: "2026-10-15T09:00:00" },
  { id: "SR-2048", userId: "u-dev", userName: "Dev Kulkarni", subject: "Reschedule mentoring session", category: "Other", description: "I need to move my follow-up session with Dr. Meera to next week.", status: "open", priority: "low", createdAt: "2026-10-15T08:40:00", updatedAt: "2026-10-15T08:40:00" },
];

export const faqs: FaqItem[] = [
  { id: "f1", category: "Getting started", question: "Do I need to register to try Career Discovery?", answer: "No. Start the free career discovery conversation with just a phone number (in this demo, any number works — nothing is verified or stored). You can create a full profile later if you decide to enrol." },
  { id: "f2", category: "Getting started", question: "Who is CDL for?", answer: "School students, college students, graduates and job seekers, working professionals and parents. Programmes and recommendations adapt to your stage." },
  { id: "f3", category: "Courses & levels", question: "What's the difference between Self-Paced, Live Cohort and One-to-One Mentoring?", answer: "Self-Paced gives you recorded lessons, resources and quizzes. Live Cohort adds scheduled evening classes with a mentor and peers, session recordings and doubt-clearing. One-to-One Mentoring is private, personalised guidance with an expert." },
  { id: "f4", category: "Courses & levels", question: "Can I upgrade from Self-Paced to Live Cohort?", answer: "Yes. Your progress carries over, and you only pay the difference (illustrative policy for the demo)." },
  { id: "f5", category: "Courses & levels", question: "How long do I have access to a course?", answer: "Self-Paced courses are available for 12 months from enrolment. Live Cohort recordings remain available for 6 months after your cohort ends." },
  { id: "f6", category: "Payments", question: "Which payment methods are accepted?", answer: "This prototype only simulates payments. The production platform is expected to support UPI, cards and net banking." },
  { id: "f7", category: "Payments", question: "How do promo codes work?", answer: "Enter a code at checkout. Try CDLFIRST20 or LIVE15 in the demo to see the discount applied." },
  { id: "f8", category: "Payments", question: "What is the refund policy?", answer: "Illustrative policy: full refund within 7 days if you've completed less than 20% of a course." },
  { id: "f9", category: "Live sessions", question: "What time are live sessions held?", answer: "Most cohort classes run on weekday evenings between 6:30 PM and 9:00 PM IST, with some weekend sessions. Each programme lists its own schedule." },
  { id: "f10", category: "Live sessions", question: "What if I miss a live class?", answer: "Recordings are added to your Live Sessions → Recordings tab within 24 hours." },
  { id: "f11", category: "Mentoring", question: "How do I choose a mentor?", answer: "Browse mentor profiles by expertise, or let your career discovery snapshot suggest one. Each mentor lists session formats, durations and prices." },
  { id: "f12", category: "Mentoring", question: "Can I reschedule a mentoring session?", answer: "Yes, up to 12 hours before the session from My Mentoring (simulated in this demo)." },
  { id: "f13", category: "Certificates", question: "When do I get my certificate?", answer: "As soon as you complete all lessons and required quizzes in a course. Certificates in this demo are illustrative and not verifiable credentials." },
  { id: "f14", category: "Colleges", question: "My college has partnered with CDL. How do I access my courses?", answer: "Log in with your college email. Your institution's assigned programmes and its own content will appear on your college-branded dashboard." },
  { id: "f15", category: "Colleges", question: "Can colleges add their own content?", answer: "Yes. Colleges can offer institution-specific programmes — like alumni talks or placement briefings — alongside CDL courses." },
];

export const notifications: AppNotification[] = [
  { id: "n-01", kind: "session", title: "GD Mastery Class 4 is tonight", body: "Class 4: Mock GD round 1 starts at 7:00 PM IST with Vikram Rao.", createdAt: "2026-10-15T09:00:00", read: false, href: "/dashboard/sessions" },
  { id: "n-02", kind: "mentoring", title: "Mock interview confirmed", body: "Your session with Arjun Malhotra is on Mon, 19 Oct at 7:00 PM.", createdAt: "2026-10-14T18:30:00", read: false, href: "/dashboard/mentoring" },
  { id: "n-03", kind: "assignment", title: "Assignment due in 3 days", body: "Record a 2-minute GD opening — due Sun, 18 Oct.", createdAt: "2026-10-15T08:00:00", read: false, href: "/dashboard/assignments" },
  { id: "n-04", kind: "recommendation", title: "Recommended for you: Public Speaking & Confidence", body: "Based on your latest Career Compass result, this course can help with composure under pressure.", createdAt: "2026-10-13T12:00:00", read: true, href: "/courses/public-speaking-confidence" },
  { id: "n-05", kind: "session", title: "Doubt-clearing hour booked", body: "GD doubt-clearing hour · Sat, 17 Oct · 6:00 PM.", createdAt: "2026-10-12T09:15:00", read: true, href: "/dashboard/sessions" },
  { id: "n-06", kind: "announcement", title: "New: Placement Ready Bundle", body: "GD Mastery + Interview Prep + Resume Building, now bundled for placement season.", createdAt: "2026-10-10T10:00:00", read: true, href: "/programs" },
  { id: "n-07", kind: "profile", title: "Has anything changed?", body: "It's been 6 months since you updated your education details. Keep your profile current for better recommendations.", createdAt: "2026-10-09T09:00:00", read: false, href: "/dashboard/profile" },
  { id: "n-08", kind: "enrollment", title: "Enrolment confirmed", body: "You're enrolled in Interview Preparation · Self-Paced.", createdAt: "2026-10-01T20:15:00", read: true, href: "/dashboard/learning" },
  { id: "n-09", kind: "assignment", title: "Feedback received", body: "Vikram replied to your doubt about question openers.", createdAt: "2026-10-10T09:06:00", read: true, href: "/dashboard/discussions" },
  { id: "n-10", kind: "enrollment", title: "Welcome to the October GD cohort", body: "Your cohort starts on 6 Oct. Classes are Tue & Thu at 7:00 PM IST.", createdAt: "2026-09-28T19:05:00", read: true, href: "/dashboard/sessions" },
];
