"use client";

import { FeedbackControls, type FeedbackEntry } from "../FeedbackControls";
import { Bubble } from "./Bubble";
import type { Message, StudioChatConfig } from "./types";

export function MessageRow({
  config,
  m,
  index,
  messages,
  feedbackMode,
  entries,
  feedbackByIdx,
  editing,
  onToggle,
  onSave,
  onRemove,
  onOpenTrace,
  onOpenPolicy,
  onOpenState,
  hasState,
  allowFeedback,
  collapsed,
  onToggleCollapse,
  hideControls,
  turnNumber,
}: {
  config: Pick<StudioChatConfig, "productName" | "assistantMark" | "avatarMono" | "emptyStateHref">;
  m: Message;
  index: number;
  messages: Message[];
  feedbackMode: boolean;
  entries: FeedbackEntry[];
  feedbackByIdx: Record<number, FeedbackEntry[]>;
  editing: boolean;
  onToggle: (index: number) => void;
  onSave: (index: number, entries: FeedbackEntry[]) => void;
  onRemove: (index: number) => void;
  onOpenTrace?: (turnId: string) => void;
  onOpenPolicy?: (turnId: string) => void;
  onOpenState?: (turnId: string) => void;
  hasState?: boolean;
  allowFeedback?: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  hideControls: boolean;
  turnNumber?: number;
}) {
  return (
    <div className="msg-block">
      <Bubble
        config={config}
        m={m}
        messageIndex={index}
        messages={messages}
        feedbackByIdx={feedbackByIdx}
        onOpenTrace={onOpenTrace}
        onOpenPolicy={onOpenPolicy}
        onOpenState={onOpenState}
        hasState={hasState}
        // The Feedback button opens the editor inline for this message (patient or assistant).
        onOpenFeedback={allowFeedback ? () => onToggle(index) : undefined}
        // In feedback mode the fullscreen view can edit + submit the reply as feedback.
        feedbackMode={feedbackMode}
        feedbackEntries={entries}
        onSubmitFeedback={allowFeedback ? (e) => onSave(index, e) : undefined}
        onSubmitFeedbackAt={allowFeedback ? onSave : undefined}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        hideControls={hideControls}
        turnNumber={turnNumber}
      />
      <FeedbackControls
        mode={feedbackMode}
        entries={entries}
        editing={editing}
        align={m.role === "user" ? "right" : "left"}
        onToggle={() => onToggle(index)}
        onSave={(e) => onSave(index, e)}
        onRemove={() => onRemove(index)}
      />
    </div>
  );
}
