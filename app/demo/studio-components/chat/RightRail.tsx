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
}) {
  return (
    <aside
      className={"right-rail" + (floating ? " floating" : "")}
      style={floating && rightOffset != null ? { right: rightOffset } : undefined}
    >
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
      {/* Workflow launcher, docked in the rail directly under the drawer icon.
          Hidden while the workflow is open (it has its own × to close). */}
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
    </aside>
  );
}
