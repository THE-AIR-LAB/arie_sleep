"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const grid = [
  ["T", "H", "E"],
  ["A", "I", "R"],
  ["L", "A", "B"],
];

const CELL_COUNT = 9;

function randomColor(): { bg: string; fg: string } {
  const black = Math.random() < 0.5;
  return black
    ? { bg: "#000000", fg: "#ffffff" }
    : { bg: "#ffffff", fg: "#000000" };
}

function makePalette() {
  return Array.from({ length: CELL_COUNT }, () => randomColor());
}

interface SiteLogoProps {
  size?: number;
  /**
   * Tailwind text-size class for the letters. When omitted, the letter size is
   * computed from `size` so it fills the square like the password-screen logo.
   */
  letterSize?: string;
  href?: string;
  /** When true, each cell cycles through random colors. */
  animateColors?: boolean;
}

export default function SiteLogo({
  size = 80,
  letterSize,
  href = "/",
  animateColors = false,
}: SiteLogoProps) {
  // Each cell is size/3 wide; ~55% of that reads as a bold, filled letter.
  const computedFontSize = Math.round((size / 3) * 0.4);
  const [toggledSquares, setToggledSquares] = useState<Set<number>>(new Set());
  const [palette, setPalette] = useState(() =>
    animateColors ? makePalette() : null
  );

  useEffect(() => {
    if (!animateColors) {
      setPalette(null);
      return;
    }
    setPalette(makePalette());
    const id = window.setInterval(() => {
      setPalette((prev) => {
        const next = prev ? [...prev] : makePalette();
        // Flip 2–4 random cells each tick so the change feels lively, not a full flash.
        const flips = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < flips; i++) {
          const idx = Math.floor(Math.random() * CELL_COUNT);
          next[idx] = randomColor();
        }
        return next;
      });
    }, 700);
    return () => window.clearInterval(id);
  }, [animateColors]);

  const handleToggle = (index: number) => {
    if (animateColors) return;
    setToggledSquares((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <Link href={href}>
      <div
        className="grid grid-cols-3 aspect-square"
        style={{ width: size, gap: 0, margin: 0, padding: 0 }}
      >
        {grid.map((row, rowIndex) =>
          row.map((letter, colIndex) => {
            const index = rowIndex * 3 + colIndex;
            const isToggled = toggledSquares.has(index);
            const animated = animateColors && palette?.[index];
            const bg = animated ? animated.bg : isToggled ? "#ffffff" : "#000000";
            const fg = animated ? animated.fg : isToggled ? "#000000" : "#ffffff";
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`flex items-center justify-center transition-colors duration-500 ease-in-out ${
                  animateColors ? "cursor-default" : "cursor-pointer"
                }`}
                onMouseEnter={() => handleToggle(index)}
                onClick={() => handleToggle(index)}
                onTouchStart={() => handleToggle(index)}
                style={{
                  aspectRatio: "1/1",
                  margin: 0,
                  padding: 0,
                  backgroundColor: bg,
                  border: "none",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                <span
                  className={`${letterSize ?? ""} font-light tracking-widest transition-colors duration-500 ease-in-out`}
                  style={{
                    fontFamily: "var(--font-archivo), system-ui, sans-serif",
                    color: fg,
                    ...(letterSize ? {} : { fontSize: computedFontSize }),
                  }}
                >
                  {letter}
                </span>
              </div>
            );
          })
        )}
      </div>
    </Link>
  );
}
