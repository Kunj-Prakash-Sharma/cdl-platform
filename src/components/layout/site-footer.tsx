import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { SUPPORT_EMAIL } from "@/data/constants";
import { Logo } from "@/components/brand/logo";

const COLUMNS = [
  {
    title: "Learn",
    links: [
      { href: "/courses", label: "All courses" },
      { href: "/programs", label: "Programs & pricing" },
      { href: "/mentors", label: "One-to-one mentoring" },
      { href: "/assessment", label: "Career assessments" },
    ],
  },
  {
    title: "Discover",
    links: [
      { href: "/discover", label: "Free career discovery" },
      { href: "/#who-we-serve", label: "Who we serve" },
      { href: "/ai", label: "My Self AI (coming soon)" },
      { href: "/#faq", label: "FAQs" },
    ],
  },
  {
    title: "Platform",
    links: [
      { href: "/login", label: "Learner login" },
      { href: "/college", label: "For colleges" },
      { href: "/mentor", label: "For mentors" },
      { href: "/demo", label: "Demo journeys" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="no-print border-t bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)] md:px-6">
        <div className="space-y-4">
          <Logo inverted />
          <p className="max-w-xs text-sm text-white/65">
            Career clarity, employability and leadership — through discovery, assessments, courses and mentoring.
          </p>
          <ul className="space-y-2 text-sm text-white/65">
            <li className="flex items-center gap-2">
              <Mail className="size-4" /> {SUPPORT_EMAIL}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4" /> +91 20 XXXX XXXX (demo)
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4" /> Pune, India
            </li>
          </ul>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="font-heading text-sm font-semibold">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/65 transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-white/50 md:flex-row md:items-center md:justify-between md:px-6">
          <p>© 2026 Career Design Lab · Interactive prototype for stakeholder review.</p>
          <p>All people, numbers, results and transactions shown are fictional demo data.</p>
        </div>
      </div>
    </footer>
  );
}
