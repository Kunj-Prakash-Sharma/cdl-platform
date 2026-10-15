import { format, parseISO, subDays } from "date-fns";
import type { ContentItem } from "@/lib/types";
import { courses } from "./courses";

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Every published video lesson is one entry in the centralised content library. */
const publishedFromLessons: ContentItem[] = courses.flatMap((course) =>
  course.chapters.flatMap((chapter) =>
    chapter.lessons
      .filter((l) => l.kind === "video")
      .map((lesson): ContentItem => {
        const h = hash(lesson.id);
        const resolution = h % 5 === 0 ? "720p" : h % 11 === 0 ? "1440p" : "1080p";
        const mbPerMin = resolution === "720p" ? 28 : resolution === "1440p" ? 72 : 46;
        return {
          id: `ci-${lesson.id}`,
          courseId: course.id,
          chapterId: chapter.id,
          title: lesson.title,
          description: lesson.summary ?? `Recorded lesson from ${course.title} — ${chapter.title}.`,
          durationSec: lesson.durationSec,
          resolution,
          sizeMb: Math.round((lesson.durationSec / 60) * mbPerMin),
          mentorId: course.instructorId,
          uploadedOn: format(subDays(parseISO(course.lastUpdated), 10 + (h % 40)), "yyyy-MM-dd"),
          status: "published",
          views: course.collegeId ? 120 + (h % 300) : 600 + (h % 5400),
        };
      }),
  ),
);

const pendingUploads: ContentItem[] = [
  { id: "ci-new-1", courseId: "communication-skills", chapterId: "cms-c3", title: "Communicating on video calls", description: "Camera framing, turn-taking and concise updates for online meetings.", durationSec: 9 * 60 + 12, resolution: "1080p", sizeMb: 421, mentorId: "m-kavya", uploadedOn: "2026-10-13", status: "in-review", views: 0, resourceIds: ["res-13"] },
  { id: "ci-new-2", courseId: "public-speaking-confidence", chapterId: "psc-c3", title: "Handling Q&A after your talk", description: "Bridging, buying time and answering questions you didn't expect.", durationSec: 11 * 60 + 40, resolution: "1080p", sizeMb: 538, mentorId: "m-kavya", uploadedOn: "2026-10-14", status: "draft", views: 0 },
  { id: "ci-new-3", courseId: "group-discussion-mastery", chapterId: "gdm-c3", title: "Mock GD walkthrough with commentary", description: "A full recorded mock GD with evaluator commentary at each turn.", durationSec: 22 * 60 + 5, resolution: "1080p", sizeMb: 1012, mentorId: "m-vikram", uploadedOn: "2026-10-12", status: "in-review", views: 0, resourceIds: ["res-01"] },
  { id: "ci-new-4", courseId: "interview-preparation", chapterId: "inp-c3", title: "Following up after an interview", description: "Thank-you notes, follow-up timing and handling silence.", durationSec: 7 * 60 + 30, resolution: "720p", sizeMb: 212, mentorId: "m-arjun", uploadedOn: "2026-10-09", status: "changes-requested", views: 0, reviewNote: "Audio level drops after 4:30 — please re-export with normalised audio." },
  { id: "ci-new-5", courseId: "leadership-essentials", chapterId: "lde-c3", title: "Handling conflict in teams", description: "A practical model for de-escalating and resolving team conflict.", durationSec: 14 * 60 + 20, resolution: "1080p", sizeMb: 660, mentorId: "m-rohan", uploadedOn: "2026-10-11", status: "in-review", views: 0, resourceIds: ["res-15"] },
  { id: "ci-new-6", courseId: "ait-industry-readiness", chapterId: "air-c2", title: "Case study: supply chain digitisation", description: "AIT alumni case on digitising a mid-size manufacturer's supply chain.", durationSec: 15 * 60, resolution: "1080p", sizeMb: 690, mentorId: "m-sameer", uploadedOn: "2026-10-14", status: "draft", views: 0 },
];

export const contentItems: ContentItem[] = [...pendingUploads, ...publishedFromLessons];
