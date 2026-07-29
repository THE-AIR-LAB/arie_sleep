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

const MUTED = "#6f6a5b";

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

type GraphLike = CanvasEntry["graph"];

/** Tidy a graph into a left-to-right layered layout: x by rank (longest path
 *  from the roots), y stacked per column using an estimated node height so tall
 *  long-label nodes never overlap. Deterministic; leaves the graph's nodes/edges
 *  otherwise untouched. The daemon stores nodes stacked vertically with a fixed
 *  gap that's smaller than a long-label node, which is what caused the overlap. */
function layoutGraph(graph: GraphLike): GraphLike {
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph?.edges) ? graph.edges : [];
  if (nodes.length <= 1) return graph;

  const idSet = new Set(nodes.map((n) => String(n.id)));
  const links = edges.filter(
    (e) => e && idSet.has(String(e.source)) && idSet.has(String(e.target)) && e.source !== e.target
  );

  // Longest-path rank via relaxation, capped at nodes.length passes so cycles
  // (e.g. the state summary loop) terminate instead of spinning.
  const rank = new Map<string, number>(nodes.map((n) => [String(n.id), 0]));
  for (let pass = 0; pass < nodes.length; pass++) {
    let changed = false;
    for (const e of links) {
      const next = (rank.get(String(e.source)) ?? 0) + 1;
      if ((rank.get(String(e.target)) ?? 0) < next) {
        rank.set(String(e.target), next);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const COL = 460;
  const GAP_Y = 48;
  const estHeight = (n: { data?: { label?: unknown } }) => {
    const label = typeof n?.data?.label === "string" ? n.data.label : "";
    const lines = Math.min(9, Math.max(1, Math.ceil(label.length / 30)));
    return 74 + lines * 24;
  };

  const columnCursor = new Map<number, number>();
  const laidNodes = nodes.map((n) => {
    const r = rank.get(String(n.id)) ?? 0;
    const y = columnCursor.get(r) ?? 40;
    columnCursor.set(r, y + estHeight(n) + GAP_Y);
    return { ...n, position: { x: r * COL, y } };
  });

  return { ...graph, nodes: laidNodes };
}

/** True only for a graph still in the daemon's raw form: >1 node all stacked in
 *  a single column (one distinct x). Once the user arranges and saves, the nodes
 *  spread across multiple x's, so we must honor those positions instead of
 *  re-running layoutGraph — otherwise a saved/reloaded arrangement snaps back. */
function needsLayout(graph: GraphLike): boolean {
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  if (nodes.length <= 1) return false;
  const xs = new Set(nodes.map((n) => Math.round(n.position?.x ?? 0)));
  return xs.size <= 1;
}

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

  // Single-canvas doc for the selected agent + section. Honor a local edit
  // as-is (the user may have arranged nodes); otherwise tidy the stored graph
  // into a left-to-right layered layout so the nodes don't overlap on open —
  // the daemon's stored positions stack tall long-label nodes vertically.
  const doc = useMemo<CanvasDoc | null>(() => {
    if (!row) return null;
    const edited = edits[row.canvas.id];
    const entry =
      edited ??
      (needsLayout(row.canvas.graph)
        ? { ...row.canvas, graph: layoutGraph(row.canvas.graph) }
        : row.canvas);
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
        {/* Agent selector nav — underline tabs, matching the drawer's
            Setup/Observability/Simulation and the default Model Setup nav
            (.obs-setup / .obs-setup-chip). */}
        <div className="obs-setup" style={{ flex: "0 0 auto" }}>
          {agents.map((a, i) => {
            const on = i === agentIdx;
            return (
              <button key={a.key} className={"obs-setup-chip" + (on ? " on" : "")}
                onClick={() => { setAgentIdx(i); if (!a.canvases[kind]) setKind("state"); }}>
                {a.name}
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--text-3)" }}>{a.role}</span>
              </button>
            );
          })}
          {/* Row label moved to the right, mirroring the section row's canvas name. */}
          <div className="obs-setup-trailing">
            <span style={{ fontSize: 10.5, fontFamily: "var(--font-mono, monospace)", color: "var(--text-3)", letterSpacing: 0.5 }}>AGENT</span>
          </div>
        </div>

        {/* Section tabs (State / Policy / Reward) — same underline nav. */}
        <div className="obs-setup" style={{ flex: "0 0 auto" }}>
          {KINDS.map((k) => {
            const has = !!agent?.canvases[k];
            const on = kind === k;
            return (
              <button key={k} className={"obs-setup-chip" + (on ? " on" : "")} disabled={!has}
                onClick={() => has && setKind(k)} style={has ? undefined : { opacity: 0.4 }}>
                {KIND_LABEL[k]}
              </button>
            );
          })}
          {row ? (
            <div className="obs-setup-trailing">
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>{row.canvas.name}</span>
            </div>
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
                {/* Save is docked into the canvas bottom-right chrome (tabBarTrailing),
                    as in the default Model Setup pane. */}
                <Canvas
                  key={row?.canvas.id}
                  value={doc}
                  fillHeight
                  onChange={onChange}
                  tabBarTrailing={
                    <div className="obs-setup-actions">
                      {saveError ? <span style={{ fontSize: 11.5, color: "#d9582b", marginRight: 4 }}>{saveError}</span> : null}
                      <button
                        type="button"
                        className="obs-setup-action"
                        onClick={() => void save()}
                        disabled={!dirty || saving}
                        title={dirty ? "You have unsaved changes" : "No changes to save"}
                      >
                        {saving ? "Saving…" : dirty ? (<><span className="unsaved-dot" aria-hidden />Save</>) : "Saved"}
                      </button>
                    </div>
                  }
                />
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
