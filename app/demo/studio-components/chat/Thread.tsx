"use client";

import React, { useEffect, useMemo, useRef } from "react";
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
}) {
  const endRef = useRef<HTMLDivElement>(null);
  // Auto-scroll to the latest message as the conversation grows — but NOT when
  // a feedback editor opens (editingIdx), or it would jump away from the bubble
  // you just clicked. The editor renders inline under that bubble, already in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, typing, streaming]);
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
    <div className="thread">
      <div className="thread-inner">
        {messages.map((m, i) => (
          <MessageRow
            key={i}
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
            onToggleCollapse={() =>
              setCollapsedByIdx((prev) => ({ ...prev, [i]: !prev[i] }))
            }
            hideControls={hideBubbleControls}
            turnNumber={m.turnId ? turnNumberById.get(m.turnId) : undefined}
          />
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
