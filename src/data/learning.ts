import type { Assignment, Certificate, Enrollment, Resource } from "@/lib/types";

export const enrollments: Enrollment[] = [
  // Demo learner — Riya
  { id: "en-2001", userId: "u-riya", courseId: "career-discovery-fundamentals", format: "self-paced", enrolledOn: "2026-03-04", source: "free" },
  { id: "en-2002", userId: "u-riya", courseId: "resume-building", format: "self-paced", enrolledOn: "2026-04-12", orderId: "ORD-26-0412", source: "purchase" },
  { id: "en-2003", userId: "u-riya", courseId: "group-discussion-mastery", format: "live-cohort", cohortId: "coh-gdm-oct", enrolledOn: "2026-09-28", orderId: "ORD-26-0928", source: "purchase" },
  { id: "en-2004", userId: "u-riya", courseId: "interview-preparation", format: "self-paced", enrolledOn: "2026-10-01", orderId: "ORD-26-1001", source: "purchase" },
  // Parent — Sunita (and her son's learning)
  { id: "en-2010", userId: "u-sunita", courseId: "career-clarity-for-parents", format: "live-cohort", cohortId: "coh-ccp-oct", enrolledOn: "2026-06-18", orderId: "ORD-26-0618", source: "purchase" },
  { id: "en-2011", userId: "u-arjun-i", courseId: "career-discovery-fundamentals", format: "self-paced", enrolledOn: "2026-06-18", source: "free" },
  { id: "en-2012", userId: "u-arjun-i", courseId: "personality-development", format: "self-paced", enrolledOn: "2026-07-02", orderId: "ORD-26-0702", source: "purchase" },
  // Other learners
  { id: "en-2020", userId: "u-karan", courseId: "interview-preparation", format: "live-cohort", cohortId: "coh-inp-nov", enrolledOn: "2026-10-07", orderId: "ORD-26-1007", source: "purchase" },
  { id: "en-2021", userId: "u-karan", courseId: "resume-building", format: "self-paced", enrolledOn: "2026-05-22", orderId: "ORD-26-0522", source: "purchase" },
  { id: "en-2022", userId: "u-ananya", courseId: "leadership-essentials", format: "live-cohort", cohortId: "coh-lde-oct", enrolledOn: "2026-09-18", orderId: "ORD-26-0918", source: "purchase" },
  { id: "en-2023", userId: "u-ananya", courseId: "communication-skills", format: "self-paced", enrolledOn: "2026-02-10", orderId: "ORD-26-0210", source: "purchase" },
  { id: "en-2024", userId: "u-dev", courseId: "career-discovery-fundamentals", format: "self-paced", enrolledOn: "2026-08-03", source: "free" },
  { id: "en-2025", userId: "u-fatima", courseId: "public-speaking-confidence", format: "live-cohort", cohortId: "coh-psc-oct", enrolledOn: "2026-10-05", orderId: "ORD-26-1005", source: "purchase" },
  { id: "en-2026", userId: "u-fatima", courseId: "group-discussion-mastery", format: "live-cohort", cohortId: "coh-gdm-oct", enrolledOn: "2026-09-30", orderId: "ORD-26-0930", source: "purchase" },
  { id: "en-2027", userId: "u-rohit", courseId: "interview-preparation", format: "self-paced", enrolledOn: "2026-09-02", orderId: "ORD-26-0902", source: "purchase" },
  { id: "en-2028", userId: "u-meghna", courseId: "career-transition-blueprint", format: "self-paced", enrolledOn: "2026-04-27", orderId: "ORD-26-0427", source: "purchase" },
  { id: "en-2029", userId: "u-meghna", courseId: "professional-readiness", format: "live-cohort", cohortId: "coh-prr-oct", enrolledOn: "2026-10-03", orderId: "ORD-26-1003", source: "purchase" },
  { id: "en-2030", userId: "u-tanvi", courseId: "career-discovery-fundamentals", format: "self-paced", enrolledOn: "2026-09-12", source: "free" },
  { id: "en-2031", userId: "u-tanvi", courseId: "communication-skills", format: "live-cohort", cohortId: "coh-cms-oct", enrolledOn: "2026-09-29", orderId: "ORD-26-0929", source: "purchase" },
  { id: "en-2032", userId: "u-nisha", courseId: "leadership-essentials", format: "self-paced", enrolledOn: "2026-01-15", orderId: "ORD-26-0115", source: "purchase" },
  { id: "en-2033", userId: "u-aditya", courseId: "group-discussion-mastery", format: "live-cohort", cohortId: "coh-gdm-oct", enrolledOn: "2026-10-02", orderId: "ORD-26-1002", source: "purchase" },
  { id: "en-2034", userId: "u-aditya", courseId: "campus-placement-readiness", format: "live-cohort", cohortId: "coh-cpr-sep", enrolledOn: "2026-08-28", orderId: "ORD-26-0828", source: "purchase" },
  { id: "en-2035", userId: "u-rajesh", courseId: "career-clarity-for-parents", format: "self-paced", enrolledOn: "2026-08-19", orderId: "ORD-26-0819", source: "purchase" },
];

