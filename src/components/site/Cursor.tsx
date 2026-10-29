"use client";

import { useEffect, useRef } from "react";

/**
 * Premium spatial cursor. Desktop / fine-pointer only.
 * States: default, link, 3d object hover, button, drag, loading.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    document.body.dataset.cursor = "on";

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let scale = 1;
    let targetScale = 1;
    let frame = 0;

    const onMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      const target = event.target as HTMLElement | null;
      const interactive = target?.closest<HTMLElement>("a,button,[role=button],input,textarea,select,label");
      const threeD = document.body.dataset.cursorHover === "3d";
      const isDrag = document.body.dataset.cursorDrag === "1";
      const isBusy = document.body.dataset.cursorBusy === "1";

      targetScale = isBusy ? 0.4 : isDrag ? 2.1 : interactive ? 1.55 : threeD ? 2.35 : 1;
      if (label.current) {
        label.current.textContent = isBusy ? "" : isDrag ? "drag" : threeD ? "explore" : "";
      }
      if (ring.current) {
        ring.current.dataset.state = isBusy ? "busy" : isDrag ? "drag" : threeD ? "object" : interactive ? "link" : "idle";
      }
    };

    const onDown = () => {
      targetScale *= 0.78;
      document.body.dataset.cursorDrag = "1";
    };
    const onUp = () => {
      delete document.body.dataset.cursorDrag;
    };

    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      scale += (targetScale - scale) * 0.14;
      if (dot.current) dot.current.style.transform = `translate3d(${x - 3}px, ${y - 3}px, 0)`;
      if (ring.current) {
        ring.current.style.transform = `translate3d(${rx - 18}px, ${ry - 18}px, 0) scale(${scale})`;
        ring.current.style.setProperty("--r", `${x - rx}px`);
      }
      frame = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    frame = requestAnimationFrame(loop);

    return () => {
      delete document.body.dataset.cursor;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="sevayo-cursor hidden md:block" aria-hidden="true">
      <div
        ref={ring}
        data-state="idle"
        className="relative h-9 w-9 rounded-full border border-white/50 transition-[background,border-color] duration-300 data-[state=object]:border-cyan/70 data-[state=object]:bg-cyan/10 data-[state=link]:border-white/80 data-[state=busy]:border-transparent"
        style={{ boxShadow: "0 0 24px -6px rgba(46,155,255,0.55)" }}
      >
        <span ref={label} className="absolute inset-0 grid place-items-center text-[7px] uppercase tracking-[0.2em] text-white/90" />
      </div>
      <div ref={dot} className="absolute h-1.5 w-1.5 rounded-full bg-white" />
    </div>
  );
}
