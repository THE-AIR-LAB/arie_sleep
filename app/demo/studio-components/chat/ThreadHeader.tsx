"use client";

import { AssistantMark } from "./AssistantMark";
import type { StudioChatConfig } from "./types";

export function ThreadHeader({
  config,
  avatarOnly = false,
  onToggleAvatarOnly,
}: {
  config: Pick<
    StudioChatConfig,
    "productName" | "assistantMark" | "avatarMono" | "avatarSrc" | "emptyStateHref"
  >;
  /** @deprecated Kept for call-site compat. */
  showThreadControls?: boolean;
  hideBubbleControls?: boolean;
  onToggleHideBubbleControls?: () => void;
  allCollapsed?: boolean;
  onToggleCollapseAll?: () => void;
  avatarOnly?: boolean;
  onToggleAvatarOnly?: () => void;
  showFeedbackToggle?: boolean;
  highlightFeedback?: boolean;
  onToggleHighlightFeedback?: () => void;
}) {
  return (
    <div
      className={"thread-head" + (avatarOnly ? " is-avatar-only" : "")}
    >
      <button
        type="button"
        className="th-avatar-toggle"
        onClick={() => onToggleAvatarOnly?.()}
        title={avatarOnly ? "Expand header" : "Collapse to avatar"}
        aria-label={avatarOnly ? "Expand header" : "Collapse to avatar"}
        aria-expanded={!avatarOnly}
      >
        <AssistantMark variant="th" config={config} />
      </button>
      {!avatarOnly && (
        <div className="th-meta">
          <div className="th-name">{config.productName}</div>
        </div>
      )}
    </div>
  );
}