/** Seed lesson completion for the demo learner (courseId → completed lesson ids). */
export const seedLessonProgress: Record<string, string[]> = {
  "career-discovery-fundamentals": ["cdf-1", "cdf-2", "cdf-3", "cdf-4", "cdf-5", "cdf-6", "cdf-7"],
  "resume-building": ["rsb-1", "rsb-2", "rsb-3", "rsb-4", "rsb-5", "rsb-6"],
  "group-discussion-mastery": ["gdm-1", "gdm-2", "gdm-3"],
  "interview-preparation": ["inp-1", "inp-2"],
};

export const resources: Resource[] = [
  { id: "res-01", title: "GD evaluation checklist", fileType: "PDF", courseId: "group-discussion-mastery", chapterId: "gdm-c1", mentorId: "m-vikram", sizeKb: 412, description: "The exact criteria evaluators use, with examples of strong and weak contributions.", previewLines: ["1. Initiation — did you open with a clear stance?", "2. Content — facts, examples, relevance", "3. Listening — building on others' points", "4. Communication — clarity, pace, tone", "5. Summary — balanced and concise"], updatedOn: "2026-09-18" },
  { id: "res-02", title: "Topic bank: 40 recent GD topics", fileType: "PDF", courseId: "group-discussion-mastery", chapterId: "gdm-c3", mentorId: "m-vikram", sizeKb: 860, description: "Abstract, current-affairs and case topics from recent placement seasons with research pointers.", previewLines: ["Abstract: 'Zero is bigger than one'", "Current: 'Should gig workers get full benefits?'", "Business: 'Quick commerce — boon or bubble?'", "Social: 'Is remote work here to stay?'"], updatedOn: "2026-10-02" },
  { id: "res-03", title: "GD opening frameworks cheat-sheet", fileType: "PDF", courseId: "group-discussion-mastery", chapterId: "gdm-c2", mentorId: "m-vikram", sizeKb: 228, description: "Six ways to open a discussion — definition, question, quote, statistic, story and stance.", previewLines: ["Definition opener", "Question opener", "Statistic opener", "Story opener", "Stance opener"], updatedOn: "2026-09-25" },
  { id: "res-04", title: "100 common interview questions", fileType: "PDF", courseId: "interview-preparation", chapterId: "inp-c2", mentorId: "m-arjun", sizeKb: 1240, description: "Grouped by HR, behavioural, role-fit and stress questions with answer hints.", previewLines: ["Tell me about yourself.", "Why should we hire you?", "Describe a time you handled conflict.", "Where do you see yourself in three years?"], updatedOn: "2026-09-30" },
  { id: "res-05", title: "STAR answer builder", fileType: "DOCX", courseId: "interview-preparation", chapterId: "inp-c2", mentorId: "m-arjun", sizeKb: 96, description: "Fill-in template to turn experiences into Situation–Task–Action–Result stories.", previewLines: ["Situation: Set the scene in one or two lines", "Task: What were you responsible for?", "Action: What did YOU do? (3 steps)", "Result: Quantify the outcome"], updatedOn: "2026-09-12" },
  { id: "res-06", title: "Company research worksheet", fileType: "XLSX", courseId: "interview-preparation", chapterId: "inp-c1", mentorId: "m-arjun", sizeKb: 54, description: "A one-page research tracker for roles, products, culture and recent news.", previewLines: ["Company | Role | Products | Recent news | Culture notes | Questions to ask"], updatedOn: "2026-08-22" },
  { id: "res-07", title: "Resume templates pack", fileType: "ZIP", courseId: "resume-building", chapterId: "rsb-c3", mentorId: "m-farah", sizeKb: 2310, description: "Four ATS-friendly templates for freshers, interns and experienced professionals.", previewLines: ["fresher-classic.docx", "fresher-modern.docx", "experienced-1page.docx", "experienced-2page.docx"], updatedOn: "2026-08-28" },
  { id: "res-08", title: "Action verbs list", fileType: "PDF", courseId: "resume-building", chapterId: "rsb-c2", mentorId: "m-farah", sizeKb: 140, description: "200 strong action verbs grouped by skill area.", previewLines: ["Leadership: led, mentored, coordinated", "Analysis: evaluated, forecast, modelled", "Communication: presented, negotiated, authored"], updatedOn: "2026-07-14" },
  { id: "res-09", title: "Career cluster map", fileType: "PDF", courseId: "career-discovery-fundamentals", chapterId: "cdf-c2", mentorId: "m-meera", sizeKb: 1890, description: "Twelve career clusters with example roles, entry pathways and key skills.", previewLines: ["Business & Management", "Science & Research", "Design & Creative Arts", "Health & Wellbeing", "Technology & Data"], updatedOn: "2026-09-02" },
  { id: "res-10", title: "Self-reflection worksheet", fileType: "DOCX", courseId: "career-discovery-fundamentals", chapterId: "cdf-c1", mentorId: "m-meera", sizeKb: 88, description: "Guided prompts on interests, energy, values and proud moments.", previewLines: ["When do you lose track of time?", "Which subjects feel effortless?", "What would you do if money didn't matter?"], updatedOn: "2026-06-30" },
  { id: "res-11", title: "12-month career plan template", fileType: "XLSX", courseId: "career-discovery-fundamentals", chapterId: "cdf-c3", mentorId: "m-meera", sizeKb: 64, description: "Quarter-by-quarter plan with goals, actions and checkpoints.", previewLines: ["Q1: Explore — 3 informational interviews", "Q2: Learn — 1 course + 1 project", "Q3: Apply — internships / roles", "Q4: Review — reflect and reset"], updatedOn: "2026-09-02" },
  { id: "res-12", title: "PREP framework cheat-sheet", fileType: "PDF", courseId: "communication-skills", chapterId: "cms-c2", mentorId: "m-kavya", sizeKb: 188, description: "Point–Reason–Example–Point with practice prompts.", previewLines: ["Point: state your view", "Reason: why you believe it", "Example: make it concrete", "Point: restate with impact"], updatedOn: "2026-09-15" },
  { id: "res-13", title: "Email templates pack", fileType: "DOCX", courseId: "communication-skills", chapterId: "cms-c3", mentorId: "m-kavya", sizeKb: 120, description: "Templates for follow-ups, requests, updates and apologies.", previewLines: ["Follow-up after an interview", "Requesting a deadline extension", "Weekly status update"], updatedOn: "2026-08-30" },
  { id: "res-14", title: "Talk planning canvas", fileType: "PPTX", courseId: "public-speaking-confidence", chapterId: "psc-c2", mentorId: "m-kavya", sizeKb: 2140, description: "One-slide canvas to plan hook, message, stories and close.", previewLines: ["Hook", "Core message", "Three supporting stories", "Call to action"], updatedOn: "2026-09-10" },
  { id: "res-15", title: "Leadership reflection journal", fileType: "PDF", courseId: "leadership-essentials", chapterId: "lde-c1", mentorId: "m-rohan", sizeKb: 640, description: "Weekly prompts to reflect on ownership, feedback and influence.", previewLines: ["What did I own fully this week?", "What feedback did I avoid giving?"], updatedOn: "2026-08-20" },
  { id: "res-16", title: "First 90 days planner", fileType: "XLSX", courseId: "professional-readiness", chapterId: "prr-c1", mentorId: "m-sameer", sizeKb: 72, description: "Plan relationships, learning goals and early wins for a new job.", previewLines: ["Days 1–30: Learn", "Days 31–60: Contribute", "Days 61–90: Lead small wins"], updatedOn: "2026-08-05" },
  { id: "res-17", title: "Placement preparation planner", fileType: "XLSX", courseId: "campus-placement-readiness", chapterId: "cpr-c1", mentorId: "m-arjun", sizeKb: 81, description: "Week-by-week plan from aptitude practice to final interviews.", previewLines: ["Week 1–2: Aptitude basics", "Week 3–4: GD practice", "Week 5–6: Interviews"], updatedOn: "2026-09-22" },
  { id: "res-18", title: "Stream & subject guide", fileType: "PDF", courseId: "career-clarity-for-parents", chapterId: "ccp-c2", mentorId: "m-meera", sizeKb: 1320, description: "Science, Commerce and Humanities pathways with entrance exam overview.", previewLines: ["Science (PCM / PCB)", "Commerce (with / without Maths)", "Humanities & Liberal Arts"], updatedOn: "2026-07-29" },
];

