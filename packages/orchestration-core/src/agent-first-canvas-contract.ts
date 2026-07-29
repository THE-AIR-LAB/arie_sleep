// Agent-first canvas output contract (Task 4).
//
// Codifies the generation shape the General Orchestration Daemon must emit so
// that regenerating a workflow produces the normalized canvas store directly
// (docs/air-lab/task2/§6 recommendation) — no backfill needed. Left alone, the
// daemon re-emits agent-owned canvases into connection source_/target_ fields
// and undoes the Task 3 migration.
//
// This module is PURE and ADDITIVE: importing it changes no runtime behavior.
// Wire validateAgentFirstOutput() into the generation persistence path once the
// compiler resolves canvases through the agent tier (Task 9). Until then it is a
// self-check the generator can run against its own output.

export type CanvasKind = "state" | "policy" | "reward" | "workflow";
export type CanvasOwnerType = "agent" | "connection" | "workflow";
export type ConnectionSide = "source" | "target";

export interface AgentFirstAgent {
  /** Stable slug, unique within the draft. */
  agentKey: string;
  name: string;
  /** Type marker for the runtime bookends (Task 9) — NOT a nav grouping. */
  role: "task_generator" | "agent";
  sortOrder: number;
  /** The agent's state schema (state_fields), kept as an agent property. */
  stateSchema?: unknown;
}

export interface AgentFirstConnection {
  /** Stable slug, unique within the draft. */
  connectionKey: string;
  sourceAgentKey: string;
  targetAgentKey: string;
  workflowStageId?: string;
  workflowStageName?: string;
  sortOrder: number;
}

export interface AgentFirstCanvas {
  /** Authoritative identity; unique per draft. See buildCanvasSourcePath(). */
  sourcePath: string;
  canvasKind: CanvasKind;
  ownerType: CanvasOwnerType;
  /** Set when ownerType === "agent". */
  ownerAgentKey?: string;
  /** Set when ownerType === "connection". */
  ownerConnectionKey?: string;
  /** Set (source|target) when ownerType === "connection". */
  side?: ConnectionSide | null;
  name: string;
  /** Non-authoritative display/seed label only. */
  canvasId?: string;
  /** The graph document — { nodes, edges }. */
  canvas: unknown;
  freeText?: string;
}

export interface AgentFirstOutput {
  agents: AgentFirstAgent[];
  connections: AgentFirstConnection[];
  canvases: AgentFirstCanvas[];
}

export interface ContractViolation {
  code: string;
  message: string;
}

export interface ContractValidation {
  ok: boolean;
  errors: ContractViolation[];
}

// Canvas payload fields that must NEVER appear embedded inside a connection in
// the agent-first output (both camelCase runtime and snake_case row forms).
const EMBEDDED_CANVAS_FIELD_KEYS = [
  "sourcePolicyCanvases",
  "sourceStatePolicyCanvases",
  "sourceRewardCanvases",
  "targetPolicyCanvases",
  "targetStatePolicyCanvases",
  "targetRewardCanvases",
  "policyCanvases",
  "source_policy_canvases",
  "source_state_policy_canvases",
  "source_reward_canvases",
  "target_policy_canvases",
  "target_state_policy_canvases",
  "target_reward_canvases",
  "policy_canvases",
] as const;

/**
 * Build the unique, path-addressable identity for a canvas (Task 1's rule:
 * unique per agent/connection scope, never the reused "starter-*" seed id).
 */
export function buildCanvasSourcePath(
  draftId: string,
  canvas: Pick<AgentFirstCanvas, "canvasKind" | "ownerType" | "ownerAgentKey" | "ownerConnectionKey" | "side">
): string {
  switch (canvas.ownerType) {
    case "agent":
      return `drafts/${draftId}/agents/${canvas.ownerAgentKey}/${canvas.canvasKind}`;
    case "connection":
      return `drafts/${draftId}/connections/${canvas.ownerConnectionKey}/${canvas.side}/${canvas.canvasKind}`;
    case "workflow":
      return `drafts/${draftId}/workflow`;
  }
}

/**
 * Validate daemon output against the agent-first contract. Rejects output that
 * would re-create the old embedded shape. Returns every violation found so the
 * generator can repair or regenerate.
 */
