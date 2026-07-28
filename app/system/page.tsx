import type { Metadata } from "next";

// ---------------------------------------------------------------------------
// /system — AIR Lab agent-first Setup pane: schema audit & migration findings.
//
// A self-contained, read-only report of Task 0 (schema audit) and Task 1
// (canvas identity / collision analysis) for the agent-first Setup rework,
// rendered against the reference INVESTMENT ANALYST draft:
//   general_orchestration_daemon_drafts.id = c2b2f46c-3c3e-451a-a4cb-1b8acaf86115
//
// Everything below is baked from live read-only SQL taken against project
// doyyvsfnrcjqtwnvatwa (DEMO_1_LONGEVITY) via the scoped Supabase MCP surface
// (NOT the service-role key). The page holds no credentials and makes no DB
// call at request time.
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "System — Setup pane schema audit",
  description: "Task 0 / Task 1 findings for the agent-first Setup pane, against the investment analyst draft.",
};

const SEPIA_BG = "#d8d6c7";
const SEPIA_PANEL = "#e4e2d6";
const SEPIA_TEXT = "#1f1d18";
const SEPIA_MUTED = "#6f6a5b";
const SEPIA_LINE = "#a8a698";
const ACCENT = "#8a5a2b";
const WARN = "#9a3b2f";

const REFERENCE = {
  draftId: "c2b2f46c-3c3e-451a-a4cb-1b8acaf86115",
  project: "doyyvsfnrcjqtwnvatwa (DEMO_1_LONGEVITY)",
  configName: "An investment analyst workflow: idea generation stage",
  connectionId: "93c45cc3-f6b8-4e76-8831-b9632ffdfb03",
  stage: "Idea generation screening",
};

const AGENTS = [
  {
    id: "905cdf83-5970-4598-8642-dea17852cc99",
    role: "Task generator (task environment)",
    connectionSide: "source",
    title: "Task environment · An investment analyst workflow: idea generation stage",
    distinctiveState: ["selected_task_id", "selected_task", "selected_price_trajectory", "task_profile_sent", "final_solution_received"],
  },
  {
    id: "task_performing_agent",
    role: "Investment analyst",
    connectionSide: "target",
    title: "Investment analyst performing idea-generation screening",
    distinctiveState: ["work_complete", "final_solution", "screening_decision", "initial_hypothesis"],
  },
];

// The six canvases carried by the single connection, exactly as stored.
type CanvasNode = { id: string; type: string; label: string };
type CanvasCard = {
  side: "source" | "target";
  kind: "state" | "policy" | "reward";
  owner: string;
  agentId: string;
  canvasId: string;
  name: string;
  nodeCount: number;
  edgeCount: number;
  freeText: string;
  nodes: CanvasNode[];
};

