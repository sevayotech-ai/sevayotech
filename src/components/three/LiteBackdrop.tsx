"use client";

/**
 * LiteBackdrop — the 2.5D / CSS-3D fallback world used when WebGL is
 * unavailable or motion is reduced. Content and navigation stay intact.
 */
export function LiteBackdrop({
  accent = "#2e9bff",
  accent2 = "#9b5cff",
  active = 0,
}: {
  accent?: string;
  accent2?: string;
  active?: number;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(60% 50% at ${30 + active * 6}% ${35 + (active % 3) * 8}%, ${accent}22, transparent 70%),
                       radial-gradient(50% 45% at 75% 60%, ${accent2}1f, transparent 70%),
                       linear-gradient(180deg, #04050a, #06070f)`,
        }}
      />
      <div className="absolute inset-0 grid-floor opacity-60" />
      <div
        className="absolute left-1/2 top-1/2 h-[46vmin] w-[46vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl float-slow"
        style={{ background: `conic-gradient(from 0deg, ${accent}44, transparent 45%, ${accent2}44)` }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[62vmin] w-[62vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 spin-slow"
        style={{ borderStyle: "dashed" }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[82vmin] w-[82vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5"
      />
      <svg className="absolute left-1/2 top-1/2 h-[24vmin] w-[24vmin] -translate-x-1/2 -translate-y-1/2 float-slow" viewBox="0 0 240 240">
        <defs>
          <linearGradient id="lite-mark" x1="24" y1="20" x2="212" y2="224" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#35d6ff" />
            <stop offset="0.5" stopColor={accent} />
            <stop offset="1" stopColor={accent2} />
          </linearGradient>
        </defs>
        <path
          d="M172 46C120 30 62 52 58 92c-4 38 52 50 74 70 22 20 8 46-32 52"
          fill="none"
          stroke="url(#lite-mark)"
          strokeWidth="30"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/** Lightweight canvas-free brand mark for auth / portal / admin shells. */
export function BrandMarkFlat({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 240 240" aria-hidden="true" className="float-slow">
      <defs>
        <linearGradient id="flat-mark" x1="24" y1="20" x2="212" y2="224" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#35d6ff" />
          <stop offset="0.5" stopColor="#2e9bff" />
          <stop offset="1" stopColor="#c24bff" />
        </linearGradient>
      </defs>
      <path
        d="M172 46C120 30 62 52 58 92c-4 38 52 50 74 70 22 20 8 46-32 52"
        fill="none"
        stroke="url(#flat-mark)"
        strokeWidth="30"
        strokeLinecap="round"
      />
    </svg>
  );
}
