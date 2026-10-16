# Career Design Lab: interactive prototype

A clickable, frontend-only prototype of the Career Design Lab (CDL) platform for stakeholder review. It has four connected portals (learner/B2C, college/B2B, mentor and admin) built on one design system and one shared set of mock data.

> **There is no backend.** Login, OTP, payments, bookings, uploads, notifications, analytics and "AI" are all simulated in the browser. Every person, number, result and transaction is fictional.

## Run it

Requires Node.js 20.9 or later.

```bash
npm install
npm run dev        # http://localhost:3000
# or a production build
npm run build && npm start
```

Open **`/demo`** to choose a role, or use the floating **Demo** button that appears on every screen to switch portals or **reset demo data**.

## Suggested demo journeys

| Journey | Start | What to show |
|---|---|---|
| Visitor to enrolment | `/` | Start Free Career Discovery, answer the chat, see the career snapshot and three recommendations, open a program, check out with promo `CDLFIRST20` or `LIVE15` (simulated payment), then see it in the dashboard |
| Learner day-to-day | `/dashboard` | Continue a lesson in the player, book a GD doubt-clearing session, ask a doubt, view certificates and assessment history |
| Assessment | `/assessment` | Take the Career Compass, view the report with change since the last attempt, then print it |
| Mentor | `/mentor` | Today's schedule, block or open slots, upload a lesson to the central content library, answer a student question |
| College | `/college` then `/campus` | AIT-branded dashboard, student progress (permitted data only), college-provided content, the student's portal with restricted access |
| Admin | `/admin/conversations` | Visitor-to-purchase funnel, drop-off by discovery question, anonymous session transcripts, then approve the mentor's upload in `/admin/content` |

Changes made in one portal appear in the others. For example, a mentor's upload lands in the admin review queue, an admin announcement shows in the learner's notifications, a discovery callback request shows in admin, and a purchase shows in admin enrollments. Demo state is saved in the browser's localStorage, so a reload keeps it until you **Reset demo data**.

The demo runs on a fixed date of **Thursday 15 October 2026**, so "today", "upcoming" and "past" are the same on every screen.

## Sitemap

- **Public**: `/`, `/programs` (three learning levels and packages), `/courses`, `/courses/[id]`, `/mentors`, `/mentors/[id]`, `/discover` (free career discovery chat), `/assessment`, `/assessment/[id]`, `/assessment/report/[resultId]`, `/checkout`, `/login` (phone, OTP `123456`, profile), `/ai` (Phase 2 preview), `/demo`
- **Learner "My Self"** (`/dashboard/...`): overview, learning, development, assessments, `learn/[courseId]` (player), library, resources, assignments (`/[id]`), sessions, mentoring, discussions, certificates, notifications, orders, help, profile, ai. When the demo role is **Parent (Sunita)** the dashboard switches to a parent view.
- **College admin** (`/college/...`): dashboard, programs, students, cohorts, content, reports
- **College student** (`/campus/...`): home, courses, `learn/[courseId]`, sessions, assignments, progress
- **Mentor** (`/mentor/...`): dashboard, schedule, bookings, courses (`/[id]`), content, questions, profile
- **Admin** (`/admin/...`): overview, conversations, analytics, users, colleges (+ `new` onboarding wizard), mentors, courses (+ `new`, `[id]`), content, assessments, sessions, pricing, enrollments, community, certificates, notifications

## How it's built

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Radix), lucide-react, Recharts, Zustand, date-fns.

| Path | What lives there |
|---|---|
| `src/lib/types.ts` | Domain model shared by every portal |
| `src/data/` | Centralised mock data with consistent IDs (courses, lessons, mentors, users, colleges, cohorts, sessions, assessments, packages, orders, threads, analytics). `index.ts` exports lookup helpers. |
| `src/store/demo-store.ts` | Zustand store for everything that changes during a demo, persisted to localStorage |
| `src/store/hooks.ts` | Derived hooks: current user, enrollments, course progress, mentor slots |
| `src/lib/recommend.ts` | Transparent rule-based course recommendations (no AI) |
| `src/lib/discovery.ts`, `src/lib/assessment.ts` | Discovery conversation flow and assessment scoring |
| `src/components/shared/` | Portraits (SVG), course artwork, video player, calendar, booking dialog, badges, cards |
| `src/components/layout/` | Portal shell (sidebar and mobile nav), site header and footer, demo switcher |
| `src/components/<area>/` | Components for each portal: `site`, `discovery`, `assessment`, `learner`, `engagement`, `ai`, `mentor`, `college`, `campus`, `admin/*` |

All images (people, course artwork, video frames) are drawn in code, so the prototype works offline.

## What is simulated, and Phase 2

- **Discovery conversation:** predefined dialogue with simple branching rules. No AI model is running.
- **Assessments:** illustrative self-reflection scoring, not validated psychometrics.
- **Video:** playback is simulated, and recordings are labelled at their original quality. Transcoding and adaptive streaming are out of scope.
- **Payments, OTP, certificates, uploads, downloads and calendar invites:** simulated only.
- **My Self AI** (career assistant, explorer, results interpretation, "what next", mock interview, study plan, career plan): shown as **Planned / Coming soon** previews with illustrative examples, kept separate from the working Phase 1.
