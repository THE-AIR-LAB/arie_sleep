"use client";

// Investor-analyst-only Model Setup pane with an AGENT TIER. Renders into the
// drawer's Model Setup slot via portal (drop-in for SetupBarProps), so no shared
// component is touched and every other studio keeps the default SetupStudio pane.
//
// It reads the agent-first store through /api/investor-analyst/canvases, which
// returns an `agents` array (source → task generator, target → analyst), each
// owning a state / policy / reward canvas. The pane adds two nav bars:
//   [ agent selector: Task generator (source) | Investment analyst (target) ]
//   [ section tabs: State | Policy | Reward ]
// and renders the real editable Canvas for the selected agent + section. Save
// writes edited graphs back to the same rows via PUT (UPDATE-only, admin-gated).

import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import Canvas, { type CanvasDoc } from "../../../components/canvas/Canvas";
import type { SetupBarProps } from "../../studio-components/chat/types";

const PANEL = "#e4e2d6";
const INK = "#1f1d18";
const MUTED = "#6f6a5b";
const LINE = "#a8a698";
const RUST = "#c2611f";
const TEAL = "#0a3a52";
const KIND_COLOR: Record<Kind, string> = { state: "#0a3a52", policy: "#445a1e", reward: "#007e27" };

const ENDPOINT = "/api/investor-analyst/canvases";

type Kind = "state" | "policy" | "reward";
type CanvasEntry = CanvasDoc["canvases"][number];
type SetupRow = { canvas_id: string; name: string; sort_order: number; canvas: CanvasEntry };
type Agent = {
  key: string;
  name: string;
  role: "source" | "target";
  canvases: Record<Kind, SetupRow | null>;
};

const KINDS: Kind[] = ["state", "policy", "reward"];
const KIND_LABEL: Record<Kind, string> = { state: "State", policy: "Policy", reward: "Reward" };