const CANVASES: CanvasCard[] = [
  {
    side: "source", kind: "state", owner: "Task generator (task environment)", agentId: "905cdf83-5970-4598-8642-dea17852cc99",
    canvasId: "starter-state-canvas", name: "Task selection and state update", nodeCount: 13, edgeCount: 15,
    freeText: "Editable starter state template. Adapt the Start text and downstream prompts to the project/agent while preserving the first ingress append Code node unless the project genuinely needs a different deterministic ingress append.",
    nodes: [
      { id: "starter-state-start", type: "start", label: "Adapt this Start text to the project/agent. summary stores condensed past context, new_events stores recent unsummarized events." },
      { id: "starter-state-ingress-append", type: "code", label: "Add agent_latest_observation and agent_latest_reward to new_events." },
      { id: "starter-state-summary-gate", type: "condition", label: "memory_over_limit is true" },
      { id: "starter-state-update-summary", type: "prompt", label: "Update summary with a concise summary of summary plus new_events." },
      { id: "starter-state-clear-new-events", type: "code", label: "Set new_events to empty list." },
      { id: "starter-state-update-remaining", type: "prompt", label: "Use only the current state to update the remaining fields." },
      { id: "starter-state-summary-gate-memory-size", type: "code", label: "Measure whether summary plus new_events exceeds 4000 characters." },
      { id: "task-state-observation-empty", type: "condition", label: "state agent_latest_observation is empty" },
      { id: "task-state-selection-empty", type: "condition", label: "state selected_task_id is empty" },
      { id: "task-state-random-task", type: "tool_call", label: "Choose one complete task when the simulation starts. (dataset: tasks)" },
      { id: "task-state-prepare-selection", type: "code", label: "Prepare the sampled task and task id for state storage." },
      { id: "task-state-read-trajectory", type: "tool_call", label: "Load only the trajectory associated with the sampled task. (dataset: price_trajectories)" },
      { id: "task-state-commit-selection", type: "code", label: "Set the selected task and associated trajectory in state." },
    ],
  },
  {
    side: "source", kind: "policy", owner: "Task generator (task environment)", agentId: "905cdf83-5970-4598-8642-dea17852cc99",
    canvasId: "task-environment-policy", name: "Task lifecycle", nodeCount: 6, edgeCount: 5,
    freeText: "",
    nodes: [
      { id: "task-policy-start", type: "start", label: "Handle one task-environment turn." },
      { id: "task-policy-observation-empty", type: "condition", label: "state agent_latest_observation is empty" },
      { id: "task-policy-set-action", type: "code", label: "Construct and commit the sampled-task action directly from selected_task." },
      { id: "task-policy-display-started", type: "display", label: "Display this committed action operation payload." },
      { id: "task-policy-completed", type: "code", label: "Return an empty action after receiving the final solution." },
      { id: "task-policy-terminate-completed", type: "terminate", label: "The final solution has been evaluated." },
    ],
  },
  {
    side: "source", kind: "reward", owner: "Task generator (task environment)", agentId: "905cdf83-5970-4598-8642-dea17852cc99",
    canvasId: "task-environment-price-trajectory-reward", name: "Thirty-day realized return", nodeCount: 8, edgeCount: 9,
    freeText: "Validate the completed screening JSON against final_output_format, then return the realized percentage price return over the matched next 30 calendar days.",
    nodes: [
      { id: "task-reward-start", type: "start", label: "Validate the completed screening decision against final_output_format, then return its matched 30-day realized percentage return." },
      { id: "task-reward-validate-format", type: "code", label: "Return 0 for an empty observation; otherwise validate it against final_output_format." },
      { id: "task-reward-format-valid", type: "condition", label: "reward_should_score is true" },
      { id: "task-reward-prepare-price-action", type: "code", label: "Prepare only the next 30 calendar days of price action." },
      { id: "task-reward-price-action-available", type: "condition", label: "future_price_action_available is true" },
      { id: "task-reward-zero-missing-trajectory", type: "code", label: "Return 0 when the matched 30-day price action is unavailable." },
      { id: "task-reward-score-decision", type: "code", label: "Return future_price_action_30d.return_pct as the scalar reward." },
      { id: "task-reward-calculate", type: "code", label: "Output the realized 30-day percentage return without clipping." },
    ],
  },
  {
    side: "target", kind: "state", owner: "Investment analyst", agentId: "task_performing_agent",
    canvasId: "starter-state-canvas", name: "stage1TargetState", nodeCount: 9, edgeCount: 9,
    freeText: "Receives the delivered task package as observation, reads only the provided context fields, and stores the final note fields before returning them.",
    nodes: [
      { id: "starter-state-start", type: "start", label: "Observe target-side task input" },
      { id: "starter-state-ingress-append", type: "code", label: "Add agent_latest_observation and agent_latest_reward to new_events." },
      { id: "starter-state-summary-gate", type: "condition", label: "memory_over_limit is true" },
      { id: "starter-state-update-summary", type: "prompt", label: "Update summary with a concise summary of summary plus new_events." },
      { id: "starter-state-clear-new-events", type: "code", label: "Set new_events to empty list." },
      { id: "starter-state-summary-gate-memory-size", type: "code", label: "Measure whether summary plus new_events exceeds 4000 characters." },
      { id: "a144e131-803f-4bcb-a229-060bb32f9c9d", type: "condition", label: "Has source delivered company task package" },
      { id: "b8925323-1f4f-4b72-9074-6c2763dd0801", type: "continue", label: "Await task package from source" },
      { id: "80547d08-8caf-4f67-8ae8-af62c01467ce", type: "prompt", label: "Prepare state values for initial_hypothesis, questions_requiring_investigation, reasons_not_to_continue, screening_decision and confidence" },
    ],
  },
  {
    side: "target", kind: "policy", owner: "Investment analyst", agentId: "task_performing_agent",
    canvasId: "starter-policy-canvas", name: "stage1TargetPolicy", nodeCount: 14, edgeCount: 15,
    freeText: "Analyst receives the company context, performs pragmatic screening, and returns one concise final note JSON with the required fields. Task-environment lifecycle contract: preserve the inferred policy and enforce the task handoff and terminal-output contract around it.",
    nodes: [
      { id: "starter-policy-start", type: "start", label: "Start screening task. Lifecycle contract: use the selected task profile as input, complete every policy step, send exactly one final response to the task environment." },
      { id: "7c25ee38", type: "prompt", label: "Review company profile and available context to orient on business and recent changes" },
      { id: "e7eb683d", type: "prompt", label: "Perform preliminary financial valuation and balance sheet screening" },
      { id: "3635e275", type: "condition", label: "Are recent disclosures available" },
      { id: "809e7341", type: "prompt", label: "Read the most decision-relevant disclosure sections selectively" },
      { id: "a424fe03", type: "continue", label: "Proceed without disclosure review" },
      { id: "7e6d9c3c", type: "condition", label: "Is peer or consensus context available" },
      { id: "3792279d", type: "prompt", label: "Test whether valuation quality and catalysts are already reflected in expectations" },
      { id: "a2b33ced", type: "continue", label: "Proceed without peer expectation check" },
      { id: "a390a5b0", type: "prompt", label: "Form initial hypothesis, key investigation questions, reasons not to continue, screening decision and confidence" },
      { id: "c1ba2fa3", type: "prompt", label: "Assemble the completed solution and send it as the sole final action to the task environment" },
      { id: "081abc16", type: "terminate_stage", label: "Finish after final note is sent" },
      { id: "df380f46", type: "prompt", label: "Action" },
      { id: "8d678036", type: "prompt", label: "Action" },
    ],
  },
  {
    side: "target", kind: "reward", owner: "Investment analyst", agentId: "task_performing_agent",
    canvasId: "starter-reward-canvas", name: "Task environment final solution quality", nodeCount: 3, edgeCount: 2,
    freeText: "The evaluator belongs to the task environment agent, which waits for the full workflow and scores only the final solution.",
    nodes: [
      { id: "starter-reward-start", type: "start", label: "Task environment agent's quality evaluator. Treat final_output_format as the authoritative JSON contract for agent_latest_observation." },
      { id: "starter-reward-default-score", type: "prompt", label: "Score the final observation against final_output_format." },
      { id: "starter-reward-calculate", type: "code", label: "Calculate the scalar reward value." },
    ],
  },
];

const KIND_COLOR: Record<string, string> = { state: "#4a6b8a", policy: "#7a5a2b", reward: "#5a7a4a" };
const KIND_ORDER: Record<string, number> = { state: 0, policy: 1, reward: 2 };

