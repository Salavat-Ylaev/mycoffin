import type { ArtPattern, PetKind } from "@/lib/types";

/**
 * Векторна ілюстрація — показується, поки в адмінці не завантажене фото.
 *
 * Форма залежить від тварини:
 *  • кіт і пес — класична шестикутна труна;
 *  • рептилія — довгий вузький кофр (тіло видовжене);
 *  • гризун — маленька компактна скринька.
 * Стиль (дерево, біла емаль, чорний, золото, еко) — від моделі.
 */

type Shape = "coffin" | "case" | "box";

const shapeFor = (pet: PetKind): Shape =>
  pet === "reptile" ? "case" : pet === "rodent" ? "box" : "coffin";

interface Theme {
  bg: string;
  body: string;
  stroke: string;
  detail: string;
  hardware: string;
}

const THEME: Record<ArtPattern, Theme> = {
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

/* геометрія кожної форми */
const GEO = {
  coffin: {
    outer: "170,44 230,44 276,150 252,458 148,458 124,150",
    inner: "174,54 226,54 267,152 244,448 156,448 133,152",
    /** прямокутник, у якому малюємо візерунок */
    field: { x: 136, y: 62, w: 128, h: 380 },
    seam: { x1: 200, y1: 54, x2: 200, y2: 448 },
    handles: [
      "M132 210 q-12 12 0 24",
      "M268 210 q12 12 0 24",
      "M138 350 q-12 12 0 24",
      "M262 350 q12 12 0 24",
    ],
  },
  case: {
    outer: { x: 150, y: 34, width: 100, height: 432, rx: 7 },
    inner: { x: 159, y: 43, width: 82, height: 414, rx: 5 },
    field: { x: 163, y: 50, w: 74, h: 400 },
    seam: { x1: 200, y1: 43, x2: 200, y2: 457 },
    /** застібки-стяжки поперек кофра */
    straps: [156, 330],
  },
  box: {
    outer: { x: 104, y: 152, width: 192, height: 196, rx: 6 },
    inner: { x: 113, y: 161, width: 174, height: 178, rx: 4 },
    field: { x: 118, y: 205, w: 164, h: 128 },
    /** горизонтальний шов кришки */
    lid: 200,
    handles: ["M100 238 q-11 12 0 24", "M300 238 q11 12 0 24"],
  },
} as const;

export default function CoffinArt({
  art,
  pet = "cat",
  label,
}: {
  art: ArtPattern;
  pet?: PetKind;
  label?: string;
}) {
  const c = THEME[art] ?? THEME.minimal;
  const shape = shapeFor(pet);

  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={label || "Ілюстрація моделі"}
    >
      <rect width="400" height="500" fill={c.bg} />
      {shape === "coffin" && <Coffin c={c} art={art} />}
      {shape === "case" && <Case c={c} art={art} />}
      {shape === "box" && <Box c={c} art={art} />}
    </svg>
  );
}

/* ─────────────────── візерунок усередині форми ─────────────────── */

function Pattern({
  art,
  c,
  field,
}: {
  art: ArtPattern;
  c: Theme;
  field: { x: number; y: number; w: number; h: number };
}) {
  const { x, y, w, h } = field;

  if (art === "classic") {
    const rows = 6;
    return (
      <g stroke={c.detail} strokeWidth="0.9" opacity="0.6">
        {Array.from({ length: rows }, (_, i) => {
          const ly = y + ((i + 0.5) * h) / rows;
          return <line key={i} x1={x + 6} y1={ly} x2={x + w - 6} y2={ly} />;
        })}
      </g>
    );
  }

  if (art === "eco") {
    const rows = Math.max(6, Math.round(h / 20));
    return (
      <g stroke={c.stroke} strokeWidth="0.6" opacity="0.45">
        {Array.from({ length: rows }, (_, i) => {
          const ly = y + ((i + 0.5) * h) / rows;
          return <line key={i} x1={x + 3} y1={ly} x2={x + w - 3} y2={ly} />;
        })}
      </g>
    );
  }

  if (art === "goldline") {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = Math.min(w, h) * 0.19;
    return (
      <g stroke={c.hardware} fill="none">
        <circle cx={cx} cy={cy} r={r} strokeWidth="0.8" />
        <path
          d={`M${cx} ${cy - r * 0.55} l${r * 0.28} ${r * 0.55} -${r * 0.28} ${r * 0.55} -${r * 0.28} -${r * 0.55} z`}
          fill={c.hardware}
          stroke="none"
        />
        <line x1={cx - w * 0.22} y1={cy + h * 0.24} x2={cx + w * 0.22} y2={cy + h * 0.24} strokeWidth="0.7" />
        <line x1={cx - w * 0.16} y1={cy + h * 0.28} x2={cx + w * 0.16} y2={cy + h * 0.28} strokeWidth="0.7" />
      </g>
    );
  }

  if (art === "minimal") {
    return (
      <line
        x1={x + w * 0.18}
        y1={y + h / 2}
        x2={x + w * 0.82}
        y2={y + h / 2}
        stroke={c.detail}
        strokeWidth="1"
      />
    );
  }

  // noir — тонкий золотий кант по контуру візерункового поля
  return (
    <rect
      x={x + 4}
      y={y + 4}
      width={w - 8}
      height={h - 8}
      rx="3"
      fill="none"
      stroke={c.hardware}
      strokeWidth="1"
      opacity="0.85"
    />
  );
}

