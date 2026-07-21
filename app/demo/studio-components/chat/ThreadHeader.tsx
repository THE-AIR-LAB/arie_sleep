"use client";

import { AssistantMark } from "./AssistantMark";
import { ThreadControls } from "./ThreadControls";
import type { StudioChatConfig } from "./types";

export function ThreadHeader({
  config,
  showThreadControls = false,
  allCollapsed = false,
  onToggleCollapseAll,
  hideBubbleControls = true,
  onToggleHideBubbleControls,
}: {
  config: Pick<StudioChatConfig, "productName" | "assistantMark" | "avatarMono" | "emptyStateHref">;
  showThreadControls?: boolean;
  allCollapsed?: boolean;
  onToggleCollapseAll?: () => void;
  hideBubbleControls?: boolean;
  onToggleHideBubbleControls?: () => void;
}) {
  return (
    <div className="thread-head">
      <AssistantMark variant="th" config={config} />
      <div className="th-meta">
        <div className="th-name">{config.productName}</div>
      </div>
      {showThreadControls && (
        <ThreadControls
          allCollapsed={allCollapsed}
          onToggleCollapseAll={onToggleCollapseAll}
          hideBubbleControls={hideBubbleControls}
          onToggleHideBubbleControls={onToggleHideBubbleControls}
        />
      )}
    </div>
  );
}
