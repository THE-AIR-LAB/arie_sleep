"use client";

/* ---------------- thread pieces ---------------- */
/* Show/Hide controls + Collapse all — in the ThreadHeader, next to the title. */
export function ThreadControls({
  allCollapsed = false,
  onToggleCollapseAll,
  hideBubbleControls = true,
  onToggleHideBubbleControls,
}: {
  allCollapsed?: boolean;
  onToggleCollapseAll?: () => void;
  hideBubbleControls?: boolean;
  onToggleHideBubbleControls?: () => void;
}) {
  return (
    <div className="thread-head-controls">
      <div className="composer-thread-controls-left">
        <button
          type="button"
          className={"thread-collapse-all" + (hideBubbleControls ? " on" : "")}
          onClick={onToggleHideBubbleControls}
          title={
            hideBubbleControls
              ? "Show bubble nav and footer"
              : "Hide bubble nav and footer"
          }
        >
          <span className="thread-pill-swap">
            <span className={hideBubbleControls ? "is-active" : ""} aria-hidden={!hideBubbleControls}>
              Show controls
            </span>
            <span className={!hideBubbleControls ? "is-active" : ""} aria-hidden={hideBubbleControls}>
              Hide controls
            </span>
          </span>
        </button>
        <button
          type="button"
          className="thread-collapse-all"
          onClick={onToggleCollapseAll}
          title={allCollapsed ? "Expand every message" : "Collapse every message to one line"}
        >
          <span className="thread-pill-swap">
            <span className={allCollapsed ? "is-active" : ""} aria-hidden={!allCollapsed}>
              Expand all
            </span>
            <span className={!allCollapsed ? "is-active" : ""} aria-hidden={allCollapsed}>
              Collapse all
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
