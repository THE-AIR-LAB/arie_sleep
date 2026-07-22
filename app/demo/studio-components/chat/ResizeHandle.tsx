"use client";

import React, { useState } from "react";

/**
 * Drag handle living on a drawer's inner edge to resize it. Rendered as an
 * absolutely-positioned child of `.body` (which is position:relative), so it's
 * decoupled from the drawer components themselves.
 *
 * `side="right"` → handle on a LEFT drawer's right edge (drag right = wider).
 * `side="left"`  → handle on a RIGHT drawer's left edge (drag left = wider).
 * Double-click resets to `def`.
 */
export function ResizeHandle({
  side,
  width,
  setWidth,
  min,
  max,
  def,
}: {
  side: "left" | "right";
  width: number;
  setWidth: (w: number) => void;
  min: number;
  max: number;
  def: number;
}) {
  const [active, setActive] = useState(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const startX = e.clientX;
    const startW = width;
    setActive(true);
    document.body.classList.add("ra-resizing");
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const next = side === "right" ? startW + dx : startW - dx;
      setWidth(Math.round(Math.max(min, Math.min(max, next))));
    };
    const onUp = () => {
      setActive(false);
      document.body.classList.remove("ra-resizing");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const style: React.CSSProperties =
    side === "right" ? { left: width - 5 } : { right: width - 5 };

  return (
    <div
      className={"resize-handle" + (active ? " active" : "")}
      style={style}
      onPointerDown={onPointerDown}
      onDoubleClick={() => setWidth(def)}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panel (double-click to reset)"
    />
  );
}
