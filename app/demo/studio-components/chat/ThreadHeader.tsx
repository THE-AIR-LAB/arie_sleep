"use client";

import { useEffect, useRef, useState } from "react";
import { AssistantMark } from "./AssistantMark";
import type { StudioChatConfig } from "./types";

export function ThreadHeader({
  config,
  showThreadControls = false,
  hideBubbleControls = true,
  onToggleHideBubbleControls,
  allCollapsed = false,
  onToggleCollapseAll,
  avatarOnly = false,
  onToggleAvatarOnly,
  showFeedbackToggle = false,
  highlightFeedback = false,
  onToggleHighlightFeedback,
}: {
  config: Pick<
    StudioChatConfig,
    "productName" | "assistantMark" | "avatarMono" | "avatarSrc" | "emptyStateHref"
  >;
  showThreadControls?: boolean;
  hideBubbleControls?: boolean;
  onToggleHideBubbleControls?: () => void;
  allCollapsed?: boolean;
  onToggleCollapseAll?: () => void;
  avatarOnly?: boolean;
  onToggleAvatarOnly?: () => void;
  /** Only when this conversation has at least one feedback entry. */
  showFeedbackToggle?: boolean;
  highlightFeedback?: boolean;
  onToggleHighlightFeedback?: () => void;
}) {
  // On mobile, Feedback is a round button in MobileNav — keep it out of the pill.
  const [isMobile, setIsMobile] = useState(false);
  // Auto-hide the title when the pill would overlap the mobile top-right buttons
  // (Therapist / Council names are wider; Feedback adds another mrail button).
  const [compactForNav, setCompactForNav] = useState(false);
  const headRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const compactRef = useRef(compactForNav);
  compactRef.current = compactForNav;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 900px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isMobile || avatarOnly) {
      setCompactForNav(false);
      return;
    }
    const head = headRef.current;
    if (!head) return;

    const GAP = 12;
    const HYSTERESIS = 20;

    const check = () => {
      const nav = document.querySelector(".ra-scope .mobile-railnav");
      if (!nav) {
        setCompactForNav(false);
        return;
      }
      const headLeft = head.getBoundingClientRect().left;
      const navLeft = nav.getBoundingClientRect().left;
      const avatar = head.querySelector(".th-avatar-toggle") as HTMLElement | null;
      const avatarW = avatar?.offsetWidth ?? 28;
      const titleW = measureRef.current?.offsetWidth ?? 0;
      // Match expanded-pill chrome (mobile padding 4/14, gap 13).
      const fullW = 4 + avatarW + 13 + titleW + 14;
      const room = navLeft - headLeft;
      const compact = compactRef.current;
      // Hysteresis: once collapsed, require extra space before expanding again.
      setCompactForNav(compact ? room < fullW + GAP + HYSTERESIS : room < fullW + GAP);
    };

    check();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(check) : null;
    ro?.observe(head);
    const nav = document.querySelector(".ra-scope .mobile-railnav");
    if (nav) ro?.observe(nav);
    window.addEventListener("resize", check);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [isMobile, avatarOnly, config.productName, showFeedbackToggle, showThreadControls]);

  const hideMeta = avatarOnly || compactForNav;

  return (
    <div
      ref={headRef}
      className={"thread-head" + (hideMeta ? " is-avatar-only" : "")}
    >
      {/* Offscreen title measure — used to decide mobile compact mode. */}
      <span ref={measureRef} className="th-name th-name-measure" aria-hidden>
        {config.productName}
      </span>
      <button
        type="button"
        className="th-avatar-toggle"
        onClick={() => onToggleAvatarOnly?.()}
        title={hideMeta ? "Expand header" : "Collapse to avatar"}
        aria-label={hideMeta ? "Expand header" : "Collapse to avatar"}
        aria-expanded={!hideMeta}
      >
        <AssistantMark variant="th" config={config} />
      </button>
      {!hideMeta && (
        <div className="th-meta">
          <div className="th-name">{config.productName}</div>
          {showThreadControls && (
            <div className="thread-head-controls">
              <button
                type="button"
                className={"thread-collapse-all" + (!hideBubbleControls ? " on" : "")}
                onClick={onToggleHideBubbleControls}
                aria-pressed={!hideBubbleControls}
                title={
                  hideBubbleControls
                    ? "Show bubble nav and footer"
                    : "Hide bubble nav and footer"
                }
              >
                Controls
              </button>
              <button
                type="button"
                className="thread-collapse-all"
                onClick={onToggleCollapseAll}
                title={allCollapsed ? "Expand every message" : "Collapse every message to one line"}
              >
                <span className="thread-pill-swap">
                  <span className={allCollapsed ? "is-active" : ""} aria-hidden={!allCollapsed}>
                    Expand all
                  </span>
                  <span className={!allCollapsed ? "is-active" : ""} aria-hidden={allCollapsed}>
                    Collapse all
                  </span>
                </span>
              </button>
            </div>
          )}
          {showFeedbackToggle && !isMobile ? (
            <button
              type="button"
              className={"thread-collapse-all thread-feedback-toggle" + (highlightFeedback ? " on" : "")}
              onClick={onToggleHighlightFeedback}
              aria-pressed={highlightFeedback}
              title={
                highlightFeedback
                  ? "Hide feedback highlight on bubbles"
                  : "Highlight bubbles that have feedback"
              }
            >
              Feedback
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
