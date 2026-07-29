"use client";

// Task 5 — interactive prototype of the agent-first Setup pane nav.
// Demonstrates the target structure against the reference investment-analyst
// draft: Setup | Observability | Simulation  →  [agent selector row]  →
// State | Policy | Reward  →  the selected canvas. Selecting an agent scopes
// everything below and the choice persists per draft (localStorage). This is
// the design artifact to port into SetupStudio.tsx (the live port needs QA).

import { useEffect, useState } from "react";

const SEPIA_PANEL = "#e4e2d6";
const SEPIA_TEXT = "#1f1d18";
const SEPIA_MUTED = "#6f6a5b";
const SEPIA_LINE = "#a8a698";
const C_RUST = "#c2611f";
const C_TEAL = "#0a3a52";
const KIND_COLOR: Record<string, string> = { state: "#0a3a52", policy: "#445a1e", reward: "#007e27" };

const DRAFT_ID = "c2b2f46c";

type Kind = "state" | "policy" | "reward";
type Agent = {
  key: string;
  name: string;
  role: "task_generator" | "agent";
  canvases: Record<Kind, { name: string; nodes: number; free: string }>;
};

const AGENTS: Agent[] = [
  {
    key: "task_env", name: "Task generator", role: "task_generator",
    canvases: {
      state: { name: "Task selection and state update", nodes: 13, free: "Samples one task + its hidden price trajectory into state." },
      policy: { name: "Task lifecycle", nodes: 6, free: "Commits the sampled task and hands the package to the analyst." },
      reward: { name: "Thirty-day realized return", nodes: 8, free: "Validates the final note, scores the realized 30-day return." },
    },
  },
  {
    key: "analyst", name: "Investment analyst", role: "agent",
    canvases: {
      state: { name: "stage1TargetState", nodes: 9, free: "Receives the task package as observation; reads the context fields." },
      policy: { name: "stage1TargetPolicy", nodes: 14, free: "Screens the company and returns one final-note JSON." },
      reward: { name: "Task environment final solution quality", nodes: 3, free: "Scores only the final solution." },
    },
  },
];

const TABS: { id: Kind; label: string }[] = [
  { id: "state", label: "State" },
  { id: "policy", label: "Policy" },
  { id: "reward", label: "Reward" },
];

export default function AgentTierPrototype() {
  const [agentIdx, setAgentIdx] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const saved = window.localStorage.getItem(`air-setup-agent-${DRAFT_ID}`);
      const i = saved ? AGENTS.findIndex((a) => a.key === saved) : -1;
      return i >= 0 ? i : 0;
    } catch { return 0; }
  });
  const [kind, setKind] = useState<Kind>("state");

  // Persist the selected agent per draft (writing to storage in an effect is fine).
  useEffect(() => {
    try { window.localStorage.setItem(`air-setup-agent-${DRAFT_ID}`, AGENTS[agentIdx].key); } catch { /* ignore */ }
  }, [agentIdx]);

  const agent = AGENTS[agentIdx];
  const canvas = agent.canvases[kind];
  const hasTaskGenerator = AGENTS.some((a) => a.role === "task_generator");

  const tabBtn = (active: boolean, accent: string): React.CSSProperties => ({
    padding: "5px 12px", fontSize: 13, cursor: "pointer", border: `1px solid ${active ? accent : SEPIA_LINE}`,
    background: active ? accent : "transparent", color: active ? "#fff" : SEPIA_TEXT, fontWeight: active ? 700 : 500,
  });

  return (
    <div style={{ border: `1px solid ${SEPIA_LINE}`, background: SEPIA_PANEL }}>
      {/* Top-level tabs */}
      <div style={{ display: "flex", gap: 6, padding: "10px 12px", borderBottom: `1px solid ${SEPIA_LINE}` }}>
        {["Setup", "Observability", "Simulation"].map((t, i) => (
          <span key={t} style={{ ...tabBtn(i === 0, C_RUST), cursor: "default" }}>{t}</span>
        ))}
      </div>

      {/* NEW agent selector row (wraps for many agents; task generator is a peer) */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, padding: "10px 12px", borderBottom: `1px solid ${SEPIA_LINE}`, background: "#eeecdf" }}>
        <span style={{ fontSize: 10.5, fontFamily: "var(--font-mono, monospace)", color: SEPIA_MUTED, marginRight: 4 }}>AGENT</span>
        {AGENTS.map((a, i) => {
          const active = i === agentIdx;
          return (
            <button key={a.key} onClick={() => setAgentIdx(i)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", cursor: "pointer",
                border: `1px solid ${active ? C_TEAL : SEPIA_LINE}`, background: active ? C_TEAL : "transparent",
                color: active ? "#fff" : SEPIA_TEXT, fontWeight: active ? 700 : 500, fontSize: 12.5 }}>
              {a.name}
              {a.role === "task_generator" && (
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.4, padding: "1px 5px",
                  background: active ? "rgba(255,255,255,0.22)" : C_RUST, color: "#fff", textTransform: "uppercase" }}>gen</span>
              )}
            </button>
          );
        })}
        {/* Create-agent affordance — never offers a second task generator */}
        <button title={hasTaskGenerator ? "Add an agent (a task generator already exists)" : "Add an agent"}
          style={{ padding: "4px 10px", cursor: "pointer", border: `1px dashed ${SEPIA_LINE}`, background: "transparent", color: SEPIA_MUTED, fontSize: 12.5 }}>
          + Add agent
        </button>
      </div>

      {/* Canvas-type tabs (Knowledge → Reward, Task 6) */}
      <div style={{ display: "flex", gap: 6, padding: "10px 12px", borderBottom: `1px solid ${SEPIA_LINE}` }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setKind(t.id)} style={tabBtn(kind === t.id, KIND_COLOR[t.id])}>{t.label}</button>
        ))}
      </div>

      {/* Scoped canvas */}
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: "#fff", background: KIND_COLOR[kind], padding: "2px 8px", textTransform: "uppercase" }}>{kind}</span>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{canvas.name}</span>
          <span style={{ fontSize: 12, color: SEPIA_MUTED }}>{agent.name}</span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: SEPIA_MUTED }}>{canvas.nodes} nodes</span>
        </div>
        <p style={{ fontSize: 13, color: SEPIA_TEXT, marginTop: 10, lineHeight: 1.5, fontStyle: "italic", borderLeft: `2px solid ${SEPIA_LINE}`, paddingLeft: 10 }}>{canvas.free}</p>
        <div style={{ fontSize: 11.5, color: SEPIA_MUTED, marginTop: 10 }}>
          Selected: <strong style={{ color: SEPIA_TEXT }}>{agent.name}</strong> → <strong style={{ color: SEPIA_TEXT }}>{TABS.find((t) => t.id === kind)!.label}</strong>. Choice persists per draft.
        </div>
      </div>
    </div>
  );
}
