"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Ic } from "../ra-icons";
import { FeedbackMenuEditor, type FeedbackEntry } from "../FeedbackControls";
import { AssistantMark } from "./AssistantMark";
import { BubbleFullscreen } from "./BubbleFullscreen";
import {
  BubbleMarkdown,
  collapsedPlainPreview,
  looksLikeWorksheet,
  worksheetSectionCount,
} from "./BubbleMarkdown";
import { VoiceFeedbackButton } from "./VoiceFeedbackButton";
import type { Message, StudioChatConfig } from "./types";

/** Always-reserved slot for the reset-width control (matches CSS --bubble-reset-gutter). */
const RESET_GUTTER = 36;

/** Horizontal free space for bubble resize — inside .main, clear of rails/drawers. */
function getBubbleResizeBounds(el: HTMLElement): { minLeft: number; maxRight: number } {
  const main = el.closest(".main") as HTMLElement | null;
  const thread = el.closest(".thread") as HTMLElement | null;
  const boundsEl = main ?? thread;
  const fallback = { minLeft: 12, maxRight: window.innerWidth - 12 };
  if (!boundsEl) return fallback;

  const br = boundsEl.getBoundingClientRect();
  const padL =
    boundsEl === thread
      ? parseFloat(getComputedStyle(thread!).paddingLeft) || 0
      : 12;
  const padR =
    boundsEl === thread
      ? parseFloat(getComputedStyle(thread!).paddingRight) || 0
      : 12;
  let minLeft = br.left + padL;
  let maxRight = br.right - padR;

  // Rails / side drawers may overlay .main (e.g. floating right-rail while a
  // drawer is open). Clamp so the bubble never paints under them.
  const scope = el.closest(".ra-scope") ?? document;
  const blockers = scope.querySelectorAll<HTMLElement>(
    ".sidebar, .right-rail, .obs-panel"
  );
  const mid = (minLeft + maxRight) / 2;
  for (const node of blockers) {
    const r = node.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    // Skip elements that don't vertically overlap the chat column.
    if (r.bottom <= br.top || r.top >= br.bottom) continue;
    if (r.right <= mid) {
      minLeft = Math.max(minLeft, r.right);
    } else if (r.left >= mid) {
      maxRight = Math.min(maxRight, r.left);
    }
  }

  const GAP = 8;
  minLeft += GAP;
  // Match the always-reserved reset gutter so drag-start width == default width.
  maxRight -= GAP + RESET_GUTTER;
  if (maxRight - minLeft < 180) {
    // Degenerate (narrow) layout — fall back to padded main box.
    return {
      minLeft: br.left + padL + GAP,
      maxRight: br.right - padR - GAP - RESET_GUTTER,
    };
  }
  return { minLeft, maxRight };
}

/** Bubble left edge min — AI rows keep avatar+gap clear of the left rail. */
function bubbleMinLeft(boundsMinLeft: number, leftChrome: number): number {
  return boundsMinLeft + Math.max(0, leftChrome);
}

