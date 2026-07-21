"use client";

import { AssistantMark } from "./AssistantMark";
import type { StudioChatConfig } from "./types";

export function ThreadHeader({
  config,
}: {
  config: Pick<StudioChatConfig, "productName" | "assistantMark" | "avatarMono" | "avatarSrc" | "emptyStateHref">;
}) {
  return (
    <div className="thread-head">
      <AssistantMark variant="th" config={config} />
      <div className="th-meta">
        <div className="th-name">{config.productName}</div>
      </div>
    </div>
  );
}
