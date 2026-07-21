"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const grid = [
  ["T", "H", "E"],
  ["A", "I", "R"],
  ["L", "A", "B"],
];

const CELL_COUNT = 9;

type CellColor = { bg: string; fg: string };

function randomColor(): CellColor {
  const black = Math.random() < 0.5;
  return black
    ? { bg: "#000000", fg: "#ffffff" }
    : { bg: "#ffffff", fg: "#000000" };
}

function invertColor(cell: CellColor): CellColor {
  return cell.bg === "#000000"
    ? { bg: "#ffffff", fg: "#000000" }
    : { bg: "#000000", fg: "#ffffff" };
}

function makePalette() {
  return Array.from({ length: CELL_COUNT }, () => randomColor());
}

function shuffledOrder() {
  const order = Array.from({ length: CELL_COUNT }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

interface SiteLogoProps {
  size?: number;
  /**
   * Tailwind text-size class for the letters. When omitted, the letter size is
   * computed from `size` so it fills the square like the password-screen logo.
   */
  letterSize?: string;
  /** Link target. Pass `false` to render the mark without a link (loading states). */
  href?: string | false;
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
    // Steady one-cell invert on a shuffle cycle — every tick is a visible change,
    // so the loop never looks like it paused between bursts.
    let cursor = 0;
    let order = shuffledOrder();
    const id = window.setInterval(() => {
      setPalette((prev) => {
        const next = prev ? [...prev] : makePalette();
        const idx = order[cursor % CELL_COUNT]!;
        cursor += 1;
        if (cursor % CELL_COUNT === 0) order = shuffledOrder();
        next[idx] = invertColor(next[idx]!);
        return next;
      });
    }, 227);
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

  const mark = (
      <div
        className="grid grid-cols-3 aspect-square"
        style={{ width: size, gap: 0, margin: 0, padding: 0 }}
        aria-hidden={animateColors || undefined}
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
                className={`flex items-center justify-center transition-colors ease-in-out ${
                  animateColors
                    ? "duration-300 cursor-default"
                    : "duration-500 cursor-pointer"
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
                  className={`${letterSize ?? ""} font-light tracking-widest transition-colors ease-in-out ${
                    animateColors ? "duration-300" : "duration-500"
                  }`}
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
  );

  if (href === false) return mark;
  return <Link href={href}>{mark}</Link>;
}
