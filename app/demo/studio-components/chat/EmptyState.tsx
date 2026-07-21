"use client";

import { Ic } from "../ra-icons";
import { AssistantMark } from "./AssistantMark";
import type { StudioChatConfig } from "./types";

/**
 * `compact` collapses the empty state to just the assistant mark (used while
 * the canvas drawer is open, so the mark stays but the copy + suggestions are
 * hidden).
 */
export function EmptyState({
  config,
  onSuggest,
  onUpload,
  compact = false,
}: {
  config: Pick<StudioChatConfig, "assistantMark" | "avatarMono" | "avatarSrc" | "emptyStateHref" | "emptyStateTitle" | "emptyStateBody" | "suggestions">;
  onSuggest: (t: string) => void;
  onUpload?: () => void;
  compact?: boolean;
}) {
  return (
    <div className={"empty" + (compact ? " compact" : "")}>
      <AssistantMark variant="empty" config={config} />
      {!compact && (
        <>
          <div className="empty-title">{config.emptyStateTitle ?? "Start a conversation"}</div>
          <div className="empty-sub">{config.emptyStateBody}</div>
          <div className="suggests">
            {config.suggestions.map((s) => {
              const I = Ic[s.icon as keyof typeof Ic];
              return (
                <button key={s.label} className="sug-chip" onClick={() => onSuggest(s.label)}>
                  <span className="ic"><I size={13} /></span>{s.label}
                </button>
              );
            })}
          </div>
          {onUpload && (
            <button type="button" className="empty-upload" onClick={onUpload}>
              <span className="ic"><Ic.Upload size={13} /></span>
              Upload files
            </button>
          )}
        </>
      )}
    </div>
  );
}
