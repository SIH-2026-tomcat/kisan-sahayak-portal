"use client";

const NAVY = "#1A4B9C";
const SAFFRON = "#F49A24";
const GREEN = "#1C8A3B";
const WHITE = "#D7D7D7";

/** Rotating 24-spoke Ashoka Chakra centred at (cx,cy), radius r. */
function Chakra({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const spokes = 24;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 3} fill="#fff" />
      <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke={NAVY} strokeWidth="2" />
      <g className="flag-ribbon__chakra" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={NAVY} strokeWidth="2.4" />
        <circle cx={cx} cy={cy} r={r * 0.16} fill={NAVY} />
        {Array.from({ length: spokes }, (_, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - r * 0.9}
            stroke={NAVY}
            strokeWidth="1.3"
            strokeLinecap="round"
            transform={`rotate(${(i * 360) / spokes} ${cx} ${cy})`}
          />
        ))}
        {Array.from({ length: spokes }, (_, i) => (
          <circle
            key={`d${i}`}
            cx={cx}
            cy={cy - r * 0.88}
            r="1.3"
            fill={NAVY}
            transform={`rotate(${(i * 360) / spokes + 180 / spokes} ${cx} ${cy})`}
          />
        ))}
      </g>
    </g>
  );
}

type RibbonProps = {
  d: string;
  color: string;
  width: number;
  streakColor: string;
  streaks: string[];
  hairs: string[];
  stipple: [number, number, number][];
};

/** One flowing dry-brush ribbon: a solid wavy stroke, bristle highlight
 * streaks, a frayed/stippled edge and hair wisps off the left tail. */
function Ribbon({ d, color, width, streakColor, streaks, hairs, stipple }: RibbonProps) {
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
        strokeDasharray="0 14 5 10 4 999"
        strokeOpacity={0.9}
      />
      {stipple.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={color} />
      ))}
      {streaks.map((s, i) => (
        <path
          key={i}
          d={s}
          fill="none"
          stroke={streakColor}
          strokeOpacity={0.35}
          strokeWidth={i % 2 ? 1.6 : 2.6}
          strokeLinecap="round"
        />
      ))}
      {hairs.map((h, i) => (
        <path key={i} d={h} fill="none" stroke={color} strokeWidth={i % 2 ? 2 : 3.4} strokeLinecap="round" />
      ))}
    </g>
  );
}

/**
 * Fixed bottom-right national ornament: a flowing, wavy tricolour brush stroke
 * with dry-brush texture and a rotating Ashoka Chakra at the tip — modelled on
 * an abstract Indian-flag brush illustration. Decorative, non-interactive,
 * calmed by prefers-reduced-motion.
 */
export function FlagRibbon({ className }: { className?: string }) {
  return (
    <div className={`flag-ribbon ${className ?? ""}`} aria-hidden>
      <svg viewBox="0 0 348 168" className="h-auto w-full">
        <g className="flag-ribbon__cloth">
          <Ribbon
            d="M14 84 C 62 106, 122 62, 178 56 C 234 50, 294 36, 332 20"
            color={SAFFRON}
            width={20}
            streakColor="#ffffff"
            streaks={[
              "M22 82 C 80 66, 160 58, 250 44 C 286 39, 308 33, 322 27",
              "M26 90 C 90 82, 160 74, 244 60",
            ]}
            hairs={["M14 82 C 2 78, -8 84, -20 79", "M15 87 C 3 87, -7 94, -19 92", "M18 76 C 8 71, 0 66, -10 62"]}
            stipple={[
              [40, 96, 2.4],
              [96, 82, 2.2],
              [150, 70, 2.6],
              [210, 56, 2.2],
              [268, 44, 2.4],
              [312, 28, 2],
            ]}
          />
          <Ribbon
            d="M12 102 C 60 124, 120 80, 176 74 C 232 68, 292 54, 334 38"
            color={WHITE}
            width={20}
            streakColor="#8f8f8f"
            streaks={["M22 100 C 90 86, 170 78, 262 62", "M26 108 C 96 100, 170 92, 250 78"]}
            hairs={["M12 100 C 0 96, -10 102, -22 97", "M13 105 C 1 105, -9 112, -21 110"]}
            stipple={[
              [46, 114, 2.2],
              [104, 96, 2.2],
              [160, 84, 2.4],
              [220, 70, 2.2],
              [280, 56, 2.2],
              [318, 44, 2],
            ]}
          />
          <Ribbon
            d="M10 120 C 58 142, 118 98, 174 92 C 230 86, 290 72, 334 56"
            color={GREEN}
            width={18}
            streakColor="#ffffff"
            streaks={[
              "M20 118 C 88 104, 168 96, 262 80 C 296 75, 318 69, 330 63",
              "M24 126 C 92 118, 168 110, 250 96",
            ]}
            hairs={["M10 118 C -2 114, -12 120, -24 115", "M11 123 C -1 123, -11 130, -23 128", "M14 112 C 4 107, -4 102, -14 98"]}
            stipple={[
              [44, 132, 2.4],
              [102, 112, 2.2],
              [160, 100, 2.6],
              [220, 86, 2.2],
              [282, 72, 2.4],
              [320, 60, 2],
            ]}
          />
        </g>
        <Chakra cx={320} cy={19} r={19} />
      </svg>
    </div>
  );
}