// The runtime loop for the reference draft — how the six canvases compose into one
// working system across the single stage. Bookends belong to the task generator.
const RUN_STEPS: { step: number; agent: "gen" | "analyst"; kind: "state" | "policy" | "reward"; canvas: string; action: string; emits: string }[] = [
  { step: 1, agent: "gen", kind: "state", canvas: "Task selection and state update", action: "Sample one complete task and its hidden 30-day price trajectory into state.", emits: "selected_task · selected_price_trajectory" },
  { step: 2, agent: "gen", kind: "policy", canvas: "Task lifecycle", action: "Commit the sampled task as the turn's action and hand the company task package to the analyst.", emits: "company task package → analyst observation" },
  { step: 3, agent: "analyst", kind: "state", canvas: "stage1TargetState", action: "Receive the task package as observation; read only the provided context fields.", emits: "company_profile · disclosures · peer context" },
  { step: 4, agent: "analyst", kind: "policy", canvas: "stage1TargetPolicy", action: "Screen the company — profile, valuation, disclosures, peers — then form hypothesis, decision, confidence and send one final-note JSON back.", emits: "final note JSON → task environment" },
  { step: 5, agent: "gen", kind: "reward", canvas: "Thirty-day realized return", action: "Validate the final note against final_output_format, then score it with the realized 30-day percentage return.", emits: "scalar reward (return_pct)" },
];

const NODE_TYPE_LABEL: Record<string, string> = {
  start: "START", code: "CODE", prompt: "PROMPT", condition: "IF", tool_call: "TOOL",
  display: "DISPLAY", terminate: "END", terminate_stage: "END STAGE", continue: "CONTINUE",
};

// The work breakdown from the brief, plus current status against the audit.
type TaskStatus = "done" | "next" | "blocked" | "todo";
const TASKS: { id: string; title: string; status: TaskStatus; desc: string; acceptance?: string }[] = [
  {
    id: "Task 0", title: "Schema audit (read-only, blocking)", status: "done",
    desc: "Establish ground truth before any migration: dump the draft columns and the reference row; dump every *_canvases schema and confirm the (setup_table, setup_id, canvas_id) uniqueness; enumerate all agent_connections for the draft; confirm the six canvas JSON fields share one shape; determine what state_policy_canvases means vs policy_canvases.",
    acceptance: "A written schema note; do not proceed without sign-off.",
  },
  {
    id: "Task 1", title: "Resolve canvas_id collisions", status: "done",
    desc: "canvas_id is reused for distinct canvases (e.g. starter-state-canvas for both source and target state), disambiguated only by JSON path — the mechanical cause of the flattened tab bar. Decide the canonical identity for a canvas, write a collision report across all drafts, and decide whether to rewrite colliding ids or introduce a compound key (checking stored references first).",
    acceptance: "No two canvases resolvable by the same key return different payloads.",
  },
  {
    id: "Task 2", title: "Promote agents to first-class", status: "blocked",
    desc: "Agent identity is implied today by the source_/target_ prefix inside one connection — a relationship, not an entity. Add an agents collection to the draft; each agent gets a stable id, name, ordering, and slots for state_schema, state_canvas, policy_canvas, reward_canvas. Mark exactly one agent as the task generator via a kind/role marker (a runtime type marker, not a nav grouping). Reduce connections to pairwise interaction canvases only.",
    acceptance: "The reference draft expresses as two agents + one connection, where the connection carries only interaction canvases and each agent owns its four canvases.",
  },
  {
    id: "Task 3", title: "Backfill migration", status: "todo",
    desc: "Move the reference draft, then every draft, to the Task 2 shape. Reversible, with a dry-run mode that reports the plan without writing; snapshot every affected row before mutation; run on the reference draft first and diff the rendered result. Reconcile the two state-drift cases rather than merging blindly.",
    acceptance: "No canvas payload is lost, and every canvas resolves to exactly one owning agent or to the workflow.",
  },
  {
    id: "Task 4", title: "Change the master agent's output contract", status: "todo",
    desc: "The General Orchestration Daemon currently emits agent-owned canvases into connection source_/target_ fields and would recreate the old shape on the next generation. Update the generation contract to emit an agents array with per-agent canvases plus connections carrying only pairwise interaction canvases; assign unique canvas_ids per agent scope; name the task generator explicitly; add a validator that rejects agent-owned canvas kinds appearing inside a connection.",
    acceptance: "Regenerating the analyst agent produces the Task 2 shape with no migration needed.",
  },
  {
    id: "Task 5", title: "Setup pane: rename + add the agent tier", status: "todo",
    desc: "Rename the first tab Model Setup → Setup. Insert an agent selector row between the top-level tabs and the canvas-type tabs, one entry per agent in stored order (task generator as a peer). Selecting an agent scopes everything below; persist selection per draft. Handle one-agent and many-agent (scroll/wrap, up to ten) cases. Add an affordance to create an agent (never a second task generator).",
    acceptance: "The reference draft shows exactly two entries — Task generator and the analyst — and switching changes the canvases below.",
  },
  {
    id: "Task 6", title: "Replace Knowledge with Reward", status: "todo",
    desc: "Remove the Knowledge tab from the canvas-type row and add Reward, wired to the agent's reward canvas. Add State schema as its own tab if that open question resolves that way. Repoint or remove anything reading the Knowledge tab.",
    acceptance: "The task generator's Reward tab shows 'Thirty-day realized return'; the analyst's shows 'Task environment final solution quality'.",
  },
  {
    id: "Task 7", title: "Datasets and files per agent", status: "todo",
    desc: "Datasets and price trajectories are referenced by canvases but have no pane representation. Attach the 'add guidelines' and 'add files' affordances to the selected agent rather than the draft globally; surface what is currently attached; keep the label generic (a dataset might be a price trajectory or anything else).",
    acceptance: "A dataset attached under Agent 1 does not appear under the task generator.",
  },
  {
    id: "Task 8", title: "Re-scope the workflow canvas", status: "todo",
    desc: "After Task 3, the re-homed canvases must stop rendering in the workflow tab bar. Have it render only workflow_canvases plus pairwise interaction canvases. Rewrite workflow-overview to express the generic recipe: N stages; at stage 1 the task generator picks a task and hands it off; agents run their own canvases across stages 2…N; at the final stage the solution returns to the task generator, which computes the result. Show which agent is active per stage and the handoff edges.",
    acceptance: "The workflow tab bar shows Overall Workflow and any genuine interaction canvases, and nothing else.",
  },
  {
    id: "Task 9", title: "Compiler and runtime routing", status: "todo",
    desc: "Resolve canvases through the agent tier rather than the flat namespace. Implement the bookends explicitly: task generator issues the task at stage 1 and scores the returned solution at stage N. Confirm the single-stage collapse works. Confirm simulation runs pick agents from the agents collection and that a conversation (one agent + a counterpart) is the same code path with a different agent count.",
    acceptance: "The reference draft runs end to end and produces the same result as before the migration.",
  },
  {
    id: "Task 10", title: "Verification", status: "todo",
    desc: "Diff pre- and post-migration canvas payloads for the reference draft; every payload accounted for. Load the pane and confirm the nav renders as specified. Regenerate the analyst agent through the daemon and confirm it lands in the correct shape with no manual fixup. Confirm no stale source_/target_ agent-owned fields remain in connections.",
  },
];

