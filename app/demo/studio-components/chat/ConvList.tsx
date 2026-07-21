"use client";

import { useState } from "react";
import { Ic } from "../ra-icons";
import type { Conversation } from "./types";

/**
 * The conversation list (kebab menu → Rename / Delete), shared by the desktop
 * sidebar and the mobile chats drawer so both behave identically. Owns the
 * kebab-open, inline-rename, and multi-select state locally; a fixed overlay
 * closes the menu on any outside click (same pattern as the topbar demo menu).
 */
export function ConvList({
  convos,
  activeId,
  query,
  onSelect,
  onDelete,
  onDeleteMany,
  onRename,
}: {
  convos: Conversation[];
  activeId: string | null;
  query: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDeleteMany: (ids: string[]) => void;
  onRename: (id: string, title: string) => void;
}) {
  const [kebabId, setKebabId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const filtered = convos.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  const startRename = (c: Conversation) => {
    setKebabId(null);
    setRenamingId(c.id);
    setDraft(c.title);
  };
  const commitRename = (id: string) => {
    const next = draft.trim();
    if (next) onRename(id, next);
    setRenamingId(null);
  };

  const exitSelecting = () => {
    setSelecting(false);
    setSelectedIds(new Set());
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteSelected = () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const label =
      ids.length === 1
        ? "Delete this conversation?"
        : `Delete ${ids.length} conversations?`;
    if (!window.confirm(label)) return;
    onDeleteMany(ids);
    exitSelecting();
  };

  const selectedCount = selectedIds.size;

  return (
    <>
      <div className="recent-head">
        <span className="recent-label">
          <Ic.Clock size={13} /> Recent
          <span className="chev"><Ic.Chevron size={13} /></span>
        </span>
        {convos.length > 0 && (
          <div className="conv-select-bar">
            {selecting ? (
              <>
                <button
                  type="button"
                  className="conv-select-action danger"
                  onClick={deleteSelected}
                  disabled={selectedCount === 0}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="conv-select-action"
                  onClick={exitSelecting}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                className="conv-select-action"
                onClick={() => {
                  setKebabId(null);
                  setSelecting(true);
                }}
              >
                Select
              </button>
            )}
          </div>
        )}
      </div>
      {convos.length === 0 ? (
        <div className="conv-empty">
          <div className="ce-orb"><Ic.Chat size={18} /></div>
          <p>No conversations yet.<br />Start one below.</p>
        </div>
      ) : (
      <div className="conv-list">
        {kebabId && (
          <div
            onClick={() => setKebabId(null)}
            style={{ position: "fixed", inset: 0, zIndex: 20 }}
            aria-hidden="true"
          />
        )}
        {filtered.map((c) => {
          const isChecked = selectedIds.has(c.id);
          return (
            <div
              key={c.id}
              className={
                "conv-item" +
                (c.id === activeId && !selecting ? " active" : "") +
                (isChecked ? " selected" : "") +
                (c.hasFeedback ? " has-feedback" : "")
              }
              onClick={() => {
                if (renamingId === c.id) return;
                if (selecting) {
                  toggleSelected(c.id);
                  return;
                }
                onSelect(c.id);
              }}
            >
              {renamingId === c.id ? (
                <input
                  className="conv-rename"
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(c.id);
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  onBlur={() => commitRename(c.id)}
                />
              ) : (
                <>
                  {selecting && (
                    <button
                      type="button"
                      className={"conv-check" + (isChecked ? " on" : "")}
                      aria-label={isChecked ? "Deselect conversation" : "Select conversation"}
                      aria-pressed={isChecked}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelected(c.id);
                      }}
                    >
                      {isChecked ? (
                        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                          <path
                            d="M3.5 8.2l2.8 2.8 6.2-6.4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null}
                    </button>
                  )}
                  <span className="conv-title">{c.title}</span>
                  {!selecting && (
                    <button
                      className={"conv-kebab" + (kebabId === c.id ? " open" : "")}
                      onClick={(e) => {
                        e.stopPropagation();
                        setKebabId((prev) => (prev === c.id ? null : c.id));
                      }}
                    >
                      <Ic.Dots size={16} />
                    </button>
                  )}
                  {!selecting && kebabId === c.id && (
                    <div className="conv-menu" role="menu" onClick={(e) => e.stopPropagation()}>
                      <button className="pop-row" onClick={() => startRename(c)}>
                        <span className="ic"><Ic.Edit size={16} /></span>Rename
                      </button>
                      <button
                        className="pop-row danger"
                        onClick={() => {
                          setKebabId(null);
                          onDelete(c.id);
                        }}
                      >
                        <span className="ic"><Ic.Trash size={16} /></span>Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="conv-empty"><p>No matches.</p></div>
        )}
      </div>
      )}
    </>
  );
}
