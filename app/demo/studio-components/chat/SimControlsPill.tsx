"use client";

import { Ic } from "../ra-icons";
import type { SimRunControls } from "../SimulationPanel";

/* Shared Pause / Stop / collapse pill — used in the drawer tab bar and as the
   floating control when the drawer is closed mid-run. */
export function SimControlsPill({
  controls,
  collapsed,
  onToggleCollapsed,
  floating = false,
}: {
  controls: SimRunControls;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  floating?: boolean;
}) {
  return (
    <div
      className={"sim-controls-pill" + (collapsed ? " is-collapsed" : "") + (floating ? " is-floating" : "")}
      role="toolbar"
      aria-label="Simulation controls"
    >
      {collapsed ? (
        <button
          type="button"
          className="sim-controls-pill-btn"
          title={controls.paused ? "Show simulation controls (paused)" : "Show simulation controls"}
          aria-label={controls.paused ? "Show simulation controls (paused)" : "Show simulation controls"}
          aria-expanded={false}
          onClick={onToggleCollapsed}
        >
          <span>{controls.paused ? "Paused" : "Running"}</span>
          <Ic.Chevron size={14} style={{ transform: "rotate(180deg)" }} />
        </button>
      ) : (
        <>
          {controls.paused ? (
            <button type="button" className="sim-controls-pill-btn" onClick={controls.resume}>Resume</button>
          ) : (
            <button type="button" className="sim-controls-pill-btn" onClick={controls.pause}>Pause</button>
          )}
          <button type="button" className="sim-controls-pill-btn" onClick={controls.stop}>Stop</button>
          <button
            type="button"
            className="sim-controls-pill-btn"
            title="Collapse simulation controls"
            aria-label="Collapse simulation controls"
            aria-expanded={true}
            onClick={onToggleCollapsed}
          >
            <Ic.Chevron size={14} />
          </button>
        </>
      )}
    </div>
  );
}