// Right-rail navigation tree: every section + a one-line description.
const TOC: { id: string; label: string; desc: string; accent?: boolean }[] = [
  { id: "top", label: "Overview", desc: "Project, draft, connection, stage." },
  { id: "open", label: "Questions for Yasin", desc: "Two decisions needed before Task 2 / 5.", accent: true },
  { id: "tldr", label: "TL;DR", desc: "The six audit corrections to the plan." },
  { id: "plan", label: "The work breakdown", desc: "Task 0 → Task 10, with status." },
  { id: "models", label: "1 · Storage models", desc: "Legacy demos vs the daemon; why it's a JSONB restructure." },
  { id: "entities", label: "2 · Entity model", desc: "The two agents and their distinctive state fields." },
  { id: "compose", label: "3 · Composition & loop", desc: "Two agents, six canvases, the run loop." },
  { id: "collisions", label: "4 · Collisions", desc: "440 canvases; 59 → 0 under the canonical key." },
  { id: "ownership", label: "5 · Ownership", desc: "State agent-owned; policy/reward per-connection." },
  { id: "decisions", label: "6 · Decisions", desc: "Canonical key; no id rewrite; reconciliations." },
  { id: "process", label: "7 · Process", desc: "The read-only queries that were run." },
];

const STATUS_STYLE: Record<TaskStatus, { label: string; bg: string; fg: string }> = {
  done: { label: "DONE", bg: "#4a6b2a", fg: "#fff" },
  next: { label: "NEXT", bg: "#8a5a2b", fg: "#fff" },
  blocked: { label: "BLOCKED", bg: "#9a3b2f", fg: "#fff" },
  todo: { label: "TODO", bg: "#cfccbe", fg: "#4a463c" },
};