export const assignments: Assignment[] = [
  {
    id: "as-gdm-quiz",
    courseId: "group-discussion-mastery",
    title: "GD readiness quiz",
    kind: "quiz",
    description: "Five quick questions on how GDs are evaluated and how to contribute well.",
    dueDate: "2026-10-20",
    points: 10,
    estimatedMin: 8,
    status: "not-started",
    questions: [
      { id: "q1", prompt: "What do evaluators value most when you open a GD?", options: ["Speaking first at any cost", "A clear, relevant stance or framing", "Quoting as many statistics as possible", "Speaking loudly"], correctIndex: 1, explanation: "A clear framing helps the group — being first without substance doesn't." },
      { id: "q2", prompt: "Another participant makes a point you agree with. The best response is to…", options: ["Repeat it in your own words", "Stay silent", "Build on it with a new example or angle", "Ask them to elaborate"], correctIndex: 2, explanation: "Building on points shows listening and adds value." },
      { id: "q3", prompt: "Which is the most effective summary?", options: ["Your own view only", "A balanced recap of key viewpoints and a conclusion", "A list of every point made", "A new argument"], correctIndex: 1 },
      { id: "q4", prompt: "In an abstract topic like 'Red', a good approach is to…", options: ["Ask the moderator to change it", "Interpret it through 2–3 lenses (e.g. danger, passion, politics)", "Talk only about colours", "Wait for others to define it"], correctIndex: 1 },
      { id: "q5", prompt: "If the discussion becomes chaotic, you should…", options: ["Raise your voice", "Leave it to the moderator", "Calmly suggest a structure for the group", "Stop participating"], correctIndex: 2, explanation: "Bringing structure is a strong leadership signal." },
    ],
  },
  { id: "as-gdm-open", courseId: "group-discussion-mastery", title: "Record a 2-minute GD opening", kind: "assignment", description: "Pick any topic from the topic bank and record a 2-minute opening using one of the six frameworks. Upload a link or a short note describing your approach.", dueDate: "2026-10-18", points: 20, estimatedMin: 30, status: "in-progress" },
  { id: "as-inp-star", courseId: "interview-preparation", title: "Write three STAR stories", kind: "assignment", description: "Use the STAR answer builder to write three stories: teamwork, a challenge you overcame, and leadership. 150–200 words each.", dueDate: "2026-10-25", points: 30, estimatedMin: 45, status: "not-started" },
  {
    id: "as-inp-quiz",
    courseId: "interview-preparation",
    title: "Interview readiness quiz",
    kind: "quiz",
    description: "Check your understanding of interview preparation fundamentals.",
    dueDate: "2026-10-30",
    points: 10,
    estimatedMin: 10,
    status: "not-started",
    questions: [
      { id: "q1", prompt: "The 'R' in the STAR method stands for…", options: ["Reason", "Result", "Reflection", "Role"], correctIndex: 1 },
      { id: "q2", prompt: "A strong 'Tell me about yourself' answer should mostly focus on…", options: ["Your family background", "Your hobbies", "Relevant journey, strengths and why this role", "Your marks in school"], correctIndex: 2 },
      { id: "q3", prompt: "When asked about a weakness, the best approach is to…", options: ["Say you have none", "Share a real area and how you're improving it", "Mention a strength disguised as weakness", "Avoid the question"], correctIndex: 1 },
      { id: "q4", prompt: "In virtual interviews, where should you look while speaking?", options: ["At your own video", "At the camera", "At your notes", "Away from the screen"], correctIndex: 1 },
      { id: "q5", prompt: "When should you discuss salary expectations?", options: ["In your opening answer", "When the interviewer raises it or at offer stage", "Never", "In the cover email"], correctIndex: 1 },
    ],
  },
  { id: "as-rsb-quiz", courseId: "resume-building", title: "Resume fundamentals quiz", kind: "quiz", description: "Ten questions on formats, bullet points and screening.", dueDate: "2026-04-30", points: 10, estimatedMin: 10, status: "graded", score: 9, feedback: "Excellent understanding of achievement-based bullets. Revisit the lesson on choosing formats for internships." },
  { id: "as-rsb-final", courseId: "resume-building", title: "Submit your revised resume", kind: "assignment", description: "Upload your revised resume after applying the course checklist.", dueDate: "2026-05-02", points: 20, estimatedMin: 60, status: "graded", score: 18, feedback: "Strong summary and quantified bullets. Consider moving 'Projects' above 'Extra-curriculars' for marketing roles. — Farah" },
  { id: "as-cdf-quiz", courseId: "career-discovery-fundamentals", title: "Career discovery checkpoint", kind: "quiz", description: "A short reflection quiz on interests, values and career clusters.", dueDate: "2026-03-20", points: 10, estimatedMin: 8, status: "graded", score: 8, feedback: "Good reflection on interests. Try mapping two more clusters before finalising your plan." },
  { id: "as-cms-email", courseId: "communication-skills", title: "Rewrite a weak email", kind: "assignment", description: "Rewrite the sample email using the 5-part structure from Lesson 5.", dueDate: "2026-10-27", points: 15, estimatedMin: 20, status: "not-started" },
];

