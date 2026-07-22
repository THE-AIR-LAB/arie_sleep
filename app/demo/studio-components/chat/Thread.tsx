"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { FeedbackEntry } from "../FeedbackControls";
import { AssistantMark } from "./AssistantMark";
import { Bubble } from "./Bubble";
import { MessageRow } from "./MessageRow";
import type { Message, StudioChatConfig } from "./types";

export function Thread({
  config,
  messages,
  typing,
  typingLabel,
  streaming,
  feedbackMode,
  feedbackByIdx,
  editingIdx,
  onToggleFeedback,
  onSaveFeedback,
  onRemoveFeedback,
  onOpenTrace,
  onOpenPolicy,
  onOpenState,
  stateTurnIds,
  allowFeedback,
  collapsedByIdx,
  setCollapsedByIdx,
  hideBubbleControls,
  scrollAnchor = "end",
  highlightFeedback = false,
}: {
  config: Pick<StudioChatConfig, "productName" | "assistantMark" | "avatarMono" | "avatarSrc" | "emptyStateHref">;
  messages: Message[];
  typing: boolean;
  typingLabel: string;
  streaming: string;
  feedbackMode: boolean;
  feedbackByIdx: Record<number, FeedbackEntry[]>;
  editingIdx: number | null;
  onToggleFeedback: (index: number) => void;
  onSaveFeedback: (index: number, entries: FeedbackEntry[]) => void;
  onRemoveFeedback: (index: number) => void;
  onOpenTrace?: (turnId: string) => void;
  onOpenPolicy?: (turnId: string) => void;
  onOpenState?: (turnId: string) => void;
  /** Turn ids that extracted at least one piece of state (drives the State button). */
  stateTurnIds?: Set<string>;
  /** Gates the per-reply Feedback button (admin-only, like the other panels). */
  allowFeedback?: boolean;
  collapsedByIdx: Record<number, boolean>;
  setCollapsedByIdx: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  hideBubbleControls: boolean;
  /** Simulations open at the first bubble; normal chats follow the latest. */
  scrollAnchor?: "start" | "end";
  /** When on, bubbles with feedback paint the green highlight. */
  highlightFeedback?: boolean;
}) {
  const threadRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<number, HTMLDivElement>());
  // When expanding/collapsing one bubble, keep its viewport Y stable.
  const collapseAnchorRef = useRef<{ index: number; top: number } | null>(null);

  // Keep simulation runs pinned to turn 1 on load — not on every collapse toggle.
  useLayoutEffect(() => {
    if (scrollAnchor !== "start" || messages.length === 0) return;
    if (collapseAnchorRef.current) return;
    const root = threadRef.current;
    if (!root) return;
    const pin = () => {
      root.scrollTop = 0;
    };
    pin();
    const outer = requestAnimationFrame(() => {
      pin();
      requestAnimationFrame(pin);
    });
    return () => cancelAnimationFrame(outer);
  }, [scrollAnchor, messages]);

  // After a bubble expand/collapse, compensate so the row stays where it was on screen.
  useLayoutEffect(() => {
    const pending = collapseAnchorRef.current;
    if (!pending) return;
    collapseAnchorRef.current = null;
    const root = threadRef.current;
    const row = rowRefs.current.get(pending.index);
    if (!root || !row) return;
    const adjust = () => {
      const delta = row.getBoundingClientRect().top - pending.top;
      if (delta) root.scrollTop += delta;
    };
    adjust();
    const id = requestAnimationFrame(adjust);
    return () => cancelAnimationFrame(id);
  }, [collapsedByIdx]);

  // Auto-scroll to the latest message as the conversation grows — but NOT when
  // a feedback editor opens (editingIdx), or it would jump away from the bubble
  // you just clicked. The editor renders inline under that bubble, already in view.
  // Simulations stay at the start until the parent flips the anchor (e.g. live typing).
  useEffect(() => {
    if (scrollAnchor === "start") return;
    const root = threadRef.current;
    if (root) {
      root.scrollTop = root.scrollHeight;
      return;
    }
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, typing, streaming, scrollAnchor]);

  const toggleCollapseAt = (index: number) => {
    const row = rowRefs.current.get(index);
    if (row) {
      collapseAnchorRef.current = {
        index,
        top: row.getBoundingClientRect().top,
      };
    } else {
      collapseAnchorRef.current = null;
    }
    // Blur so the browser doesn't scroll the focused control into view after grow.
    const active = typeof document !== "undefined" ? document.activeElement : null;
    if (active instanceof HTMLElement && threadRef.current?.contains(active)) {
      active.blur();
    }
    setCollapsedByIdx((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // 1-based turn numbers for assistant replies (shared with the patient turn id).
  const turnNumberById = useMemo(() => {
    const map = new Map<string, number>();
    let n = 0;
    for (const m of messages) {
      if (m.role === "ai" && m.turnId && !map.has(m.turnId)) {
        map.set(m.turnId, ++n);
      }
    }
    return map;
  }, [messages]);
  return (
    <div
      className={"thread" + (highlightFeedback ? " show-feedback-hl" : "")}
      ref={threadRef}
    >
      <div className="thread-inner">
        {messages.map((m, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) rowRefs.current.set(i, el);
              else rowRefs.current.delete(i);
            }}
          >
          <MessageRow
            config={config}
            m={m}
            index={i}
            messages={messages}
            feedbackMode={feedbackMode}
            entries={feedbackByIdx[i] ?? []}
            feedbackByIdx={feedbackByIdx}
            editing={editingIdx === i}
            onToggle={onToggleFeedback}
            onSave={onSaveFeedback}
            onRemove={onRemoveFeedback}
            onOpenTrace={onOpenTrace}
            onOpenPolicy={onOpenPolicy}
            onOpenState={onOpenState}
            hasState={!!m.turnId && !!stateTurnIds?.has(m.turnId)}
            allowFeedback={allowFeedback}
            collapsed={!!collapsedByIdx[i]}
            onToggleCollapse={() => toggleCollapseAt(i)}
            hideControls={hideBubbleControls}
            turnNumber={m.turnId ? turnNumberById.get(m.turnId) : undefined}
          />
          </div>
        ))}
        {streaming && <Bubble config={config} m={{ role: "ai", text: streaming }} />}
        {typing && !streaming && (
          <div className="typing">
            <AssistantMark variant="bubble" config={config} />
            <div className="typing-status">{typingLabel || "Thinking…"}</div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
