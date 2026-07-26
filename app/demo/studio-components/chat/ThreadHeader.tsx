"use client";

import { useEffect, useState } from "react";
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
  // Title stays desktop-only; mobile pill is avatar-only.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 900px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const hideMeta = avatarOnly || isMobile;

  return (
    <div
      className={"thread-head" + (hideMeta ? " is-avatar-only" : "")}
    >
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
        </div>
      )}
    </div>
  );
}
