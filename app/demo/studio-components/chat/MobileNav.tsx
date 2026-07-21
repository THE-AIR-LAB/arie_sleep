"use client";

import { useEffect, useRef, useState } from "react";
import { Ic } from "../ra-icons";
import {
  CHAT_MODEL_OPTIONS,
  OPENAI_MODEL,
  type ChatModelId,
} from "../../../lib/openai-config";

/* ---------------- mobile-only top-right nav ---------------- */
// On mobile the docked sidebar and rails are hidden, so a single hamburger
// opens the bottom sheet (Chats / Account / admin tabs live inside it).
export function MobileNav({
  onOpen,
  showThreadControls = false,
  allCollapsed = false,
  onToggleCollapseAll,
  hideBubbleControls = true,
  onToggleHideBubbleControls,
  onOpenThreadFullscreen,
  selectedModel = OPENAI_MODEL,
  onSelectModel,
  onOpenV2Modal,
}: {
  onOpen: () => void;
  isAdmin?: boolean;
  showThreadControls?: boolean;
  allCollapsed?: boolean;
  onToggleCollapseAll?: () => void;
  hideBubbleControls?: boolean;
  onToggleHideBubbleControls?: () => void;
  onOpenThreadFullscreen?: () => void;
  selectedModel?: string;
  onSelectModel?: (model: ChatModelId) => void;
  onOpenV2Modal?: () => void;
}) {
  const [threadMenuOpen, setThreadMenuOpen] = useState(false);
  const threadMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!threadMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (threadMenuRef.current && !threadMenuRef.current.contains(e.target as Node)) {
        setThreadMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [threadMenuOpen]);

  return (
    <nav className="mobile-railnav" aria-label="Menu">
      {showThreadControls && (
        <div className="mrail-thread-controls" ref={threadMenuRef}>
          <button
            type="button"
            className={"mrail-btn" + (threadMenuOpen ? " on" : "")}
            title="Thread actions"
            aria-label="Thread actions"
            aria-haspopup="menu"
            aria-expanded={threadMenuOpen}
            onClick={(e) => {
              e.stopPropagation();
              setThreadMenuOpen((v) => !v);
            }}
          >
            <Ic.Sliders size={18} />
          </button>
          {threadMenuOpen && (
            <div className="thread-mobile-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                className="thread-model-option"
                onClick={() => {
                  onToggleHideBubbleControls?.();
                  setThreadMenuOpen(false);
                }}
              >
                {hideBubbleControls ? "Show controls" : "Hide controls"}
              </button>
              <button
                type="button"
                role="menuitem"
                className="thread-model-option"
                onClick={() => {
                  onToggleCollapseAll?.();
                  setThreadMenuOpen(false);
                }}
              >
                {allCollapsed ? "Expand all" : "Collapse all"}
              </button>
              <button
                type="button"
                role="menuitem"
                className="thread-model-option"
                onClick={() => {
                  onOpenThreadFullscreen?.();
                  setThreadMenuOpen(false);
                }}
              >
                Fullscreen
              </button>
              <div className="thread-mobile-menu-div" role="separator" />
              <div className="thread-mobile-menu-label">Model</div>
              {CHAT_MODEL_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role={opt.kind === "action" ? "menuitem" : "menuitemradio"}
                  aria-checked={opt.kind === "model" ? selectedModel === opt.id : undefined}
                  className={
                    "thread-model-option" +
                    (opt.kind === "model" && selectedModel === opt.id ? " selected" : "")
                  }
                  onClick={() => {
                    setThreadMenuOpen(false);
                    if (opt.kind === "action") {
                      onOpenV2Modal?.();
                      return;
                    }
                    onSelectModel?.(opt.id);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        className="mrail-btn"
        title="Open menu"
        aria-label="Open menu"
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
      >
        <Ic.Menu size={18} />
      </button>
    </nav>
  );
}
