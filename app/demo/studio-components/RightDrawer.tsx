"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Turn } from "../../components/trace/TraceView";
import { ObservabilityContent } from "./ObservabilityPanel";
import { ExpertChatContent } from "./ExpertChatPanel";
import { UploadContent } from "./UploadPanel";

/** Mobile bottom-sheet height (vh). Free drag between these bounds. */
const SHEET_DEFAULT_VH = 70;
const SHEET_MIN_VH = 18;
const SHEET_MAX_VH = 100;
/** Release below this to dismiss the sheet. */
const SHEET_DISMISS_VH = 28;

/**
 * A single right-docked drawer that hosts the secondary panels (Observability,
 * Expert chat, Upload). When more than one is open they appear as TABS in this
 * one window instead of stacking as separate panels.
 *
 * All open panes stay mounted (the inactive ones are display:none) so their
 * state — drafts, dropped files, scroll position — is preserved when switching
 * tabs. The drawer docks as a flex sibling of the chat <main> on desktop and
 * becomes a full-screen overlay on mobile.
 */

export type DrawerId =
  | "observability"
  | "modelsetup"
  | "simulation"
  | "expert"
  | "upload"
  | "chats"
  | "account";

export const DRAWER_LABEL: Record<DrawerId, string> = {
  chats: "Chats",
  observability: "Observability",
  modelsetup: "Model Setup",
  simulation: "Simulation",
  expert: "Expert",
  upload: "Upload",
  account: "Account",
};

// On mobile the drawer shows the full set of function tabs (scrollable) so you
// can switch between them, regardless of which icon opened it. On desktop it
// keeps the "open subset as tabs" model.
const ALL_TABS: DrawerId[] = [
  "modelsetup",
  "simulation",
  "observability",
  "chats",
  "account",
  // "expert",
  // "upload",
];

// Panels that expose internal wiring (model/prompt setup, step-by-step traces).
// Hidden from non-admins on every surface (desktop tabs and the mobile sheet).
const ADMIN_ONLY_DRAWERS: DrawerId[] = ["observability", "modelsetup", "simulation"];

function useIsMobile(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(max-width: 900px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(max-width: 900px)").matches,
    () => false
  );
}

