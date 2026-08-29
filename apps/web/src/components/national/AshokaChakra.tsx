/** Ashoka Chakra — 24-spoke navy wheel from the national flag. Decorative. */
export function AshokaChakra({ className, spokes = 24 }: { className?: string; spokes?: number }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden fill="none">
      <circle cx="50" cy="50" r="43" stroke="currentColor" strokeWidth="3.2" />
      <circle cx="50" cy="50" r="6.5" fill="currentColor" />
      {Array.from({ length: spokes }, (_, i) => (
        <line
          key={i}
          x1="50"
          y1="50"
          x2="50"
          y2="8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          transform={`rotate(${(i * 360) / spokes} 50 50)`}
        />
      ))}
      {Array.from({ length: spokes }, (_, i) => (
        <circle
          key={`d${i}`}
          cx="50"
          cy="11"
          r="1.5"
          fill="currentColor"
          transform={`rotate(${(i * 360) / spokes + 180 / spokes} 50 50)`}
        />
      ))}
    </svg>
  );
}
