"use client";

import { Ic } from "../ra-icons";

/* ---------------- compact (collapsed) right drawer rail ---------------- */
export function RightRail({
  panelOpen,
  onTogglePanel,
  isAdmin,
  canvasOpen,
  onToggleCanvas,
  floating = false,
  rightOffset,
  showCollapseAll = false,
  allCollapsed = false,
  onToggleCollapseAll,
}: {
  panelOpen: boolean;
  onTogglePanel: () => void;
  isAdmin: boolean;
  canvasOpen: boolean;
  onToggleCanvas: () => void;
  /** When a right drawer is open, the rail floats at the drawer's left edge
   *  (`rightOffset` px from the body's right edge) instead of docking as a flex
   *  column, and follows the drawer as its width is resized. */
  floating?: boolean;
  rightOffset?: number;
  showCollapseAll?: boolean;
  allCollapsed?: boolean;
  onToggleCollapseAll?: () => void;
}) {
  return (
    <aside
      className={"right-rail" + (floating ? " floating" : "")}
      style={floating && rightOffset != null ? { right: rightOffset } : undefined}
    >
      {!canvasOpen && (
        <button
          className="rail-btn"
          data-tip="Workflow"
          aria-label="Open workflow"
          onClick={onToggleCanvas}
        >
          <Ic.Workflow size={18} />
        </button>
      )}
      {/* Panel icon opens the right drawer. Hidden once it's open — the drawer
          has its own × to close, so the launcher would be redundant. */}
      {isAdmin && !panelOpen && (
        <button
          className="rail-btn"
          data-tip="Model Setup"
          aria-label="Open Model Setup"
          onClick={onTogglePanel}
        >
          <Ic.Panel size={18} />
        </button>
      )}
      {/* Collapse-all sits at the bottom of the rail icon stack. */}
      {showCollapseAll && (
        <button
          className="rail-btn"
          data-tip={allCollapsed ? "Expand all" : "Collapse all"}
          aria-label={allCollapsed ? "Expand all messages" : "Collapse all messages"}
          onClick={onToggleCollapseAll}
        >
          <Ic.Chevron
            size={18}
            style={allCollapsed ? undefined : { transform: "rotate(180deg)" }}
          />
        </button>
      )}
    </aside>
  );
}
