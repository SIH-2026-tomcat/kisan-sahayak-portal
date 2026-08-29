"use client";

import { AshokaChakra } from "./AshokaChakra";

/**
 * Fixed bottom-right national ornament: a waving tricolour flag with a
 * rotating Ashoka Chakra and two ribbon streamers. Purely decorative,
 * non-interactive, and calmed by prefers-reduced-motion.
 */
export function FlagRibbon({ className }: { className?: string }) {
  return (
    <div className={`flag-ribbon ${className ?? ""}`} aria-hidden>
      <div className="relative h-[152px] w-[132px]">
        {/* pole */}
        <div className="absolute left-0 top-0 h-[152px] w-[4px] rounded bg-[#7c5a34]" />
        <div className="absolute -left-[3px] -top-[2px] h-[10px] w-[10px] rounded-full bg-[#d4a437]" />

        {/* ribbon streamers */}
        <div className="absolute left-[10px] top-[92px] h-[58px] w-[9px] -rotate-[7deg] rounded-full bg-flag-saffron/85" />
        <div className="absolute left-[22px] top-[92px] h-[66px] w-[9px] rotate-[4deg] rounded-full bg-white/80 ring-1 ring-line" />
        <div className="absolute left-[34px] top-[92px] h-[60px] w-[9px] rotate-[12deg] rounded-full bg-flag-green/85" />

        {/* waving cloth */}
        <div className="flag-ribbon__cloth ml-[4px] h-[86px] w-[128px] overflow-hidden rounded-r-[4px] rounded-bl-[4px] ring-1 ring-black/5">
          <div className="h-1/3 w-full bg-flag-saffron" />
          <div className="h-1/3 w-full bg-white" />
          <div className="h-1/3 w-full bg-flag-green" />
        </div>

        {/* rotating chakra on the white band */}
        <AshokaChakra className="flag-ribbon__chakra absolute left-[47px] top-[21px] h-[42px] w-[42px] text-flag-navy" />
      </div>
    </div>
  );
}
