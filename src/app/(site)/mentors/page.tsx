import type { Metadata } from "next";
import { MentorDirectory } from "@/components/site/mentors/mentor-directory";

export const metadata: Metadata = {
  title: "Mentors",
  description: "Book one-to-one sessions with CDL's career, communication, interview and leadership mentors.",
};

export default function MentorsPage() {
  return <MentorDirectory />;
}
