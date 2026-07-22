"use client";

import { useEffect, useRef, useState } from "react";
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
  const fbNavRef = useRef<HTMLDivElement>(null);
  const fbFootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setRevealControls(false);
  }, [hideControls]);
  useEffect(() => {
    if (!feedbackEditing) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (fbNavRef.current?.contains(t) || fbFootRef.current?.contains(t)) return;
      onOpenFeedback?.();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [feedbackEditing, onOpenFeedback]);
  useEffect(() => {
    if (!feedbackEditing) setFeedbackAnchor("nav");
  }, [feedbackEditing]);
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

  const openFeedback = (anchor: "nav" | "foot") => (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (feedbackEditing && feedbackAnchor === anchor) {
      onOpenFeedback?.();
      return;
    }
    setFeedbackAnchor(anchor);
    if (!feedbackEditing) onOpenFeedback?.();
  };

  const feedbackMenu =
    showFeedback && feedbackEditing && onSubmitFeedback ? (
      <div
        className={"bubble-fb-menu" + (feedbackAnchor === "foot" ? " bubble-fb-menu--foot" : "")}
        role="dialog"
        aria-label="Feedback"
        onClick={(e) => e.stopPropagation()}
      >
        <FeedbackMenuEditor
          entries={feedbackEntries ?? []}
          onSave={(entries) => onSubmitFeedback(entries)}
          onCancel={() => onOpenFeedback?.()}
          onRemove={() => onRemoveFeedback?.()}
        />
      </div>
    ) : null;

  const navFeedback = showFeedback ? (
    <div className="bubble-fb-wrap" ref={fbNavRef}>
      <button
        type="button"
        className={"trace-act" + (feedbackEditing && feedbackAnchor === "nav" ? " on" : "")}
        data-tip={feedbackEditing && feedbackAnchor === "nav" ? undefined : "Feedback"}
        aria-label="Feedback"
        aria-expanded={feedbackEditing && feedbackAnchor === "nav"}
        aria-haspopup="dialog"
        onClick={openFeedback("nav")}
      >
        <Ic.Edit size={14} />
      </button>
      {feedbackAnchor === "nav" ? feedbackMenu : null}
    </div>
  ) : null;

  const footFeedback = showFeedback ? (
    <div className="bubble-fb-wrap bubble-fb-wrap--foot" ref={fbFootRef}>
      <button
        type="button"
        className={"trace-act" + (feedbackEditing && feedbackAnchor === "foot" ? " on" : "")}
        data-tip={feedbackEditing && feedbackAnchor === "foot" ? undefined : "Feedback"}
        aria-label="Feedback"
        aria-expanded={feedbackEditing && feedbackAnchor === "foot"}
        aria-haspopup="dialog"
        onClick={openFeedback("foot")}
      >
        <Ic.Edit size={14} />
      </button>
      {feedbackAnchor === "foot" ? feedbackMenu : null}
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

  const footActions = showFootActions ? (
    <div className="bubble-foot-actions">
      <span />
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

  // Body click only expands/collapses — never reveals per-bubble controls.
  const bodyToggleProps = onToggleCollapse
    ? {
        role: "button" as const,
        tabIndex: 0,
        title: collapsed ? "Click to expand" : "Click to collapse",
        onClick: () => {
          const sel = typeof window !== "undefined" ? window.getSelection() : null;
          if (sel && !sel.isCollapsed && (sel.toString() || "").length > 0) return;
          if (typeof window !== "undefined") window.getSelection()?.removeAllRanges();
          onToggleCollapse();
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
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

  const shell = (
    <div className={shellClass + (!controlsVisible ? " hide-controls" : "")}>
      {controlsVisible && showNav && (
        <div className="bubble-nav">
          {showTurnN && !collapsed ? <span className="trace-turn-n">{turnNumber}.</span> : null}
          {navActions}
          <div className="bubble-nav-end">
            {copyBtn}
            {fullscreenBtn}
            {collapseBtn}
          </div>
        </div>
      )}
      <div
        className={"bubble-body" + (onToggleCollapse ? " is-toggleable" : "")}
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
        ) : isUser ? (
          m.text
        ) : (
          <BubbleMarkdown>{m.text}</BubbleMarkdown>
        )}
      </div>
      {controlsVisible && footActions && <div className="bubble-foot">{footActions}</div>}
    </div>
  );

  if (isUser) {
    return (
      <div className="msg-user-col">
        {shell}
        {overlay}
      </div>
    );
  }
  return (
    <div className="msg-ai">
      {avatarToggleProps ? (
        <button {...avatarToggleProps}>
          <AssistantMark variant="bubble" config={config} />
        </button>
      ) : (
        <AssistantMark variant="bubble" config={config} />
      )}
      <div className="bubble-col">
        {shell}
      </div>
      {overlay}
    </div>
  );
}
