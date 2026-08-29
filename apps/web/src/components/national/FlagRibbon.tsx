"use client";

const NAVY = "#1A4B9C";

/** Chakra centred at (cx,cy) with radius r. The spinning group is tagged so
 * globals.css can rotate it (and stop under prefers-reduced-motion). */
function Chakra({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const spokes = 24;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 3.5} fill="#fff" />
      <circle cx={cx} cy={cy} r={r + 3.5} fill="none" stroke={NAVY} strokeWidth="2.4" />
      <g className="flag-ribbon__chakra" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={NAVY} strokeWidth="2.6" />
        <circle cx={cx} cy={cy} r={r * 0.15} fill={NAVY} />
        {Array.from({ length: spokes }, (_, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - r * 0.92}
            stroke={NAVY}
            strokeWidth="1.5"
            strokeLinecap="round"
            transform={`rotate(${(i * 360) / spokes} ${cx} ${cy})`}
          />
        ))}
        {Array.from({ length: spokes }, (_, i) => (
          <circle
            key={`d${i}`}
            cx={cx}
            cy={cy - r * 0.9}
            r="1.5"
            fill={NAVY}
            transform={`rotate(${(i * 360) / spokes + 180 / spokes} ${cx} ${cy})`}
          />
        ))}
      </g>
    </g>
  );
}

/**
 * Curvy, wavy brush-stroke band. Top and bottom edges undulate out of phase so
 * the stroke thickness swells and thins like a real brush; both ends taper to a
 * point, and a scatter of flecks and a bristle streak trail off the tip.
 */
function Band({ y, fill, phase = 0 }: { y: number; fill: string; phase?: number }) {
  const p = phase;
  return (
    <g fill={fill}>
      <path
        d={`
          M 0 ${y + 8 + p}
          C 22 ${y - 8 + p}, 58 ${y + 12 + p}, 96 ${y - 6 + p}
          C 134 ${y - 22 + p}, 180 ${y + 2 + p}, 220 ${y - 10 + p}
          C 240 ${y - 15 + p}, 256 ${y - 6 + p}, 262 ${y + 6 + p}
          C 258 ${y + 16 + p}, 250 ${y + 20 + p}, 236 ${y + 22 + p}
          C 190 ${y + 40 + p}, 150 ${y + 22 + p}, 108 ${y + 32 + p}
          C 66 ${y + 42 + p}, 30 ${y + 22 + p}, 4 ${y + 36 + p}
          C -6 ${y + 28 + p}, -6 ${y + 18 + p}, 0 ${y + 8 + p}
          Z`}
      />
      {/* bristle streak */}
      <path
        d={`M 12 ${y + 14 + p} C 70 ${y + 2 + p}, 150 ${y + 8 + p}, 232 ${y + 2 + p}`}
        stroke="#ffffff"
        strokeOpacity="0.28"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      {/* trailing flecks off the tip */}
      <circle cx={252} cy={y - 2 + p} r={3} />
      <circle cx={262} cy={y + 10 + p} r={2} />
      <circle cx={256} cy={y + 24 + p} r={2.6} />
      <circle cx={268} cy={y + 2 + p} r={1.4} />
      <path d={`M 244 ${y + 20 + p} q 12 4 22 -2 q -8 10 -22 6 Z`} />
    </g>
  );
}

/**
 * Fixed bottom-right national ornament: a painted, wavy tricolour brush stroke
 * with torn edges and a large rotating Ashoka Chakra. Decorative,
 * non-interactive, calmed by prefers-reduced-motion.
 */
export function FlagRibbon({ className }: { className?: string }) {
  return (
    <div className={`flag-ribbon ${className ?? ""}`} aria-hidden>
      <svg viewBox="0 0 280 210" className="h-auto w-full">
        <g className="flag-ribbon__cloth">
          <g transform="rotate(-12 150 120)">
            <g transform="rotate(-2 130 60)">
              <Band y={54} fill="#FF9933" phase={0} />
            </g>
            <Band y={88} fill="#DBDBDB" phase={2} />
            <g transform="rotate(2 130 130)">
              <Band y={122} fill="#138808" phase={-1} />
            </g>
          </g>
        </g>
        <Chakra cx={84} cy={98} r={54} />
      </svg>
    </div>
  );
}
