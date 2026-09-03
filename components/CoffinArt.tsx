import type { ArtPattern } from "@/lib/types";

/**
 * Векторна ілюстрація труни — показується, поки в адмінці не завантажене фото.
 * П'ять стилів відповідають п'яти моделям каталогу.
 */

const OUTER = "170,44 230,44 276,150 252,458 148,458 124,150";
const INNER = "174,54 226,54 267,152 244,448 156,448 133,152";

const THEME: Record<
  ArtPattern,
  { bg: string; body: string; stroke: string; detail: string; hardware: string }
> = {
  classic: {
    bg: "#f2f0ed",
    body: "#c9b18b",
    stroke: "#8d7550",
    detail: "#a98f66",
    hardware: "#b2954f",
  },
  minimal: {
    bg: "#f2f0ed",
    body: "#fdfdfc",
    stroke: "#c9c6c1",
    detail: "#e3e1de",
    hardware: "#b9b6b1",
  },
  noir: {
    bg: "#e8e6e3",
    body: "#151514",
    stroke: "#000000",
    detail: "#2c2c2a",
    hardware: "#b2954f",
  },
  goldline: {
    bg: "#f2f0ed",
    body: "#fbfaf8",
    stroke: "#d8d4ce",
    detail: "#b2954f",
    hardware: "#b2954f",
  },
  eco: {
    bg: "#efece6",
    body: "#e0cfae",
    stroke: "#b39c74",
    detail: "#c9b48c",
    hardware: "#9c8560",
  },
};

export default function CoffinArt({
  art,
  label,
}: {
  art: ArtPattern;
  label?: string;
}) {
  const c = THEME[art] ?? THEME.minimal;

  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={label || "Ілюстрація моделі"}
    >
      <rect width="400" height="500" fill={c.bg} />

      {/* м'яка тінь під корпусом */}
      <polygon points={OUTER} fill="#000" opacity="0.05" transform="translate(6 8)" />

      {/* корпус */}
      <polygon points={OUTER} fill={c.body} stroke={c.stroke} strokeWidth="1.5" />
      <polygon points={INNER} fill="none" stroke={c.stroke} strokeWidth="0.8" opacity="0.55" />

      {/* поздовжній розділ кришки */}
      <line x1="200" y1="54" x2="200" y2="448" stroke={c.stroke} strokeWidth="0.7" opacity="0.4" />

      {art === "classic" && (
        <g stroke={c.detail} strokeWidth="0.9" opacity="0.6">
          {[80, 118, 200, 262, 324, 386].map((y) => (
            <line key={y} x1="140" y1={y} x2="260" y2={y} />
          ))}
        </g>
      )}

      {art === "noir" && (
        <>
          <polygon
            points="180,66 220,66 254,152 236,436 164,436 146,152"
            fill="none"
            stroke={c.hardware}
            strokeWidth="1"
            opacity="0.85"
          />
        </>
      )}

      {art === "goldline" && (
        <g stroke={c.hardware} fill="none">
          <polygon points="182,68 218,68 252,152 235,434 165,434 148,152" strokeWidth="0.8" />
          <circle cx="200" cy="215" r="26" strokeWidth="0.8" />
          <path d="M200 200 l7 12 -7 12 -7 -12 z" fill={c.hardware} stroke="none" />
          <line x1="168" y1="300" x2="232" y2="300" strokeWidth="0.7" />
          <line x1="176" y1="318" x2="224" y2="318" strokeWidth="0.7" />
        </g>
      )}

      {art === "eco" && (
        <g stroke={c.stroke} strokeWidth="0.6" opacity="0.5">
          {[70, 90, 110, 130, 150, 170, 190, 210, 230, 250, 270, 290, 310, 330, 350, 370, 390, 410, 430].map(
            (y) => (
              <line key={y} x1="132" y1={y} x2="268" y2={y} />
            )
          )}
        </g>
      )}

      {art === "minimal" && (
        <line x1="150" y1="250" x2="250" y2="250" stroke={c.detail} strokeWidth="1" />
      )}

      {/* фурнітура — по дві ручки з кожного боку */}
      {(art === "classic" || art === "noir" || art === "goldline") && (
        <g fill="none" stroke={c.hardware} strokeWidth="2.2" strokeLinecap="round">
          <path d="M132 210 q-12 12 0 24" />
          <path d="M268 210 q12 12 0 24" />
          <path d="M138 350 q-12 12 0 24" />
          <path d="M262 350 q12 12 0 24" />
        </g>
      )}
    </svg>
  );
}
