import type { AvatarSpec } from "@/lib/types";
import { cn } from "@/lib/utils";

const SKIN = ["#F7DCC6", "#EEC3A1", "#D9A47F", "#B98060", "#8F5C3E", "#6B4229"];
const HAIR = ["#1E1A18", "#3D2B21", "#6E4B30", "#8B8580", "#A2552E"];
const BG = ["#E0E7FF", "#CCFBF1", "#FEF3C7", "#DBEAFE", "#FCE7F3", "#EDE9FE", "#DCFCE7", "#FFEDD5"];
const SHIRT = ["#312E81", "#0F766E", "#1E40AF", "#9F1239", "#6D28D9", "#0E7490", "#B45309", "#334155"];
const HIJAB = ["#0F766E", "#6D28D9", "#9F1239", "#1E40AF", "#B45309", "#334155", "#0E7490", "#312E81"];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Derive a stable avatar from a name when no spec is stored (e.g. anonymous or newly created records). */
export function avatarFromName(name: string): AvatarSpec {
  const h = hash(name);
  const hairs: AvatarSpec["hair"][] = ["short", "long", "bun", "curly", "wavy", "short"];
  return { skin: h % 5, hair: hairs[h % hairs.length], hairColor: h % 3, bg: h % BG.length, shirt: (h >> 3) % SHIRT.length };
}

/**
 * Illustrated portrait used for mentors, learners and students. Pure SVG — no external images.
 * Size via className (defaults to size-10).
 */
export function Portrait({
  avatar,
  name,
  className,
  rounded = "full",
}: {
  avatar?: AvatarSpec;
  name: string;
  className?: string;
  rounded?: "full" | "xl";
}) {
  const a = avatar ?? avatarFromName(name);
  const skin = SKIN[a.skin % SKIN.length];
  const hair = HAIR[a.hairColor % HAIR.length];
  const bg = BG[a.bg % BG.length];
  const shirt = SHIRT[a.shirt % SHIRT.length];
  const uid = `p${hash(name + a.hair + a.bg)}`;

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={name}
      className={cn("size-10 shrink-0 overflow-hidden", rounded === "full" ? "rounded-full" : "rounded-xl", className)}
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={bg} />
          <stop offset="100%" stopColor={bg} stopOpacity="0.75" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" fill={`url(#${uid}-bg)`} />

      {/* Hair behind the head */}
      {a.hair === "long" && <path d="M18.5 30C17.5 15 25 10.5 32 10.5S46.5 15 45.5 30L47 50C42 53 22 53 17 50Z" fill={hair} />}
      {a.hair === "wavy" && (
        <path d="M19 29C18 15 25.5 10.5 32 10.5S46 15 45 29C46.5 34 44.5 38 46 43C43 46 41 44 39 46H25C23 44 21 46 18 43C19.5 38 17.5 34 19 29Z" fill={hair} />
      )}
      {a.hair === "hijab" && (
        <path d="M16.5 31C16.5 15.5 24.5 9.5 32 9.5S47.5 15.5 47.5 31C47.5 41 44 47 39.5 50.5H24.5C20 47 16.5 41 16.5 31Z" fill={HIJAB[a.shirt % HIJAB.length]} />
      )}

      {/* Shoulders */}
      <path d="M7 64C7 50.5 18 43.5 32 43.5S57 50.5 57 64Z" fill={shirt} />
      <path d="M26 44.2 32 50.5 38 44.2" fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="1.4" />
      {/* Neck */}
      <rect x="27" y="34" width="10" height="11" rx="4" fill={skin} />
      <rect x="27" y="38" width="10" height="3" fill="black" opacity="0.06" />
      {/* Head */}
      <ellipse cx="32" cy="27" rx={a.hair === "hijab" ? 9.6 : 10.8} ry={a.hair === "hijab" ? 11.4 : 12.4} fill={skin} />
      {/* Ears */}
      {a.hair !== "hijab" && a.hair !== "long" && a.hair !== "wavy" && (
        <>
          <ellipse cx="21.3" cy="28" rx="1.8" ry="2.6" fill={skin} />
          <ellipse cx="42.7" cy="28" rx="1.8" ry="2.6" fill={skin} />
        </>
      )}

      {/* Hair on top */}
      {a.hair === "short" && <path d="M20.6 26.5C19.6 16.5 25.5 12.3 32.2 12.3S44.6 16.6 43.4 26.5C42 21 38.2 18.8 32 19.2 25.8 19.4 22.4 21.6 20.6 26.5Z" fill={hair} />}
      {a.hair === "bald" && <path d="M21 25C21.5 22 22.5 21 23.5 20.5M43 25C42.5 22 41.5 21 40.5 20.5" stroke={HAIR[3]} strokeWidth="2.2" strokeLinecap="round" fill="none" />}
      {(a.hair === "long" || a.hair === "wavy") && <path d="M21 25.5C21 17 26 13.2 32 13.2S43 17 43 25.5C40 20.5 36 19 32.5 18.6 29 21 24.5 22.5 21 25.5Z" fill={hair} />}
      {a.hair === "bun" && (
        <>
          <circle cx="32" cy="11.4" r="5" fill={hair} />
          <path d="M21 26C20.5 17.5 25.8 13.5 32 13.5S43.5 17.5 43 26C41 21.5 37.5 19.6 32 19.6S23 21.5 21 26Z" fill={hair} />
        </>
      )}
      {a.hair === "curly" && (
        <g fill={hair}>
          <circle cx="23" cy="20" r="4.2" />
          <circle cx="28" cy="15.8" r="4.4" />
          <circle cx="34" cy="14.8" r="4.4" />
          <circle cx="39.6" cy="17.6" r="4.2" />
          <circle cx="42.4" cy="22.6" r="3.4" />
          <circle cx="21.4" cy="24.6" r="3" />
          <circle cx="31" cy="19.4" r="3.6" />
        </g>
      )}

      {/* Beard */}
      {a.beard && <path d="M21.6 28.5C22 37.5 27 40.6 32 40.6S42 37.5 42.4 28.5C40.6 34.2 36.8 36.4 32 36.4S23.4 34.2 21.6 28.5Z" fill={hair} opacity="0.92" />}

      {/* Face */}
      <circle cx="27.8" cy="27.4" r="1.25" fill="#2A211C" />
      <circle cx="36.2" cy="27.4" r="1.25" fill="#2A211C" />
      <path d="M26.2 24.3Q27.8 23.3 29.4 24.1M34.6 24.1Q36.2 23.3 37.8 24.3" stroke="#2A211C" strokeOpacity="0.55" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d="M28.8 32.4Q32 35 35.2 32.4" stroke="#7A3B2E" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <ellipse cx="25.6" cy="31" rx="1.9" ry="1.1" fill="#F43F5E" opacity="0.12" />
      <ellipse cx="38.4" cy="31" rx="1.9" ry="1.1" fill="#F43F5E" opacity="0.12" />

      {a.glasses && (
        <g fill="none" stroke="#1F2937" strokeWidth="1.1">
          <rect x="23.6" y="24.4" width="8" height="6" rx="2.4" />
          <rect x="32.4" y="24.4" width="8" height="6" rx="2.4" />
          <path d="M31.6 27H32.4" />
        </g>
      )}
    </svg>
  );
}
