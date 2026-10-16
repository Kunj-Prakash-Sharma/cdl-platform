import type { Metadata } from "next";
import { getMentor } from "@/data";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const mentor = getMentor(id);
  return mentor ? { title: `${mentor.name} · Mentor`, description: mentor.headline } : { title: "Mentor not found" };
}

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