export function RightDrawer({
  open,
  active,
  setActive,
  onClose,
  turns,
  onClearTurns,
  traceFocus,
  width,
  chatsContent,
  accountContent,
  modelSetupContent,
  simulationContent,
  tabBarControls,
  activeConversationId,
  onDismiss,
  isAdmin = false,
}: {
  open: DrawerId[];
  active: DrawerId | null;
  setActive: (id: DrawerId) => void;
  onClose: (id: DrawerId) => void;
  turns: Turn[];
  onClearTurns: () => void;
  /** When bumped, Observability expands and scrolls to trace turn `id`. */
  traceFocus?: { id: string; n: number };
  width?: number;
  /** Mobile-only panes; on desktop these tabs are never opened. */
  chatsContent?: React.ReactNode;
  accountContent?: React.ReactNode;
  /**
   * The Model Setup pane's container. The actual SetupBar is mounted at the page
   * level and portals its docked view into this element, so the popped-out
   * floating window survives the drawer closing.
   */
  modelSetupContent?: React.ReactNode;
  /** Simulation pane: run an automated council↔simulated-user conversation. */
  simulationContent?: React.ReactNode;
  /** Controls docked into the tab bar, left of the ×, e.g. Pause/Stop while a simulation runs. */
  tabBarControls?: React.ReactNode;
  /** Active conversation id — the Upload pane attaches files to it. */
  activeConversationId?: string | null;
  /** Close the whole drawer (mobile: flick the sheet down past the threshold). */
  onDismiss?: () => void;
  /** Non-admins never see the internal Model Setup / Observability panels. */
  isAdmin?: boolean;
}) {
  // Mobile bottom-sheet: continuous height drag on the grabber (no mid snap).
  // Inert on desktop (grabber is display:none there).
  const [sheetVh, setSheetVh] = useState(SHEET_DEFAULT_VH);
  const [dragging, setDragging] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const dragStartVh = useRef(SHEET_DEFAULT_VH);
  const sheetVhRef = useRef(sheetVh);
  sheetVhRef.current = sheetVh;
  const wasOpenRef = useRef(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const nowOpen = open.length > 0;
    if (nowOpen && !wasOpenRef.current) setSheetVh(SHEET_DEFAULT_VH);
    wasOpenRef.current = nowOpen;
  }, [open.length]);

  // Tabs/panes shown: the full function set on mobile (scrollable, switchable),
  // the opened subset on desktop. Non-admins never get the internal panels on
  // either surface.
  const visibleTabIds = (isMobile ? ALL_TABS : open).filter(
    (id) => isAdmin || !ADMIN_ONLY_DRAWERS.includes(id)
  );
  const tabIds = visibleTabIds;
  const activeId =
    active && visibleTabIds.includes(active) ? active : visibleTabIds[0] ?? null;

  function onGrabDown(e: React.PointerEvent) {
    e.preventDefault();
    dragStartY.current = e.clientY;
    dragStartVh.current = sheetVhRef.current;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onGrabMove(e: React.PointerEvent) {
    if (dragStartY.current === null) return;
    const dy = e.clientY - dragStartY.current; // down = shrink, up = grow
    const vhPerPx = 100 / Math.max(1, window.innerHeight);
    const next = dragStartVh.current - dy * vhPerPx;
    setSheetVh(Math.max(SHEET_MIN_VH, Math.min(SHEET_MAX_VH, next)));
  }
  function onGrabUp() {
    if (dragStartY.current === null) return;
    dragStartY.current = null;
    setDragging(false);
    if (sheetVhRef.current < SHEET_DISMISS_VH) {
      setSheetVh(SHEET_DEFAULT_VH);
      onDismiss?.();
    }
  }

  if (open.length === 0) return null;

  return (
    <div
      className={"obs-panel right-drawer" + (dragging ? " is-dragging" : "")}
      style={{
        ...(width ? { ["--obs-w" as string]: `${width}px` } : {}),
        ...(isMobile
          ? {
              height: `${sheetVh}vh`,
              maxHeight: `${sheetVh}vh`,
              transition: dragging ? "none" : undefined,
            }
          : {}),
      } as React.CSSProperties}
      role="dialog"
      aria-label="Side panels"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={"drawer-grabber-wrap" + (dragging ? " active" : "")}
        onPointerDown={onGrabDown}
        onPointerMove={onGrabMove}
        onPointerUp={onGrabUp}
        onPointerCancel={onGrabUp}
        title="Drag to resize"
        aria-label="Drag to resize panel"
      >
        <div className="drawer-grabber" />
      </div>
      <div className="drawer-tabbar">
      <div className="drawer-tabs" role="tablist">
        {tabIds.map((id) => (
          <div
            key={id}
            role="tab"
            aria-selected={activeId === id}
            tabIndex={0}
            className={"drawer-tab" + (activeId === id ? " on" : "")}
            onClick={() => setActive(id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActive(id);
              }
            }}
          >
            <span className="drawer-tab-label">{DRAWER_LABEL[id]}</span>
            {/* Per-tab close removed. The whole drawer is toggled from the right
                rail's panel icon (desktop) or by flicking the grabber down (mobile). */}
          </div>
        ))}
      </div>
      {tabBarControls && <div className="drawer-tabbar-controls">{tabBarControls}</div>}
      <button
        type="button"
        className="drawer-close-btn"
        aria-label="Close panel"
        title="Close panel"
        onClick={() => onDismiss?.()}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      </div>

      {tabIds.map((id) => (
        <div
          key={id}
          className="drawer-pane-wrap"
          style={{ display: activeId === id ? "flex" : "none" }}
        >
          {id === "chats" && chatsContent}
          {id === "observability" && (
            <ObservabilityContent
              turns={turns}
              onClear={onClearTurns}
              traceFocus={traceFocus}
            />
          )}
          {id === "modelsetup" && modelSetupContent}
          {id === "simulation" && simulationContent}
          {id === "expert" && <ExpertChatContent active={activeId === "expert"} />}
          {id === "upload" && <UploadContent conversationId={activeConversationId ?? null} />}
          {id === "account" && accountContent}
        </div>
      ))}
    </div>
  );
}