function Composition({ slot }: { slot: HTMLElement }) {
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [agentIdx, setAgentIdx] = useState(0);
  const [kind, setKind] = useState<Kind>("state");
  // Edited canvas entries keyed by row uuid; the source of truth for a canvas is
  // its edit if present, otherwise the fetched value.
  const [edits, setEdits] = useState<Record<string, CanvasEntry>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(ENDPOINT);
        if (!res.ok) throw new Error(`Load failed (${res.status})`);
        const data = (await res.json()) as { agents?: Agent[] };
        if (!cancelled) setAgents(data.agents ?? []);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Load failed");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const agent = agents?.[agentIdx] ?? null;
  const row = agent?.canvases[kind] ?? null;
  const dirty = Object.keys(edits).length > 0;

  // Single-canvas doc for the selected agent + section, honoring any local edit.
  const doc = useMemo<CanvasDoc | null>(() => {
    if (!row) return null;
    const entry = edits[row.canvas.id] ?? row.canvas;
    return { version: 2, activeId: entry.id, canvases: [entry] };
  }, [row, edits]);

  const onChange = useCallback(({ doc: next }: { doc: CanvasDoc }) => {
    const entry = next.canvases[0];
    if (!entry) return;
    setEdits((prev) => ({ ...prev, [entry.id]: entry }));
  }, []);

  const save = useCallback(async () => {
    const rows: SetupRow[] = Object.values(edits).map((entry) => ({
      canvas_id: entry.id, name: entry.name, sort_order: 0, canvas: entry,
    }));
    if (rows.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(ENDPOINT, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Bucket name is irrelevant — the endpoint matches each canvas by uuid.
        body: JSON.stringify({ workflowCanvases: rows }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Save failed (${res.status})`);
      }
      // Fold edits into the fetched rows so the baseline reflects the save.
      setAgents((prev) =>
        prev?.map((a) => ({
          ...a,
          canvases: Object.fromEntries(
            KINDS.map((k) => {
              const r = a.canvases[k];
              if (r && edits[r.canvas.id]) return [k, { ...r, canvas: edits[r.canvas.id] }];
              return [k, r];
            })
          ) as Agent["canvases"],
        })) ?? prev
      );
      setEdits({});
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [edits]);

  const body = (() => {
    if (loadError) return <Msg>Could not load canvases: {loadError}</Msg>;
    if (!agents) return <Msg>Loading canvases…</Msg>;
    if (agents.length === 0) return <Msg>No canvases found for this draft.</Msg>;
    // The drawer slot is `.drawer-pane` — a flex column. The canvas fills height
    // only when `.obs-docked` is a DIRECT child of the slot (the ra-theme rule
    // `.drawer-pane > .obs-docked` uses the child combinator) and the flow sits
    // in `.obs-docked > .obs-docked-body > .sc-canvas-host`, which the
    // `:has(.sc-canvas-host)` rules size. So we render nav / tabs / obs-docked as
    // sibling direct children of the slot rather than nesting them in a wrapper.
    return (
      <>
        {/* Agent selector nav */}
        <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderBottom: `1px solid ${LINE}`, background: "#eeecdf", flexWrap: "wrap" }}>
          <span style={{ fontSize: 10.5, fontFamily: "var(--font-mono, monospace)", color: MUTED, marginRight: 2 }}>AGENT</span>
          {agents.map((a, i) => {
            const on = i === agentIdx;
            return (
              <button key={a.key} onClick={() => { setAgentIdx(i); if (!a.canvases[kind]) setKind("state"); }}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", cursor: "pointer",
                  border: `1px solid ${on ? TEAL : LINE}`, background: on ? TEAL : "transparent", color: on ? "#fff" : INK,
                  fontWeight: on ? 700 : 500, fontSize: 12.5 }}>
                {a.name}
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.4, padding: "1px 5px",
                  background: on ? "rgba(255,255,255,0.22)" : (a.role === "source" ? RUST : TEAL), color: "#fff", textTransform: "uppercase" }}>
                  {a.role}
                </span>
              </button>
            );
          })}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            {saveError ? <span style={{ fontSize: 11.5, color: "#d9582b" }}>{saveError}</span> : null}
            <button onClick={save} disabled={!dirty || saving}
              style={{ padding: "4px 12px", cursor: dirty && !saving ? "pointer" : "default", border: `1px solid ${dirty ? RUST : LINE}`,
                background: dirty ? RUST : "transparent", color: dirty ? "#fff" : MUTED, fontWeight: 600, fontSize: 12.5 }}>
              {saving ? "Saving…" : dirty ? "Save" : "Saved"}
            </button>
          </div>
        </div>

        {/* Section tabs (State / Policy / Reward) */}
        <div style={{ flex: "0 0 auto", display: "flex", gap: 6, padding: "8px 12px", borderBottom: `1px solid ${LINE}` }}>
          {KINDS.map((k) => {
            const has = !!agent?.canvases[k];
            const on = kind === k;
            return (
              <button key={k} onClick={() => has && setKind(k)} disabled={!has}
                style={{ padding: "5px 12px", fontSize: 13, cursor: has ? "pointer" : "default",
                  border: `1px solid ${on ? KIND_COLOR[k] : LINE}`, background: on ? KIND_COLOR[k] : "transparent",
                  color: on ? "#fff" : (has ? INK : "#b8b6a8"), fontWeight: on ? 700 : 500 }}>
                {KIND_LABEL[k]}
              </button>
            );
          })}
          {row ? (
            <span style={{ marginLeft: "auto", alignSelf: "center", fontSize: 11.5, color: MUTED }}>
              {row.canvas.name}
            </span>
          ) : null}
        </div>

        {/* Real editable canvas for the selected agent + section. Mirror the
            default pane's wrapper chain (`.sysconf.obs-docked > .obs-docked-body
            > .sc-canvas-host`) so the ra-theme `:has(.sc-canvas-host)` rules give
            the flow real height and Canvas's fillHeight can measure it. */}
        {doc ? (
          <div className="sysconf obs-docked">
            <div className="obs-docked-body">
              <div className="sc-canvas-host" style={{ display: "flex", flexDirection: "column" }}>
                <Canvas key={row?.canvas.id} value={doc} fillHeight onChange={onChange} />
              </div>
            </div>
          </div>
        ) : (
          <Msg>This agent has no {KIND_LABEL[kind].toLowerCase()} canvas.</Msg>
        )}
      </>
    );
  })();

  // Portal a fragment so nav / tabs / obs-docked are DIRECT children of the
  // `.drawer-pane` slot (required by the `.drawer-pane > .obs-docked` rule).
  return createPortal(body, slot);
}

function Msg({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 20, fontSize: 13, color: MUTED }}>{children}</div>;
}

export default function AgentCanvasSetupBar({ slot, onTopDockChange }: SetupBarProps) {
  useEffect(() => { onTopDockChange?.(0); }, [onTopDockChange]);
  if (!slot) return null;
  return <Composition slot={slot} />;
}
