"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

type Stage = { step: string; title: string; detail: string };

/**
 * ProcessJourney — a spatial path the camera travels along while scrolling.
 * Each stage becomes active in turn; the 3D path is drawn with perspective.
 */
export function ProcessJourney({
  stages,
  accent,
  accent2,
}: {
  stages: Stage[];
  accent: string;
  accent2: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({ target: container, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });
  const draw = useTransform(smooth, [0, 1], [0, 1]);
  const rotateY = useTransform(smooth, [0, 1], [-16, 16]);
  const depth = useTransform(smooth, [0, 0.5, 1], [1.08, 1, 1.08]);

  useEffect(() => {
    const unsubscribe = smooth.on("change", (value) => {
      setActive(Math.min(stages.length - 1, Math.floor(value * stages.length * 0.999)));
    });
    return () => unsubscribe();
  }, [smooth, stages.length]);

  return (
    <div ref={container} className="relative z-10" style={{ height: `${stages.length * 100}vh` }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden px-4 sm:px-6">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          {/* 3D path visual */}
          <div className="pointer-events-none relative hidden h-[62vh] lg:block" style={{ perspective: "1200px" }}>
            <motion.div
              className="absolute inset-0"
              style={{ rotateY, scale: depth, transformStyle: "preserve-3d" }}
            >
              <svg viewBox="0 0 400 620" className="h-full w-full">
                <defs>
                  <linearGradient id="path-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} />
                    <stop offset="100%" stopColor={accent2} />
                  </linearGradient>
                </defs>
                <path
                  d="M200 40 C 320 120, 80 190, 200 270 C 320 350, 80 420, 200 500 C 280 560, 140 590, 200 600"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <motion.path
                  d="M200 40 C 320 120, 80 190, 200 270 C 320 350, 80 420, 200 500 C 280 560, 140 590, 200 600"
                  fill="none"
                  stroke="url(#path-gradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  style={{ pathLength: draw }}
                />
                {stages.map((stage, i) => {
                  const positions = [
                    [200, 40],
                    [272, 105],
                    [200, 270],
                    [272, 335],
                    [200, 500],
                    [240, 555],
                    [200, 600],
                  ];
                  const [cx, cy] = positions[i % positions.length];
                  const isActive = i === active;
                  return (
                    <g key={stage.step}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isActive ? 13 : 8}
                        fill={isActive ? accent : "#0b1020"}
                        stroke={isActive ? accent : "rgba(255,255,255,0.25)"}
                        strokeWidth="2"
                        style={{ transition: "all .45s cubic-bezier(.16,1,.3,1)" }}
                      />
                      {isActive ? (
                        <circle cx={cx} cy={cy} r="24" fill="none" stroke={accent} strokeWidth="1" opacity="0.4" />
                      ) : null}
                      <text
                        x={cx + 24}
                        y={cy + 4}
                        fill={isActive ? "#e9edf9" : "rgba(154,165,191,0.7)"}
                        fontSize="14"
                        fontFamily="ui-monospace, monospace"
                      >
                        {stage.step}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </motion.div>
          </div>

          {/* Active stage panel */}
          <div>
            <p className="eyebrow">Stage {String(active + 1).padStart(2, "0")} of {String(stages.length).padStart(2, "0")}</p>
            <motion.h2
              key={stages[active].title}
              initial={{ opacity: 0, y: 24, rotateX: 8 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="headline mt-3"
              style={{ transformPerspective: 1000 }}
            >
              {stages[active].title}
            </motion.h2>
            <p className="lede mt-5">{stages[active].detail}</p>

            <div className="mt-10 grid gap-2">
              {stages.map((stage, i) => (
                <div
                  key={stage.step}
                  className={`hairline flex items-center gap-4 rounded-2xl px-4 py-3 transition-all duration-500 ${
                    i === active ? "bg-white/[0.08]" : "bg-white/[0.02]"
                  }`}
                  style={i === active ? { borderColor: `${accent}66` } : undefined}
                >
                  <span className="mono text-xs tracking-[0.24em]" style={{ color: i === active ? accent : "#9aa5bf" }}>
                    {stage.step}
                  </span>
                  <span className={`text-sm ${i === active ? "text-ink" : "text-mute"}`}>{stage.title}</span>
                  <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: i <= active ? accent : "rgba(255,255,255,0.16)" }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
