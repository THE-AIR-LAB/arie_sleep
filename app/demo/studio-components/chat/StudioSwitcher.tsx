"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ic } from "../ra-icons";
import { STUDIO_OPTIONS } from "./constants";

/**
 * Switch between Analyst / Council / Therapist studios.
 * `sidebar` = desktop drawer title; `pane` = mobile Chats drawer.
 */
export function StudioSwitcher({
  productName,
  studioPath,
  variant = "sidebar",
}: {
  productName: string;
  studioPath: string;
  variant?: "pane" | "sidebar";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const btnClass =
    variant === "pane"
      ? "th-studio-pane-btn"
      : "side-title th-studio-sidebar-btn";

  return (
    <div
      className={
        "th-studio" +
        (variant === "pane" ? " th-studio--pane" : " th-studio--sidebar")
      }
      ref={ref}
    >
      <button
        type="button"
        className={btnClass + (open ? " on" : "")}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Switch studio"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {productName}
        <Ic.Chevron
          size={variant === "pane" ? 16 : 14}
          style={{ transform: open ? "rotate(180deg)" : undefined }}
        />
      </button>
      {open && (
        <div className="th-studio-menu" role="menu">
          {STUDIO_OPTIONS.map((opt) => {
            const selected = opt.href === studioPath;
            return (
              <button
                key={opt.href}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                className={"th-studio-option" + (selected ? " selected" : "")}
                onClick={() => {
                  setOpen(false);
                  if (!selected) router.push(opt.href);
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