export const certificates: Certificate[] = [
  { id: "CDL-2026-03-0142", userId: "u-riya", courseId: "career-discovery-fundamentals", issuedOn: "2026-03-21", hours: 1 },
  { id: "CDL-2026-05-0388", userId: "u-riya", courseId: "resume-building", issuedOn: "2026-05-02", hours: 1 },
  { id: "CDL-2026-03-0101", userId: "u-ananya", courseId: "communication-skills", issuedOn: "2026-03-28", hours: 1 },
  { id: "CDL-2026-07-0512", userId: "u-karan", courseId: "resume-building", issuedOn: "2026-06-08", hours: 1 },
  { id: "CDL-2026-07-0544", userId: "u-arjun-i", courseId: "career-discovery-fundamentals", issuedOn: "2026-07-10", hours: 1 },
  { id: "CDL-2026-08-0611", userId: "u-dev", courseId: "career-discovery-fundamentals", issuedOn: "2026-08-21", hours: 1 },
  { id: "CDL-2026-06-0470", userId: "u-meghna", courseId: "career-transition-blueprint", issuedOn: "2026-06-14", hours: 1 },
  { id: "CDL-2026-04-0233", userId: "u-nisha", courseId: "leadership-essentials", issuedOn: "2026-04-19", hours: 1 },
  { id: "CDL-2026-09-0702", userId: "u-rajesh", courseId: "career-clarity-for-parents", issuedOn: "2026-09-07", hours: 1 },
  { id: "CDL-2026-10-0759", userId: "u-tanvi", courseId: "career-discovery-fundamentals", issuedOn: "2026-10-03", hours: 1 },
];
