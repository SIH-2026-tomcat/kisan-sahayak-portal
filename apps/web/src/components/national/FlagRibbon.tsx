"use client";

const NAVY = "#1A4B9C";
const SAFFRON = "#F49A24";
const GREEN = "#1C8A3B";
const WHITE = "#D7D7D7";

const X0 = 14;
const X1 = 340;

/** Smooth wavy centre-line: 2.5 sine periods over the width, plus an upward
 * drift so the ribbon flows up toward the tip. */
function wave(baseY: number, ampl: number, phase: number, rise: number, steps = 30) {
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const x = X0 + ((X1 - X0) * i) / steps;
    const t = (x - X0) / (X1 - X0);
    const y = baseY + rise * t + ampl * Math.sin(t * Math.PI * 2 + phase);
    pts.push([x, y]);
  }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [cx, cy] = pts[i];
    const [nx, ny] = pts[i + 1];
    d += ` Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${((cx + nx) / 2).toFixed(1)} ${((cy + ny) / 2).toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last[0].toFixed(1)} ${last[1].toFixed(1)}`;
  return { d, pts };
}

/** Rotating 24-spoke Ashoka Chakra centred at (cx,cy), radius r. */
function Chakra({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const spokes = 24;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 3} fill="#fff" />
      <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke={NAVY} strokeWidth="2.2" />
      <g className="flag-ribbon__chakra" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={NAVY} strokeWidth="2.6" />
        <circle cx={cx} cy={cy} r={r * 0.15} fill={NAVY} />
        {Array.from({ length: spokes }, (_, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - r * 0.9}
            stroke={NAVY}
            strokeWidth="1.4"
            strokeLinecap="round"
            transform={`rotate(${(i * 360) / spokes} ${cx} ${cy})`}
          />
        ))}
        {Array.from({ length: spokes }, (_, i) => (
          <circle
            key={`d${i}`}
            cx={cx}
            cy={cy - r * 0.88}
            r="1.4"
            fill={NAVY}
            transform={`rotate(${(i * 360) / spokes + 180 / spokes} ${cx} ${cy})`}
          />
        ))}
      </g>
    </g>
  );
}

/** One flowing dry-brush ribbon along a wavy centre-line. */
function Ribbon({
  baseY,
  phase,
  color,
  width,
  streakColor,
}: {
  baseY: number;
  phase: number;
  color: string;
  width: number;
  streakColor: string;
}) {
  const { d, pts } = wave(baseY, 22, phase, -40);
  const streakA = wave(baseY - 3, 22, phase, -40).d;
  const streakB = wave(baseY + 3, 19, phase + 0.3, -40).d;
  // stipple the top & bottom edges for a frayed brush look
  const stipple = pts.filter((_, i) => i % 4 === 1);
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      {/* frayed ends */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width + 5}
        strokeLinecap="round"
        strokeDasharray="0 12 5 9 4 999"
      />
      {stipple.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y - width / 2} r={i % 2 ? 1.7 : 2.4} fill={color} />
          <circle cx={x + 6} cy={y + width / 2} r={i % 2 ? 2.3 : 1.6} fill={color} />
        </g>
      ))}
      <path d={streakA} fill="none" stroke={streakColor} strokeOpacity={0.32} strokeWidth={2.4} strokeLinecap="round" />
      <path d={streakB} fill="none" stroke={streakColor} strokeOpacity={0.22} strokeWidth={1.5} strokeLinecap="round" />
      {/* hair wisps off the left tail */}
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M ${X0} ${baseY - 6 + i * 6} C ${X0 - 10} ${baseY - 8 + i * 6}, ${X0 - 18} ${baseY - 2 + i * 6}, ${X0 - 26} ${baseY - 6 + i * 6}`}
          fill="none"
          stroke={color}
          strokeWidth={i % 2 ? 2 : 3.2}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

/**
 * Fixed bottom-right national ornament: a rippling, wave-like tricolour brush
 * stroke with dry-brush texture and a large rotating Ashoka Chakra near the
 * tip — modelled on an abstract Indian-flag brush illustration. Decorative,
 * non-interactive, calmed by prefers-reduced-motion.
 */
export function FlagRibbon({ className }: { className?: string }) {
  return (
    <div className={`flag-ribbon ${className ?? ""}`} aria-hidden>
      <svg viewBox="-16 0 388 150" className="h-auto w-full">
        <g className="flag-ribbon__cloth">
          <Ribbon baseY={78} phase={0} color={SAFFRON} width={20} streakColor="#ffffff" />
          <Ribbon baseY={95} phase={0} color={WHITE} width={20} streakColor="#8f8f8f" />
          <Ribbon baseY={112} phase={0} color={GREEN} width={18} streakColor="#ffffff" />
        </g>
        <Chakra cx={322} cy={40} r={28} />
      </svg>
    </div>
  );
}