export function Bubble({
  config,
  m,
  messageIndex = 0,
  messages: messagesProp,
  feedbackByIdx,
  onOpenTrace,
  onOpenPolicy,
  onOpenState,
  onOpenFeedback,
  hasState = false,
  feedbackMode = false,
  feedbackEntries,
  feedbackEditing = false,
  onSubmitFeedback,
  onSubmitFeedbackAt,
  onRemoveFeedback,
  collapsed = false,
  onToggleCollapse,
  hideControls = false,
  turnNumber,
}: {
  config: Pick<StudioChatConfig, "productName" | "assistantMark" | "avatarMono" | "avatarSrc" | "emptyStateHref">;
  m: Message;
  messageIndex?: number;
  messages?: Message[];
  feedbackByIdx?: Record<number, FeedbackEntry[]>;
  onOpenTrace?: (turnId: string) => void;
  onOpenPolicy?: (turnId: string) => void;
  onOpenState?: (turnId: string) => void;
  /** True when this turn extracted at least one piece of state (drives the State button). */
  hasState?: boolean;
  onOpenFeedback?: () => void;
  /** In feedback mode the fullscreen view becomes editable + submittable. */
  feedbackMode?: boolean;
  feedbackEntries?: FeedbackEntry[];
  /** True while the per-bubble feedback dropdown is open. */
  feedbackEditing?: boolean;
  onSubmitFeedback?: (entries: FeedbackEntry[]) => void;
  onSubmitFeedbackAt?: (index: number, entries: FeedbackEntry[]) => void;
  onRemoveFeedback?: () => void;
  /** When true the bubble is tucked to a single line. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** When true, hide the bubble nav and footer chrome. */
  hideControls?: boolean;
  /** 1-based turn index shown in the bubble top nav. */
  turnNumber?: number;
}) {
  const messages = messagesProp ?? [m];
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  // When global chrome is hidden, avatar click reveals nav/footer for THIS bubble only.
  const [revealControls, setRevealControls] = useState(false);
  /** Which Feedback control the open menu is anchored to (nav = top, foot = bottom). */
  const [feedbackAnchor, setFeedbackAnchor] = useState<"nav" | "foot">("nav");
  // Mobile: feedback opens as a centered modal instead of a bubble-anchored popover.
  const [isMobile, setIsMobile] = useState(false);
  // Bubble width (px); drag left or right edge — no visible handle.
  const [widthPx, setWidthPx] = useState<number | null>(null);
  // Left offset within thread-inner while custom-sized (keeps the opposite edge stable).
  const [leftPx, setLeftPx] = useState<number | null>(null);
  // Collapsed-only body height (px); drag bottom edge.
  const [heightPx, setHeightPx] = useState<number | null>(null);
  /** Hover/drag on either edge lights up both sides. */
  const [edgeHot, setEdgeHot] = useState(false);
  /** Hover/drag on the collapsed bottom edge. */
  const [bottomHot, setBottomHot] = useState(false);
  const edgeDraggingRef = useRef(false);
  const bottomDraggingRef = useRef(false);
  /** Natural/default width to magnet-snap back to while dragging. */
  const defaultWidthRef = useRef<number | null>(null);
  /** Natural/default collapsed body height to magnet-snap back to. */
  const defaultHeightRef = useRef<number | null>(null);
  /** For AI rows: distance from msg-ai left → bubble left (avatar + gap). */
  const aiChromeRef = useRef(41);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const fbNavRef = useRef<HTMLDivElement>(null);
  const fbFootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setRevealControls(false);
  }, [hideControls]);
  // Height resize is collapsed-only — clear when the bubble expands.
  useEffect(() => {
    if (!collapsed) {
      setHeightPx(null);
      setBottomHot(false);
      defaultHeightRef.current = null;
    }
  }, [collapsed]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 900px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  // Keep a custom-sized bubble inside the free space between rails / drawers.
  useEffect(() => {
    if (widthPx == null || leftPx == null) return;
    const el = bubbleRef.current;
    if (!el) return;

    const clamp = () => {
      if (edgeDraggingRef.current) return;
      const bubble = bubbleRef.current;
      if (!bubble) return;
      const inner = bubble.closest(".thread-inner") as HTMLElement | null;
      const originLeft = inner?.getBoundingClientRect().left ?? 0;
      const { minLeft, maxRight } = getBubbleResizeBounds(bubble);
      const leftChrome = m.role === "user" ? 0 : aiChromeRef.current;
      const minBubbleLeft = bubbleMinLeft(minLeft, leftChrome);
      const minW = 180;
      const maxW = Math.max(minW, Math.floor(maxRight - minBubbleLeft));
      let nextW = Math.min(Math.max(minW, widthPx), maxW);
      let nextLeftAbs = originLeft + leftPx;
      // Prefer keeping the current left edge; shrink from the right if needed.
      if (nextLeftAbs + nextW > maxRight) {
        nextLeftAbs = maxRight - nextW;
      }
      if (nextLeftAbs < minBubbleLeft) {
        nextLeftAbs = minBubbleLeft;
        nextW = Math.min(nextW, Math.floor(maxRight - minBubbleLeft));
      }
      const nextLeft = Math.round(nextLeftAbs - originLeft);
      if (nextW !== widthPx) setWidthPx(nextW);
      if (nextLeft !== leftPx) setLeftPx(nextLeft);
    };

    clamp();
    const scope = el.closest(".ra-scope") ?? document.documentElement;
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(clamp) : null;
    ro?.observe(scope);
    const main = el.closest(".main");
    if (main) ro?.observe(main);
    window.addEventListener("resize", clamp);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", clamp);
    };
  }, [widthPx, leftPx, m.role]);
  useEffect(() => {
    if (!feedbackEditing || isMobile) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (fbNavRef.current?.contains(t) || fbFootRef.current?.contains(t)) return;
      onOpenFeedback?.();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [feedbackEditing, onOpenFeedback, isMobile]);
  useEffect(() => {
    if (!feedbackEditing) setFeedbackAnchor("nav");
  }, [feedbackEditing]);
  useEffect(() => {
    if (!feedbackEditing || !isMobile) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenFeedback?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [feedbackEditing, isMobile, onOpenFeedback]);
  const controlsVisible = !hideControls || revealControls || feedbackEditing;
  const isUser = m.role === "user";
  const turnId = m.turnId;
  // Tint the bubble once feedback has been left on this message.
  const hasFeedback = (feedbackEntries?.length ?? 0) > 0;
  // Observability/Policy are assistant-only (they inspect the model's work). State
  // + Feedback apply to both the patient and assistant bubble. Fullscreen is for
  // assistant replies (the long ones). All trace views need the turn (turnId).
  const showTrace = !isUser && !!turnId && !!onOpenTrace;
  const showPolicy = !isUser && !!turnId && !!onOpenPolicy;
  // State opens the fields extracted this turn (from the patient message).
  // Shown on both bubbles; on the assistant nav it sits after Policy trace.
  const showStateBtn = !!turnId && !!onOpenState && hasState;
  const showFeedback = !!onOpenFeedback;
  // Fullscreen is available on both patient and assistant bubbles.
  const showFullscreen = !!turnId;
  const showCollapse = !!onToggleCollapse;
  const showCopy = m.text.trim().length > 0;
  // Turn number + Policy/Observability/State/Feedback in the top nav; Feedback also in the footer.
  const showNavActions = showPolicy || showTrace || showStateBtn || showFeedback;
  const showTurnN = turnNumber != null;
  const showNav = showNavActions || showCollapse || showFullscreen || showTurnN || showCopy;
  const showFootActions = showFeedback;
  const currentRating =
    (feedbackEntries ?? []).find((e) => e.signal === "score")?.rating ?? null;

  const toggleFootRating = (value: 1 | -1) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSubmitFeedback) return;
    const next = currentRating === value ? null : value;
    const rest = (feedbackEntries ?? []).filter((entry) => entry.signal !== "score");
    onSubmitFeedback(
      next === null
        ? rest
        : [{ rating: next, signal: "score", comment: "" }, ...rest]
    );
  };

  const openFeedback = (anchor: "nav" | "foot") => (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (feedbackEditing && feedbackAnchor === anchor) {
      onOpenFeedback?.();
      return;
    }
    setFeedbackAnchor(anchor);
    if (!feedbackEditing) onOpenFeedback?.();
  };

  // Remount when score changes from the foot thumbs so the editor stays in sync.
  const feedbackEditorKey = `${currentRating ?? 0}:${(feedbackEntries ?? []).length}`;
  const feedbackEditor =
    showFeedback && feedbackEditing && onSubmitFeedback ? (
      <FeedbackMenuEditor
        key={feedbackEditorKey}
        entries={feedbackEntries ?? []}
        onSave={(entries) => onSubmitFeedback(entries)}
        onCancel={() => onOpenFeedback?.()}
        onRemove={() => onRemoveFeedback?.()}
      />
    ) : null;

  const feedbackPopover =
    !isMobile && feedbackEditor ? (
      <div
        className={"bubble-fb-menu" + (feedbackAnchor === "foot" ? " bubble-fb-menu--foot" : "")}
        role="dialog"
        aria-label="Feedback"
        onClick={(e) => e.stopPropagation()}
      >
        {feedbackEditor}
      </div>
    ) : null;

  // Portal into .ra-scope so theme tokens + .fb-* styles still apply.
  const feedbackModalHost =
    typeof document !== "undefined"
      ? document.querySelector(".ra-scope") ?? document.body
      : null;
  const feedbackModal =
    isMobile && feedbackEditor && feedbackModalHost
      ? createPortal(
          <div
            className="bubble-fb-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Feedback"
            onClick={() => onOpenFeedback?.()}
          >
            <div className="bubble-fb-modal" onClick={(e) => e.stopPropagation()}>
              {feedbackEditor}
            </div>
          </div>,
          feedbackModalHost
        )
      : null;

  const navFeedback = showFeedback ? (
    <div className="bubble-fb-wrap" ref={fbNavRef}>
      <button
        type="button"
        className={
          "trace-act" +
          (feedbackEditing && feedbackAnchor === "nav" ? " on" : "") +
          (hasFeedback ? " has-feedback" : "")
        }
        data-tip={feedbackEditing && feedbackAnchor === "nav" ? undefined : "Feedback"}
        aria-label="Feedback"
        aria-expanded={feedbackEditing && feedbackAnchor === "nav"}
        aria-haspopup="dialog"
        onClick={openFeedback("nav")}
      >
        <Ic.Edit size={14} />
      </button>
      {feedbackAnchor === "nav" ? feedbackPopover : null}
    </div>
  ) : null;

  const footFeedback = showFeedback ? (
    <div className="bubble-fb-wrap bubble-fb-wrap--foot" ref={fbFootRef}>
      <button
        type="button"
        className={
          "trace-act" +
          (feedbackEditing && feedbackAnchor === "foot" ? " on" : "") +
          (hasFeedback ? " has-feedback" : "")
        }
        data-tip={feedbackEditing && feedbackAnchor === "foot" ? undefined : "Feedback"}
        aria-label="Feedback"
        aria-expanded={feedbackEditing && feedbackAnchor === "foot"}
        aria-haspopup="dialog"
        onClick={openFeedback("foot")}
      >
        <Ic.Edit size={14} />
      </button>
      {feedbackAnchor === "foot" ? feedbackPopover : null}
    </div>
  ) : null;

  const navActions = showNavActions ? (
    <div className="trace-actions">
      {showPolicy && (
        <button type="button" className="trace-act" data-tip="Policy" aria-label="Policy" onClick={() => onOpenPolicy!(turnId!)}>
          <Ic.Sliders size={14} />
        </button>
      )}
      {showStateBtn && (
        <button type="button" className="trace-act" data-tip="State" aria-label="State" onClick={() => onOpenState!(turnId!)}>
          <Ic.List size={14} />
        </button>
      )}
      {showTrace && (
        <button type="button" className="trace-act" data-tip="Observability" aria-label="Observability" onClick={() => onOpenTrace!(turnId!)}>
          <Ic.Grid size={14} />
        </button>
      )}
      {showFeedback && (showPolicy || showTrace || showStateBtn) ? (
        <span className="trace-act-div" aria-hidden="true">
          |
        </span>
      ) : null}
      {navFeedback}
    </div>
  ) : null;

  const footThumbs = showFeedback && onSubmitFeedback ? (
    <div className="bubble-foot-thumbs" role="group" aria-label="Rating">
      <button
        type="button"
        className={
          "trace-act bubble-foot-thumb" + (currentRating === 1 ? " on" : "")
        }
        data-tip="Thumbs up"
        aria-label="Thumbs up"
        aria-pressed={currentRating === 1}
        onClick={toggleFootRating(1)}
      >
        <Ic.ThumbUp size={14} />
      </button>
      <button
        type="button"
        className={
          "trace-act bubble-foot-thumb" + (currentRating === -1 ? " on" : "")
        }
        data-tip="Thumbs down"
        aria-label="Thumbs down"
        aria-pressed={currentRating === -1}
        onClick={toggleFootRating(-1)}
      >
        <Ic.ThumbDown size={14} />
      </button>
    </div>
  ) : (
    <span />
  );

  const footActions = showFootActions ? (
    <div className="bubble-foot-actions">
      {footThumbs}
      <div className="bubble-foot-feedback">
        <VoiceFeedbackButton
          existing={feedbackEntries ?? []}
          onSubmit={(entries) => onSubmitFeedback?.(entries)}
        />
        {footFeedback}
      </div>
    </div>
  ) : null;

  const collapseBtn = showCollapse ? (
    <button
      type="button"
      className="bubble-collapse"
      data-tip={collapsed ? "Expand" : "Collapse"}
      aria-label={collapsed ? "Expand message" : "Collapse message"}
      onClick={(e) => {
        e.stopPropagation();
        onToggleCollapse?.();
      }}
    >
      <Ic.Chevron size={14} style={collapsed ? undefined : { transform: "rotate(180deg)" }} />
    </button>
  ) : null;

  const fullscreenBtn = showFullscreen ? (
    <button
      type="button"
      className="trace-act bubble-fullscreen"
      data-tip="Fullscreen"
      aria-label="Fullscreen"
      onClick={(e) => {
        e.stopPropagation();
        setFullscreen(true);
      }}
    >
      <Ic.Expand size={14} />
    </button>
  ) : null;

  const copyBtn = showCopy ? (
    <button
      type="button"
      className="trace-act"
      data-tip={copied ? "Copied" : "Copy"}
      aria-label={copied ? "Copied" : "Copy message"}
      onClick={(e) => {
        e.stopPropagation();
        void navigator.clipboard.writeText(m.text).then(
          () => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          },
          () => {}
        );
      }}
    >
      <Ic.Copy size={14} />
    </button>
  ) : null;

  const overlay = fullscreen ? (
    <BubbleFullscreen
      productName={config.productName}
      messages={messages}
      startIndex={messageIndex}
      feedbackMode={feedbackMode}
      feedbackByIdx={feedbackByIdx}
      onSubmitFeedbackAt={onSubmitFeedbackAt ?? (onSubmitFeedback ? (_i, e) => onSubmitFeedback(e) : undefined)}
      onClose={() => setFullscreen(false)}
    />
  ) : null;

  /** Ignore the synthetic click that browsers fire after a resize pointerup. */
  const swallowNextClick = () => {
    const swallow = (ev: MouseEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      window.removeEventListener("click", swallow, true);
    };
    window.addEventListener("click", swallow, true);
    // Safety: drop the listener if no click arrives.
    window.setTimeout(() => window.removeEventListener("click", swallow, true), 50);
  };

  const resetCollapsedSize = () => {
    setWidthPx(null);
    setLeftPx(null);
    setHeightPx(null);
  };
  const isCollapsedResized = collapsed && (widthPx != null || heightPx != null);

  // Body click: expand/collapse — or, if collapsed with a custom size, snap
  // back to the initial one-line collapsed shell instead of expanding.
  const bodyToggleProps = onToggleCollapse
    ? {
        role: "button" as const,
        tabIndex: 0,
        title: isCollapsedResized
          ? "Click to reset size"
          : collapsed
            ? "Click to expand"
            : "Click to collapse",
        onClick: () => {
          if (edgeDraggingRef.current || bottomDraggingRef.current) return;
          const sel = typeof window !== "undefined" ? window.getSelection() : null;
          if (sel && !sel.isCollapsed && (sel.toString() || "").length > 0) return;
          if (typeof window !== "undefined") window.getSelection()?.removeAllRanges();
          if (isCollapsedResized) {
            resetCollapsedSize();
            return;
          }
          onToggleCollapse();
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (isCollapsedResized) {
              resetCollapsedSize();
              return;
            }
            onToggleCollapse();
          }
        },
      }
    : {};

  // When global chrome is hidden, avatar click reveals/hides this bubble's controls.
  const avatarToggleProps = hideControls
    ? {
        type: "button" as const,
        className: "bubble-avatar-toggle" + (revealControls ? " on" : ""),
        title: revealControls ? "Hide controls" : "Show controls",
        "aria-label": revealControls ? "Hide message controls" : "Show message controls",
        "aria-pressed": revealControls,
        onClick: () => setRevealControls((v) => !v),
      }
    : null;

  const shellClass =
    (isUser ? "msg-user" : "bubble") +
    (hasFeedback ? " has-feedback" : "") +
    (collapsed ? " is-collapsed" : "");

  const onWidthDrag = (edge: "left" | "right") => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const el = bubbleRef.current;
    if (!el) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const startX = e.clientX;
    const startRect = el.getBoundingClientRect();
    const startW = startRect.width;
    const inner = el.closest(".thread-inner") as HTMLElement | null;
    // Anchor coords in thread-inner space (fallback: viewport).
    const originLeft = inner?.getBoundingClientRect().left ?? 0;
    const startLeft = leftPx ?? Math.round(startRect.left - originLeft);
    if (leftPx == null) setLeftPx(startLeft);

    if (widthPx == null || defaultWidthRef.current == null) {
      defaultWidthRef.current = startW;
    }
    let correctW = defaultWidthRef.current;
    if (!isUser) {
      const msgAi = el.closest(".msg-ai");
      if (msgAi) {
        aiChromeRef.current = Math.max(
          0,
          Math.round(startRect.left - msgAi.getBoundingClientRect().left)
        );
      }
      if (inner) {
        const chrome = aiChromeRef.current;
        // Exclude the always-reserved reset gutter so snap-back matches default width.
        correctW = Math.max(180, Math.floor(inner.clientWidth - chrome - RESET_GUTTER));
        if (widthPx == null) defaultWidthRef.current = correctW;
      }
    }
    const SNAP = 18;
    const minW = 180;
    const startCenter = startRect.left + startW / 2;
    let lastW = startW;
    edgeDraggingRef.current = true;
    setEdgeHot(true);
    document.body.classList.add("ra-resizing");
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      // Re-read bounds each move so opening/resizing a drawer clamps live.
      const bounds = getBubbleResizeBounds(el);
      // AI rows position the whole msg-ai (avatar + bubble). Reserve chrome so
      // the avatar never slides under the left rail.
      const minBubbleLeft = bubbleMinLeft(
        bounds.minLeft,
        isUser ? 0 : aiChromeRef.current
      );
      const liveMaxW = Math.max(minW, Math.floor(bounds.maxRight - minBubbleLeft));
      // Either edge: grow/shrink equally from the center.
      const growth = edge === "right" ? dx : -dx;
      let nextW = Math.round(Math.max(minW, Math.min(liveMaxW, startW + 2 * growth)));
      if (Math.abs(nextW - correctW) <= SNAP) nextW = correctW;
      let nextLeftAbs = startCenter - nextW / 2;
      nextLeftAbs = Math.max(
        minBubbleLeft,
        Math.min(bounds.maxRight - nextW, nextLeftAbs)
      );
      const nextLeft = Math.round(nextLeftAbs - originLeft);
      lastW = nextW;
      setWidthPx(nextW);
      setLeftPx(nextLeft);
    };
    const onUp = () => {
      edgeDraggingRef.current = false;
      setEdgeHot(false);
      document.body.classList.remove("ra-resizing");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      swallowNextClick();
      if (Math.abs(lastW - correctW) <= SNAP) {
        setWidthPx(null);
        setLeftPx(null);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const edgeHit = (edge: "left" | "right") => (
    <div
      aria-hidden
      className={"bubble-edge-resize bubble-edge-resize--" + edge}
      onPointerDown={onWidthDrag(edge)}
      onPointerEnter={() => setEdgeHot(true)}
      onPointerLeave={() => {
        if (!edgeDraggingRef.current) setEdgeHot(false);
      }}
    />
  );

  const onHeightDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!collapsed) return;
    const body = bodyRef.current;
    if (!body) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const startY = e.clientY;
    const startH = body.getBoundingClientRect().height;
    if (heightPx == null || defaultHeightRef.current == null) {
      defaultHeightRef.current = startH;
    }
    const correctH = defaultHeightRef.current;
    const SNAP = 14;
    const minH = Math.max(28, Math.round(correctH));
    const maxH = Math.max(minH, Math.round(window.innerHeight * 0.5));
    let lastH = startH;
    bottomDraggingRef.current = true;
    setBottomHot(true);
    document.body.classList.add("ra-resizing-y");
    const onMove = (ev: PointerEvent) => {
      const dy = ev.clientY - startY;
      let nextH = Math.round(Math.max(minH, Math.min(maxH, startH + dy)));
      if (Math.abs(nextH - correctH) <= SNAP) nextH = correctH;
      lastH = nextH;
      setHeightPx(nextH === correctH ? null : nextH);
    };
    const onUp = () => {
      bottomDraggingRef.current = false;
      setBottomHot(false);
      document.body.classList.remove("ra-resizing-y");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      swallowNextClick();
      if (Math.abs(lastH - correctH) <= SNAP) setHeightPx(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const bottomHit = collapsed ? (
    <div
      aria-hidden
      className="bubble-edge-resize bubble-edge-resize--bottom"
      onPointerDown={onHeightDrag}
      onPointerEnter={() => setBottomHot(true)}
      onPointerLeave={() => {
        if (!bottomDraggingRef.current) setBottomHot(false);
      }}
    />
  ) : null;

  const widthStyle =
    widthPx != null
      ? { width: widthPx, maxWidth: "none", flex: "0 0 auto" as const }
      : null;
  const isHeightExpanded = collapsed && heightPx != null;
  const bodyHeightStyle = isHeightExpanded
    ? { height: heightPx, maxHeight: heightPx }
    : undefined;

  const shell = (
    <div
      ref={bubbleRef}
      className={
        shellClass +
        (!controlsVisible ? " hide-controls" : "") +
        (edgeHot ? " is-edge-hot" : "") +
        (bottomHot ? " is-bottom-hot" : "") +
        (isHeightExpanded ? " is-height-resized" : "")
      }
      style={{
        position: "relative",
        ...widthStyle,
      }}
    >
      {controlsVisible && (collapsed ? showCollapse : showNav) && (
        <div
          className={"bubble-nav" + (onToggleCollapse ? " is-toggle-nav" : "")}
          onClick={
            onToggleCollapse
              ? (e) => {
                  // Only empty nav chrome toggles — ignore clicks on buttons/links.
                  const t = e.target as HTMLElement | null;
                  if (t?.closest("button, a, input, textarea, select, [role='button']")) return;
                  if (edgeDraggingRef.current || bottomDraggingRef.current) return;
                  if (isCollapsedResized) {
                    resetCollapsedSize();
                    return;
                  }
                  onToggleCollapse();
                }
              : undefined
          }
        >
          {/* Collapsed: only the expand caret. Expanded: empty nav space collapses. */}
          {!collapsed && showTurnN ? <span className="trace-turn-n">{turnNumber}.</span> : null}
          {!collapsed ? navActions : null}
          <div className="bubble-nav-end">
            {!collapsed ? copyBtn : null}
            {!collapsed ? fullscreenBtn : null}
            {collapseBtn}
          </div>
        </div>
      )}
      <div
        ref={bodyRef}
        className={"bubble-body" + (onToggleCollapse ? " is-toggleable" : "")}
        style={bodyHeightStyle}
        {...bodyToggleProps}
      >
            {collapsed ? (
          <>
            {isUser && showTurnN ? (
              <span className="bubble-collapse-turn">{turnNumber}. </span>
            ) : null}
            {isUser ? (
              <span className="bubble-collapsed-preview">{collapsedPlainPreview(m.text)}</span>
            ) : looksLikeWorksheet(m.text) ? (
              <span className="bubble-form-collapsed">
                {(() => {
                  const n = worksheetSectionCount(m.text);
                  return n > 0 ? `Fill-in worksheet · ${n} sections` : "Fill-in worksheet";
                })()}
              </span>
            ) : (
              <span className="bubble-collapsed-preview">{collapsedPlainPreview(m.text)}</span>
            )}
          </>
        ) : (
          <BubbleMarkdown>{m.text}</BubbleMarkdown>
        )}
      </div>
      {controlsVisible && !collapsed && footActions && <div className="bubble-foot">{footActions}</div>}
      {edgeHit("left")}
      {edgeHit("right")}
      {bottomHit}
    </div>
  );

  const isWidthExpanded = widthPx != null;
  const resetBubbleWidth = () => {
    setWidthPx(null);
    setLeftPx(null);
  };
  // Lives in the always-reserved right gutter — showing it must not change bubble width.
  const resetWidthBtn = isWidthExpanded ? (
    <button
      type="button"
      className="bubble-width-reset"
      aria-label="Reset bubble width"
      title="Reset width"
      onClick={resetBubbleWidth}
    >
      <Ic.Minimize size={13} stroke={1.7} />
    </button>
  ) : null;

  const shellWithReset = (
    <>
      {shell}
      {resetWidthBtn}
    </>
  );

  // border-box width = bubble shell + reserved reset gutter.
  const colWidth = isWidthExpanded && widthPx != null ? widthPx + RESET_GUTTER : undefined;

  if (isUser) {
    return (
      <div
        className="msg-user-col"
        style={
          isWidthExpanded
            ? {
                width: colWidth,
                maxWidth: "none",
                alignSelf: "flex-start",
                marginLeft: leftPx ?? undefined,
                overflow: "visible",
              }
            : undefined
        }
      >
        {shellWithReset}
        {overlay}
        {feedbackModal}
      </div>
    );
  }

  return (
    <div
      className="msg-ai"
      style={
        isWidthExpanded && leftPx != null
          ? {
              alignSelf: "flex-start",
              maxWidth: "none",
              width: "auto",
              overflow: "visible",
              // Position the row so the bubble's left edge matches leftPx.
              marginLeft: leftPx - aiChromeRef.current,
            }
          : undefined
      }
    >
      {avatarToggleProps ? (
        <button {...avatarToggleProps}>
          <AssistantMark variant="bubble" config={config} />
        </button>
      ) : (
        <AssistantMark variant="bubble" config={config} />
      )}
      <div
        className="bubble-col"
        style={
          isWidthExpanded
            ? {
                flex: "0 0 auto",
                width: colWidth,
                maxWidth: "none",
                overflow: "visible",
              }
            : undefined
        }
      >
        {shellWithReset}
      </div>
      {overlay}
      {feedbackModal}
    </div>
  );
}