function Chip({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      fontSize: 11, fontFamily: "var(--font-mono, monospace)", letterSpacing: 0.3,
      padding: "1px 6px", borderRadius: 0, border: `1px solid ${color ?? SEPIA_LINE}`,
      color: color ?? SEPIA_MUTED, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function CanvasCardView({ c, showOwner = true }: { c: CanvasCard; showOwner?: boolean }) {
  const collides = c.canvasId === "starter-state-canvas";
  return (
    <div style={{ background: "#eeecdf", border: `1px solid ${SEPIA_LINE}`, borderRadius: 0, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: "#fff", background: KIND_COLOR[c.kind], padding: "2px 7px", borderRadius: 0, textTransform: "uppercase" }}>{c.kind}</span>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</span>
        {showOwner ? <span style={{ fontSize: 11.5, color: SEPIA_MUTED }}>owner: {c.owner}</span> : null}
        <span style={{ marginLeft: "auto", fontSize: 11.5, color: SEPIA_MUTED }}>{c.nodeCount} nodes · {c.edgeCount} edges</span>
      </div>
      <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, marginTop: 5, color: collides ? WARN : SEPIA_MUTED }}>
        canvas_id: {c.canvasId}{collides ? "  ← collides" : ""}
      </div>
      {c.freeText ? (
        <p style={{ fontSize: 12.5, color: SEPIA_TEXT, marginTop: 8, lineHeight: 1.5, fontStyle: "italic", borderLeft: `1px solid ${SEPIA_LINE}`, paddingLeft: 9 }}>{c.freeText}</p>
      ) : null}
      <details style={{ marginTop: 8 }}>
        <summary style={{ cursor: "pointer", fontSize: 12, color: ACCENT }}>graph nodes ({c.nodeCount})</summary>
        <ol style={{ marginTop: 7, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
          {c.nodes.map((n, i) => (
            <li key={n.id + i} style={{ display: "flex", gap: 8, fontSize: 12, lineHeight: 1.4 }}>
              <span style={{ minWidth: 72, fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: SEPIA_MUTED, paddingTop: 1 }}>{NODE_TYPE_LABEL[n.type] ?? n.type}</span>
              <span>{n.label}</span>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}

function AgentColumn({ agent, canvases }: { agent: typeof AGENTS[number]; canvases: CanvasCard[] }) {
  const accent = agent.connectionSide === "source" ? "#7a5a2b" : "#4a6b8a";
  return (
    <div style={{ background: SEPIA_PANEL, border: `1px solid ${accent}`, borderRadius: 0, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: accent }}>{agent.role}</span>
          <Chip color={accent}>{agent.connectionSide}</Chip>
        </div>
        <div style={{ fontSize: 12, color: SEPIA_MUTED, marginTop: 3 }}>{agent.title}</div>
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10.5, marginTop: 4, color: SEPIA_MUTED }}>id: {agent.id}</div>
      </div>
      {canvases.map((c) => <CanvasCardView key={`${c.side}-${c.kind}`} c={c} showOwner={false} />)}
    </div>
  );
}

function Section({ id, n, title, children }: { id: string; n: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginTop: 40, scrollMarginTop: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: SEPIA_TEXT, borderBottom: `1px solid ${SEPIA_LINE}`, paddingBottom: 8, marginBottom: 16 }}>
        <span style={{ color: ACCENT, fontFamily: "var(--font-mono, monospace)", marginRight: 10 }}>{n}</span>{title}
      </h2>
      {children}
    </section>
  );
}

export default function SystemPage() {
  return (
    // html/body are scroll-locked globally (globals.css: overflow hidden, height 100vh),
    // so this page must be its own vertical scroll container.
    <main style={{ background: SEPIA_BG, color: SEPIA_TEXT, height: "100dvh", overflowY: "auto", WebkitOverflowScrolling: "touch", scrollBehavior: "smooth", fontFamily: "var(--font-sans)" }}>
      {/* Content spans from just past the left nav out to (right edge − 70px). */}
      <div style={{ marginLeft: 320, marginRight: 70, padding: "48px 0 96px" }}>

        {/* Header */}
        <header id="top" style={{ scrollMarginTop: 16 }}>
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12, color: SEPIA_MUTED, letterSpacing: 1 }}>
            AIR LAB · SETUP PANE REWORK · SYSTEM REPORT
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 700, marginTop: 8, lineHeight: 1.2 }}>
            Agent-first Setup pane — schema audit &amp; canvas identity
          </h1>
          <p style={{ color: SEPIA_MUTED, marginTop: 10, fontSize: 15, lineHeight: 1.6 }}>
            Read-only ground truth for Task&nbsp;0 (schema audit) and Task&nbsp;1 (canvas identity / collision
            analysis), rendered against the reference <strong>investment analyst</strong> draft. All figures
            come from live read-only SQL against the scoped Supabase surface — not the service-role key.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 16px", marginTop: 18, fontSize: 13, background: SEPIA_PANEL, border: `1px solid ${SEPIA_LINE}`, borderRadius: 0, padding: 16 }}>
            <span style={{ color: SEPIA_MUTED }}>Project</span><span style={{ fontFamily: "var(--font-mono, monospace)" }}>{REFERENCE.project}</span>
            <span style={{ color: SEPIA_MUTED }}>Draft</span><span style={{ fontFamily: "var(--font-mono, monospace)" }}>{REFERENCE.draftId}</span>
            <span style={{ color: SEPIA_MUTED }}>Config</span><span>{REFERENCE.configName}</span>
            <span style={{ color: SEPIA_MUTED }}>Connection</span><span style={{ fontFamily: "var(--font-mono, monospace)" }}>{REFERENCE.connectionId}</span>
            <span style={{ color: SEPIA_MUTED }}>Stage</span><span>{REFERENCE.stage} <span style={{ color: SEPIA_MUTED }}>(single stage)</span></span>
          </div>
        </header>

        {/* Questions for Yasin — surfaced first: these block Task 2 / 5. */}
        <section id="open" style={{ marginTop: 32, scrollMarginTop: 16 }}>
          <div style={{ background: "#f3ecd9", border: `1px solid ${ACCENT}`, borderRadius: 0, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: "#fff", background: ACCENT, padding: "2px 9px", borderRadius: 0 }}>ACTION</span>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: SEPIA_TEXT }}>Questions for Yasin — needed before Task 2 / 5</h2>
            </div>
            <p style={{ fontSize: 13.5, color: SEPIA_MUTED, marginTop: 8, lineHeight: 1.55 }}>
              Two decisions gate the agent tier and the canvas-slot shape. Everything downstream (nav, migration, generation contract) depends on them.
            </p>
            <ol style={{ paddingLeft: 20, lineHeight: 1.7, fontSize: 14.5, marginTop: 12, marginBottom: 0 }}>
              <li style={{ marginBottom: 10 }}>
                <strong>Policy/reward for multi-connection agents:</strong> rendered per-interaction under the agent
                (a counterpart/stage sub-selector inside the Policy tab), or moved onto the connection? Blocks the
                canvas-slot shape and the nav. <span style={{ color: ACCENT }}>Recommendation: agent-scoped with a per-interaction sub-selector.</span>
              </li>
              <li>
                <strong>State schema vs state canvas:</strong> <code>state_fields</code> already lives once per binding,
                which argues it is a property of the agent rendered as its own tab. <span style={{ color: ACCENT }}>Confirm.</span>
              </li>
            </ol>
          </div>
        </section>

        {/* TL;DR */}
        <Section id="tldr" n="TL;DR" title="What the audit changed">
          <ol style={{ paddingLeft: 20, lineHeight: 1.65, fontSize: 14.5 }}>
            <li><code>agent_connections</code> is a <strong>JSONB column</strong> on the draft, not a table. There is <strong>no <code>reward_canvases</code> table</strong>; reward lives inside the connection.</li>
            <li>The daemon stores agents in <code>agent_bindings</code> and all policy/state/reward canvases <strong>inside <code>agent_connections</code></strong>. It only writes <code>workflow_canvases</code> at top level.</li>
            <li><strong>No daemon draft</strong> has any top-level <code>policy_canvases</code> / <code>state_policy_canvases</code> / <code>state_system_canvases</code> row. The top-level rows the plan worried about belong to the legacy single-agent demos (<code>analyst_inputs</code>, <code>law_inputs</code>, <code>sleep_inputs</code>, …), a separate namespace.</li>
            <li>A two-agent collection <strong>already exists</strong> in <code>agent_bindings</code> — but with <strong>no reward slot</strong>.</li>
            <li><code>canvas_id</code> is a <strong>template seed, not an identity</strong>. Under it, 59 canvases collide. The verified canonical key is <code>(draft_id, connection_id, side, kind)</code> → 0 collisions.</li>
            <li><strong>State is agent-owned; policy and reward are interaction-scoped</strong> (one per connection). That refines the plan&apos;s &ldquo;each agent owns four canvases&rdquo; and is invisible in this single-connection reference draft.</li>
          </ol>
        </Section>

        {/* Work breakdown */}
        <Section id="plan" n="PLAN" title="The work breakdown (Task 0 → Task 10)">
          <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 14, color: SEPIA_MUTED }}>
            The agent-first Setup pane rework, task by task. Status reflects where the audit has taken us: Task&nbsp;0
            and Task&nbsp;1 are complete; Task&nbsp;2 is blocked on the two open questions in §7.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {TASKS.map((t) => {
              const s = STATUS_STYLE[t.status];
              return (
                <div key={t.id} style={{ background: SEPIA_PANEL, border: `1px solid ${SEPIA_LINE}`, borderRadius: 0, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12, color: ACCENT, fontWeight: 700 }}>{t.id}</span>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{t.title}</span>
                    <span style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, color: s.fg, background: s.bg, padding: "2px 8px", borderRadius: 0 }}>{s.label}</span>
                  </div>
                  <p style={{ fontSize: 13, color: SEPIA_TEXT, marginTop: 8, lineHeight: 1.55 }}>{t.desc}</p>
                  {t.acceptance ? (
                    <p style={{ fontSize: 12.5, color: SEPIA_MUTED, marginTop: 6, lineHeight: 1.5 }}>
                      <strong style={{ color: SEPIA_TEXT }}>Acceptance:</strong> {t.acceptance}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Section>

        {/* Two storage models */}
        <Section id="models" n="1" title="Two parallel storage models share the canvas tables">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: SEPIA_PANEL, border: `1px solid ${SEPIA_LINE}`, borderRadius: 0, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Legacy single-agent demos</div>
              <div style={{ fontSize: 13, color: SEPIA_MUTED, lineHeight: 1.6 }}>
                <code>analyst_inputs</code>, <code>law_inputs</code>, <code>sleep_inputs</code>, <code>nutrition</code>, <code>dnd_inputs</code>, <code>research_assistant_inputs</code>.
                Canvases are <strong>top-level rows</strong> in the <code>*_canvases</code> tables, keyed <code>(setup_table, setup_id, canvas_id)</code>.
              </div>
            </div>
            <div style={{ background: SEPIA_PANEL, border: `1px solid ${ACCENT}`, borderRadius: 0, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>The multi-agent daemon <span style={{ color: ACCENT }}>(this work)</span></div>
              <div style={{ fontSize: 13, color: SEPIA_MUTED, lineHeight: 1.6 }}>
                <code>general_orchestration_daemon_drafts</code>. Agents in <code>agent_bindings</code>; all policy/state/reward canvases <strong>inside <code>agent_connections</code> JSONB</strong>. Only <code>workflow_canvases</code> is used at top level (44 rows).
              </div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: SEPIA_MUTED, marginTop: 12 }}>
            Consequence: the daemon migration is a <strong>JSONB restructure inside one table</strong>, not a cross-table move. Only <code>policy_canvases</code> enforces the <code>(setup_table, setup_id, canvas_id)</code> unique constraint; the other three do not — but the daemon never writes agent canvases there, so no DB constraint change is needed for this path.
          </p>
        </Section>

        {/* Entity model */}
        <Section id="entities" n="2" title="Entity model of the reference draft">
          <p style={{ fontSize: 14.5, lineHeight: 1.6, marginBottom: 14 }}>
            Two agents in <code>agent_bindings</code>, one connection between them, one stage. The connection&apos;s
            {" "}<code>source_*</code> fields belong to the task generator; <code>target_*</code> to the analyst.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {AGENTS.map((a) => (
              <div key={a.id} style={{ background: SEPIA_PANEL, border: `1px solid ${SEPIA_LINE}`, borderRadius: 0, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <div style={{ fontWeight: 600 }}>{a.role}</div>
                  <Chip color={ACCENT}>{a.connectionSide}</Chip>
                </div>
                <div style={{ fontSize: 12.5, color: SEPIA_MUTED, marginTop: 4 }}>{a.title}</div>
                <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11.5, marginTop: 8, color: SEPIA_TEXT }}>id: {a.id}</div>
                <div style={{ fontSize: 12, color: SEPIA_MUTED, marginTop: 10 }}>distinctive state fields</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                  {a.distinctiveState.map((f) => <Chip key={f}>{f}</Chip>)}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Composed system: agents + canvases + loop */}
        <Section id="compose" n="3" title="How the investment analyst composes — two agents, six canvases, one loop">
          <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            The six canvases are not a flat list — they are two agents, each owning a
            {" "}<strong>state / policy / reward</strong> triplet, wired by one connection. Every canvas shares the wrapper
            {" "}<code>{`{ activeId, version, canvases:[{ id, name, freeText, graph }] }`}</code>. Grouped by owner, the system reads as:
          </p>

          {/* Two-agent composition with a center handoff */}
          {(() => {
            const gen = CANVASES.filter((c) => c.side === "source").sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
            const analyst = CANVASES.filter((c) => c.side === "target").sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
            const columns: { agent: typeof AGENTS[number]; canvases: CanvasCard[] }[] = [
              { agent: AGENTS[0], canvases: gen },
              { agent: AGENTS[1], canvases: analyst },
            ];
            return (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "stretch" }}>
                  {/* Task generator column */}
                  <AgentColumn agent={columns[0].agent} canvases={columns[0].canvases} />
                  {/* Center connection / handoff */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 130, padding: "0 4px" }}>
                    <div style={{ fontSize: 10.5, fontFamily: "var(--font-mono, monospace)", color: SEPIA_MUTED, textAlign: "center", letterSpacing: 0.3 }}>connection</div>
                    <div style={{ fontSize: 10, fontFamily: "var(--font-mono, monospace)", color: SEPIA_MUTED, textAlign: "center", marginTop: 2 }}>93c45cc3…</div>
                    <div style={{ width: "100%", borderTop: `1px dashed ${SEPIA_LINE}`, margin: "10px 0" }} />
                    <div style={{ fontSize: 11.5, color: ACCENT, textAlign: "center", lineHeight: 1.4 }}>→ task package</div>
                    <div style={{ fontSize: 11.5, color: ACCENT, textAlign: "center", lineHeight: 1.4, marginTop: 4 }}>← final note</div>
                    <div style={{ width: "100%", borderTop: `1px dashed ${SEPIA_LINE}`, margin: "10px 0" }} />
                    <div style={{ fontSize: 10.5, color: SEPIA_MUTED, textAlign: "center" }}>stage: {REFERENCE.stage}</div>
                  </div>
                  {/* Analyst column */}
                  <AgentColumn agent={columns[1].agent} canvases={columns[1].canvases} />
                </div>

                <div style={{ background: "#f3ecd9", border: `1px solid ${WARN}`, borderRadius: 0, padding: "10px 14px", fontSize: 13, color: SEPIA_TEXT, marginTop: 16 }}>
                  <strong style={{ color: WARN }}>Collision:</strong> the two <span style={{ fontWeight: 600 }}>state</span> canvases across the columns share
                  {" "}<code>canvas_id = starter-state-canvas</code> — different canvases, one id, disambiguated only by JSON path. The canonical key
                  {" "}<code>(draft_id, connection_id, side, kind)</code> separates them.
                </div>
              </>
            );
          })()}

          {/* Runtime loop */}
          <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 26, marginBottom: 4 }}>The run loop (single stage)</h3>
          <p style={{ fontSize: 13, color: SEPIA_MUTED, marginBottom: 14, lineHeight: 1.55 }}>
            One stage, so both bookends collapse into it: the task generator issues the task, the analyst solves it, the task generator scores the result.
          </p>
          <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 0 }}>
            {RUN_STEPS.map((s, i) => {
              const isGen = s.agent === "gen";
              return (
                <li key={s.step}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", alignSelf: "stretch" }}>
                      <span style={{ width: 26, height: 26, borderRadius: "50%", background: isGen ? "#7a5a2b" : "#4a6b8a", color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.step}</span>
                      {i < RUN_STEPS.length - 1 ? <span style={{ flex: 1, width: 2, background: SEPIA_LINE, minHeight: 18 }} /> : null}
                    </div>
                    <div style={{ paddingBottom: 16, flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: isGen ? "#7a5a2b" : "#4a6b8a" }}>{isGen ? "Task generator" : "Investment analyst"}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: "#fff", background: KIND_COLOR[s.kind], padding: "1px 6px", borderRadius: 0, textTransform: "uppercase" }}>{s.kind}</span>
                        <span style={{ fontSize: 12.5, color: SEPIA_MUTED }}>{s.canvas}</span>
                      </div>
                      <div style={{ fontSize: 13.5, lineHeight: 1.5, marginTop: 4 }}>{s.action}</div>
                      <div style={{ fontSize: 12, color: ACCENT, marginTop: 4, fontFamily: "var(--font-mono, monospace)" }}>emits: {s.emits}</div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Section>

        {/* Collision analysis */}
        <Section id="collisions" n="4" title="Task 1 — canvas identity & collisions (all 46 drafts)">
          <p style={{ fontSize: 14.5, lineHeight: 1.6 }}>
            440 canvas instances across 46 drafts. Collision = same resolution key returns a different payload.
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: "left", color: SEPIA_MUTED, borderBottom: `1px solid ${SEPIA_LINE}` }}>
                <th style={{ padding: "6px 8px" }}>Resolution key</th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>Colliding keys</th>
                <th style={{ padding: "6px 8px" }}>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["canvas_id (today's UI key)", "59", "flattens the tab bar", false],
                ["(agent_id, kind, canvas_id) — the plan's proposal", "26", "insufficient", false],
                ["+ stage_id", "8", "still insufficient", false],
                ["(draft_id, connection_id, side, kind)", "0", "canonical ✓", true],
              ].map(([k, v, note, ok]) => (
                <tr key={k as string} style={{ borderBottom: `1px solid ${SEPIA_LINE}55`, background: ok ? "#e7edd9" : "transparent" }}>
                  <td style={{ padding: "6px 8px", fontFamily: "var(--font-mono, monospace)", fontSize: 12.5 }}>{k}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: ok ? "#4a6b2a" : WARN }}>{v}</td>
                  <td style={{ padding: "6px 8px", color: SEPIA_MUTED }}>{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 13, color: SEPIA_MUTED, marginTop: 10, lineHeight: 1.6 }}>
            The plan&apos;s <code>(agent_id, kind, canvas_id)</code> leaves 26 collisions; adding <code>stage_id</code> leaves 8
            (one agent talks to several counterparts within a single stage). Only the connection scope disambiguates.
            <code>draft_id</code> is mandatory — 6 connection UUIDs are reused across clone drafts (51 distinct ids across 75 connection rows).
          </p>
        </Section>

        {/* Ownership model */}
        <Section id="ownership" n="5" title="Ownership — the finding that refines the plan">
          <p style={{ fontSize: 14.5, lineHeight: 1.6 }}>
            For agents that appear in more than one connection (13 agent-groups per kind), payload divergence by kind:
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: "left", color: SEPIA_MUTED, borderBottom: `1px solid ${SEPIA_LINE}` }}>
                <th style={{ padding: "6px 8px" }}>kind</th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>identical across conns</th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>divergent per conn</th>
                <th style={{ padding: "6px 8px" }}>⇒ ownership</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["policy", "1", "12", "interaction-scoped (per connection)"],
                ["reward", "1", "12", "interaction-scoped (per connection)"],
                ["state", "11", "2", "agent-owned (one per agent)"],
              ].map(([k, same, div, own]) => (
                <tr key={k} style={{ borderBottom: `1px solid ${SEPIA_LINE}55` }}>
                  <td style={{ padding: "6px 8px" }}><span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: KIND_COLOR[k], padding: "1px 7px", borderRadius: 0, textTransform: "uppercase" }}>{k}</span></td>
                  <td style={{ padding: "6px 8px", textAlign: "right" }}>{same}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700 }}>{div}</td>
                  <td style={{ padding: "6px 8px", color: SEPIA_MUTED }}>{own}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 13, color: SEPIA_MUTED, marginTop: 10, lineHeight: 1.6 }}>
            The divergence is semantic: the CBT-I <code>therapist</code> agent has 12 distinct policy canvases named
            {" "}<em>&ldquo;&lt;stage&gt;: Interaction with &lt;counterpart&gt;&rdquo;</em>. So &ldquo;each agent owns four canvases&rdquo; is true
            only for single-connection agents like this reference draft. For a multi-connection agent, &ldquo;the Policy tab&rdquo;
            is N canvases, not one.
          </p>
        </Section>

        {/* Decision */}
        <Section id="decisions" n="6" title="Decisions">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["Canonical identity", "(draft_id, connection_id, side, kind) for interaction canvases; (draft_id, agent_id, 'state') for the agent-owned state canvas. canvas_id retained only as a label."],
              ["Do NOT rewrite canvas_id", "Use the compound key. canvas_id is referenced across ~30 compiler/runtime/UI files plus the per-slot activeId pointer; rewriting 440 seeds risks breaking those references and buys nothing the compound key doesn't."],
              ["Reconcile 2 state drift cases", "task_environment_agent (9a0bd903) and investment_analyst (fe410505) have divergent state across their own connections. Pick the stage-1 canvas; log the discarded variant in the migration snapshot."],
              ["Human-readable ids later", "Have the daemon emit unique ids for NEW output (Task 4) — no historical backfill; the resolver keys on the tuple, not the string."],
            ].map(([t, d]) => (
              <div key={t} style={{ borderLeft: `3px solid ${ACCENT}`, paddingLeft: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{t}</div>
                <div style={{ fontSize: 13, color: SEPIA_MUTED, marginTop: 2, lineHeight: 1.55 }}>{d}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Process log */}
        <Section id="process" n="7" title="Process — read-only queries run">
          <ol style={{ paddingLeft: 20, lineHeight: 1.7, fontSize: 13.5, color: SEPIA_MUTED }}>
            <li>Identified project from <code>NEXT_PUBLIC_AIRLAB_SUPABASE_URL</code>; confirmed the MCP surface uses a scoped token, not the service-role key.</li>
            <li>Dumped columns of <code>general_orchestration_daemon_drafts</code> and every <code>*_canvases</code> table; enumerated unique constraints.</li>
            <li>Probed the reference draft&apos;s JSONB shape (connection keys, agent_bindings, interaction_protocol) without dumping full payloads.</li>
            <li>Extracted the six connection canvases&apos; <code>(canvas_id, name, wrapper shape)</code> and the two agents&apos; state schemas.</li>
            <li>Cross-draft scan of all ~85 drafts: connection/agent counts, top-level canvas counts, canvas-table usage by <code>setup_table</code>.</li>
            <li>Collision analysis over 440 canvas instances under four candidate keys; per-kind ownership split; verified 0 collisions under the canonical key.</li>
          </ol>
          <p style={{ fontSize: 12.5, color: SEPIA_MUTED, marginTop: 14 }}>
            Full write-ups: <code>docs/air-lab/task0-schema-audit.md</code> · <code>docs/air-lab/task1-collision-report.md</code>.
            No rows were mutated.
          </p>
        </Section>

      </div>

      {/* Right-rail navigation tree — fixed to the viewport's right edge, transparent, tree-styled */}
      <nav
        aria-label="On this page"
        style={{
          position: "fixed", top: 24, left: 28, width: 260,
          maxHeight: "calc(100dvh - 48px)", overflowY: "auto",
          background: "transparent",
        }}
      >
        <div style={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", letterSpacing: 1, color: SEPIA_MUTED, marginBottom: 12 }}>
          ON THIS PAGE
        </div>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {TOC.map((t, i) => {
            const isLast = i === TOC.length - 1;
            return (
              <li key={t.id} style={{ display: "flex", alignItems: "stretch" }}>
                {/* tree connector: continuous trunk + branch tick */}
                <div style={{ position: "relative", width: 18, flexShrink: 0 }}>
                  <div style={{ position: "absolute", left: 0, top: 0, width: 1, background: SEPIA_LINE, ...(isLast ? { height: 13 } : { bottom: 0 }) }} />
                  <div style={{ position: "absolute", left: 0, top: 12, width: 12, height: 1, background: SEPIA_LINE }} />
                </div>
                <a
                  href={`#${t.id}`}
                  style={{
                    display: "block", textDecoration: "none", background: "transparent",
                    WebkitTapHighlightColor: "transparent", padding: "1px 0 14px 8px", color: SEPIA_TEXT,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: t.accent ? ACCENT : SEPIA_TEXT }}>{t.label}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: SEPIA_MUTED, lineHeight: 1.4, marginTop: 2, fontWeight: 600 }}>{t.desc}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </main>
  );
}