function Handles({ c, paths }: { c: Theme; paths: readonly string[] }) {
  return (
    <g fill="none" stroke={c.hardware} strokeWidth="2.2" strokeLinecap="round">
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
  );
}

/* ─────────────────── три форми ─────────────────── */

function Coffin({ c, art }: { c: Theme; art: ArtPattern }) {
  const g = GEO.coffin;
  return (
    <>
      <polygon points={g.outer} fill="#000" opacity="0.05" transform="translate(6 8)" />
      <polygon points={g.outer} fill={c.body} stroke={c.stroke} strokeWidth="1.5" />
      <polygon points={g.inner} fill="none" stroke={c.stroke} strokeWidth="0.8" opacity="0.55" />
      <line {...g.seam} stroke={c.stroke} strokeWidth="0.7" opacity="0.4" />
      <Pattern art={art} c={c} field={g.field} />
      {art !== "minimal" && art !== "eco" && <Handles c={c} paths={g.handles} />}
    </>
  );
}

function Case({ c, art }: { c: Theme; art: ArtPattern }) {
  const g = GEO.case;
  return (
    <>
      <rect {...g.outer} fill="#000" opacity="0.05" transform="translate(6 8)" />
      <rect {...g.outer} fill={c.body} stroke={c.stroke} strokeWidth="1.5" />
      <rect {...g.inner} fill="none" stroke={c.stroke} strokeWidth="0.8" opacity="0.55" />
      <line {...g.seam} stroke={c.stroke} strokeWidth="0.7" opacity="0.4" />
      <Pattern art={art} c={c} field={g.field} />
      {/* стяжки-застібки поперек кофра */}
      <g stroke={c.hardware} strokeWidth="2.4">
        {g.straps.map((y) => (
          <line key={y} x1={g.outer.x - 6} y1={y} x2={g.outer.x + g.outer.width + 6} y2={y} />
        ))}
      </g>
    </>
  );
}

function Box({ c, art }: { c: Theme; art: ArtPattern }) {
  const g = GEO.box;
  return (
    <>
      <rect {...g.outer} fill="#000" opacity="0.05" transform="translate(5 7)" />
      <rect {...g.outer} fill={c.body} stroke={c.stroke} strokeWidth="1.5" />
      <rect {...g.inner} fill="none" stroke={c.stroke} strokeWidth="0.8" opacity="0.55" />
      {/* шов кришки */}
      <line
        x1={g.outer.x}
        y1={g.lid}
        x2={g.outer.x + g.outer.width}
        y2={g.lid}
        stroke={c.stroke}
        strokeWidth="1"
        opacity="0.55"
      />
      <Pattern art={art} c={c} field={g.field} />
      {/* маленька застібка по центру кришки */}
      <rect
        x="192"
        y={g.lid - 7}
        width="16"
        height="14"
        rx="2"
        fill="none"
        stroke={c.hardware}
        strokeWidth="1.6"
      />
      {art !== "minimal" && art !== "eco" && <Handles c={c} paths={g.handles} />}
    </>
  );
}
