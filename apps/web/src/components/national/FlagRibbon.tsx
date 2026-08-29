"use client";

const NAVY = "#1A4B9C";

/** Chakra centred at (cx,cy) with radius r. The spinning group is tagged so
 * globals.css can rotate it (and stop under prefers-reduced-motion). */
function Chakra({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const spokes = 24;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 3} fill="#fff" />
      <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke={NAVY} strokeWidth="2" />
      <g className="flag-ribbon__chakra" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={NAVY} strokeWidth="2.5" />
        <circle cx={cx} cy={cy} r={r * 0.16} fill={NAVY} />
        {Array.from({ length: spokes }, (_, i) => {
          const a = (i * 360) / spokes;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - r * 0.9}
              stroke={NAVY}
              strokeWidth="1.4"
              strokeLinecap="round"
              transform={`rotate(${a} ${cx} ${cy})`}
            />
          );
        })}
        {Array.from({ length: spokes }, (_, i) => {
          const a = (i * 360) / spokes + 180 / spokes;
          return (
            <circle
              key={`d${i}`}
              cx={cx}
              cy={cy - r * 0.88}
              r="1.4"
              fill={NAVY}
              transform={`rotate(${a} ${cx} ${cy})`}
            />
          );
        })}
      </g>
    </g>
  );
}

/** Rough brush-stroke band with wavy edges + a few scattered flecks. */
function Band({ y, fill }: { y: number; fill: string }) {
  return (
    <g fill={fill}>
      <path
        d={`M4 ${y}
            C60 ${y - 5}, 135 ${y + 4}, 206 ${y - 4}
            C214 ${y + 8}, 214 ${y + 24}, 208 ${y + 33}
            C135 ${y + 40}, 60 ${y + 31}, 4 ${y + 35}
            C9 ${y + 23}, 9 ${y + 12}, 4 ${y} Z`}
      />
      <path d={`M210 ${y + 2} l10 -3 l-3 9 l7 4 l-9 5 l4 8 l-10 -2 Z`} />
      <circle cx={224} cy={y + 6} r={2.4} />
      <circle cx={230} cy={y + 18} r={1.6} />
      <circle cx={222} cy={y + 28} r={2} />
    </g>
  );
}

/**
 * Fixed bottom-right national ornament: a painted tricolour brush stroke with
 * torn edges and a large rotating Ashoka Chakra. Decorative, non-interactive,
 * calmed by prefers-reduced-motion.
 */
export function FlagRibbon({ className }: { className?: string }) {
  return (
    <div className={`flag-ribbon ${className ?? ""}`} aria-hidden>
      <svg viewBox="0 0 240 160" className="h-auto w-full">
        <g className="flag-ribbon__cloth">
          <g transform="rotate(-13 120 78)">
            <Band y={30} fill="#FF9933" />
            <Band y={60} fill="#EDEDED" />
            <Band y={90} fill="#138808" />
          </g>
        </g>
        <Chakra cx={54} cy={40} r={30} />
      </svg>
    </div>
  );
}