export function validateAgentFirstOutput(output: AgentFirstOutput): ContractValidation {
  const errors: ContractViolation[] = [];
  const push = (code: string, message: string) => errors.push({ code, message });

  const agents = output.agents ?? [];
  const connections = output.connections ?? [];
  const canvases = output.canvases ?? [];

  const agentKeys = new Set<string>();
  for (const a of agents) {
    if (agentKeys.has(a.agentKey)) push("DUP_AGENT_KEY", `Duplicate agent_key "${a.agentKey}".`);
    agentKeys.add(a.agentKey);
  }

  const connectionKeys = new Set<string>();
  for (const c of connections) {
    if (connectionKeys.has(c.connectionKey)) push("DUP_CONNECTION_KEY", `Duplicate connection_key "${c.connectionKey}".`);
    connectionKeys.add(c.connectionKey);
    if (!agentKeys.has(c.sourceAgentKey)) push("BAD_CONNECTION_REF", `connection "${c.connectionKey}" references unknown source_agent_key "${c.sourceAgentKey}".`);
    if (!agentKeys.has(c.targetAgentKey)) push("BAD_CONNECTION_REF", `connection "${c.connectionKey}" references unknown target_agent_key "${c.targetAgentKey}".`);

    // No canvas payload may be embedded inside a connection.
    const raw = c as unknown as Record<string, unknown>;
    for (const field of EMBEDDED_CANVAS_FIELD_KEYS) {
      if (raw[field] != null) {
        push("CANVAS_IN_CONNECTION", `connection "${c.connectionKey}" carries embedded canvas field "${field}" — canvases must live in the canvases[] array.`);
      }
    }
  }

  // Exactly one task generator, rendered as a peer.
  const generators = agents.filter((a) => a.role === "task_generator");
  if (generators.length === 0) push("NO_TASK_GENERATOR", "No agent has role 'task_generator'.");
  if (generators.length > 1) push("MULTIPLE_TASK_GENERATORS", `Expected exactly one task_generator; found ${generators.length}.`);

  // Canvas-level checks.
  const seenPaths = new Set<string>();
  const agentStateCount = new Map<string, number>();
  for (const cv of canvases) {
    if (seenPaths.has(cv.sourcePath)) push("DUP_SOURCE_PATH", `Duplicate source_path "${cv.sourcePath}".`);
    seenPaths.add(cv.sourcePath);

    switch (cv.canvasKind) {
      case "state":
        if (cv.ownerType !== "agent") push("STATE_NOT_AGENT_OWNED", `state canvas "${cv.sourcePath}" must be owner_type 'agent'.`);
        if (!cv.ownerAgentKey || !agentKeys.has(cv.ownerAgentKey)) push("STATE_BAD_OWNER", `state canvas "${cv.sourcePath}" must reference an existing owner_agent_key.`);
        else agentStateCount.set(cv.ownerAgentKey, (agentStateCount.get(cv.ownerAgentKey) ?? 0) + 1);
        break;
      case "policy":
      case "reward":
        if (cv.ownerType !== "connection") push("INTERACTION_NOT_CONNECTION_OWNED", `${cv.canvasKind} canvas "${cv.sourcePath}" must be owner_type 'connection'.`);
        if (!cv.ownerConnectionKey || !connectionKeys.has(cv.ownerConnectionKey)) push("INTERACTION_BAD_OWNER", `${cv.canvasKind} canvas "${cv.sourcePath}" must reference an existing owner_connection_key.`);
        if (cv.side !== "source" && cv.side !== "target") push("INTERACTION_MISSING_SIDE", `${cv.canvasKind} canvas "${cv.sourcePath}" must set side to 'source' or 'target'.`);
        break;
      case "workflow":
        if (cv.ownerType !== "workflow") push("WORKFLOW_BAD_OWNER", `workflow canvas "${cv.sourcePath}" must be owner_type 'workflow'.`);
        break;
      default:
        push("UNKNOWN_CANVAS_KIND", `Canvas "${cv.sourcePath}" has unknown canvas_kind.`);
    }
  }

  // Each agent owns exactly one state canvas.
  for (const a of agents) {
    const n = agentStateCount.get(a.agentKey) ?? 0;
    if (n === 0) push("AGENT_MISSING_STATE", `agent "${a.agentKey}" has no state canvas.`);
    if (n > 1) push("AGENT_MULTIPLE_STATE", `agent "${a.agentKey}" has ${n} state canvases; expected one.`);
  }

  return { ok: errors.length === 0, errors };
}
