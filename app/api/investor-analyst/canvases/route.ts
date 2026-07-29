import { NextRequest, NextResponse } from "next/server";
import { resolveCurrentUser } from "../../../lib/admin-auth";
import { createSupabaseAdminClient } from "../../../lib/supabase-admin";

// Setup endpoint for the investor-analyst studio, backed by the NEW agent-first
// canvas store (public.agent_canvases) rather than the legacy *_canvases tables.
// GET shapes the migrated canvases for one draft into the SetupStudio contract
// ({ config, policyCanvases, statePolicyCanvases, workflowCanvases }); PUT writes
// graph/free-text edits back to the same rows (UPDATE-only, matched by row id).
//
// Reference draft: c2b2f46c-… (An investment analyst workflow: idea generation
// stage), connection 93c45cc3-…, in project doyyvsfnrcjqtwnvatwa (DEMO_1_LONGEVITY).

export const dynamic = "force-dynamic";

const DRAFT_ID = "c2b2f46c-3c3e-451a-a4cb-1b8acaf86115";
const CONFIG_NAME = "An investment analyst workflow: idea generation stage";

// Short, human labels for the two agents in this draft. The reward canvases are
// connection-owned, so they resolve to an agent by their side of the connection
// (source → task generator, target → analyst).
const AGENT_LABEL: Record<string, string> = {
  "905cdf83-5970-4598-8642-dea17852cc99": "Task generator",
  task_performing_agent: "Investment analyst",
};
const SOURCE_AGENT = "905cdf83-5970-4598-8642-dea17852cc99";
const TARGET_AGENT = "task_performing_agent";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Graph = { nodes: unknown[]; edges: unknown[] };
type CanvasEntry = { id: string; name: string; graph: Graph; freeText: string };
type SetupRow = { canvas_id: string; name: string; sort_order: number; canvas: CanvasEntry };

type AgentCanvasRow = {
  id: string;
  canvas_kind: string;
  owner_type: string;
  owner_agent_key: string | null;
  owner_connection_key: string | null;
  side: string | null;
  canvas_id: string | null;
  name: string | null;
  sort_order: number | null;
  canvas: Graph | null;
  free_text: string | null;
};

const SELECT =
  "id, canvas_kind, owner_type, owner_agent_key, owner_connection_key, side, canvas_id, name, sort_order, canvas, free_text";

/** Which agent owns a row, so its tab can be labelled and ordered. */
function ownerAgentKey(row: AgentCanvasRow): string | null {
  if (row.owner_type === "agent") return row.owner_agent_key;
  if (row.owner_type === "connection") {
    if (row.side === "source") return SOURCE_AGENT;
    if (row.side === "target") return TARGET_AGENT;
  }
  return null;
}

/** Task generator first, then the analyst; unknown owners last. */
function agentSort(key: string | null): number {
  if (key === SOURCE_AGENT) return 0;
  if (key === TARGET_AGENT) return 1;
  return 2;
}

/** Map a stored agent_canvases row to a SetupStudio canvas row. The row's uuid
 *  becomes the studio canvas_id — unique (so the shared `starter-state-canvas`
 *  template id no longer collides across agents) and directly addressable on save. */
function toSetupRow(row: AgentCanvasRow, sortOrder: number): SetupRow | null {
  if (!row.canvas || typeof row.canvas !== "object") return null;
  const key = ownerAgentKey(row);
  const agent = key ? AGENT_LABEL[key] ?? key : null;
  const base = row.name ?? row.canvas_id ?? "Canvas";
  let label = base;
  if (row.owner_type === "workflow") label = base;
  else if (row.canvas_kind === "reward" && agent) label = `${agent} reward · ${base}`;
  else if (agent) label = `${agent} · ${base}`;

  return {
    canvas_id: row.id,
    name: label,
    sort_order: sortOrder,
    canvas: {
      id: row.id,
      name: label,
      graph: { nodes: row.canvas.nodes ?? [], edges: row.canvas.edges ?? [] },
      freeText: row.free_text ?? "",
    },
  };
}

/** Order agent-owned rows so the task generator's canvas is the first tab. */
function bucketRows(rows: AgentCanvasRow[]): SetupRow[] {
  return [...rows]
    .sort((a, b) => agentSort(ownerAgentKey(a)) - agentSort(ownerAgentKey(b)))
    .map((row, i) => toSetupRow(row, i))
    .filter((r): r is SetupRow => r !== null);
}

export async function GET() {
  const me = await resolveCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("agent_canvases")
    .select(SELECT)
    .eq("draft_id", DRAFT_ID);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as AgentCanvasRow[];

  // State + policy are agent-owned; reward is connection-owned; keep the
  // canonical set (agent-owned state/policy, connection-owned reward, workflow).
  const state = rows.filter((r) => r.canvas_kind === "state" && r.owner_type === "agent");
  const policy = rows.filter((r) => r.canvas_kind === "policy" && r.owner_type === "agent");
  const reward = rows.filter((r) => r.canvas_kind === "reward" && r.owner_type === "connection");
  const workflow = rows.filter((r) => r.owner_type === "workflow");

  // Structured agent tier (source → task generator, target → analyst), each
  // owning a state / policy / reward canvas. Reward is connection-owned, mapped
  // to the agent by its side. Consumed by the investor-analyst agent-tier pane.
  const findRow = (rows: AgentCanvasRow[]) =>
    rows[0] ? toSetupRow(rows[0], 0) : null;
  const agents = [
    { key: SOURCE_AGENT, role: "source" as const, side: "source" },
    { key: TARGET_AGENT, role: "target" as const, side: "target" },
  ].map((a) => ({
    key: a.key,
    name: AGENT_LABEL[a.key] ?? a.key,
    role: a.role,
    canvases: {
      state: findRow(state.filter((r) => r.owner_agent_key === a.key)),
      policy: findRow(policy.filter((r) => r.owner_agent_key === a.key)),
      reward: findRow(reward.filter((r) => r.side === a.side)),
    },
  }));

  return NextResponse.json({
    config: { id: DRAFT_ID, config_name: CONFIG_NAME },
    agents,
    policyCanvases: bucketRows(policy),
    statePolicyCanvases: bucketRows(state),
    // Bottom workflow drawer: only the workflow overview (plus any genuine
    // pairwise interaction canvases). The agent-owned state/policy and the
    // connection reward canvases render in the side drawer's agent tier, so they
    // are intentionally excluded here to avoid duplicate tabs.
    workflowCanvases: bucketRows(workflow),
    missingOptionalFields: [],
  });
}

export async function PUT(request: NextRequest) {
  const me = await resolveCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Writes go straight into the migrated store — gate on admin.
  if (!me.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as {
    policyCanvases?: SetupRow[];
    statePolicyCanvases?: SetupRow[];
    workflowCanvases?: SetupRow[];
  };

  // Bucket names don't matter here — each canvas is matched back to its row by
  // uuid — so accept every bucket (state/policy from the default pane, plus
  // reward/workflow from the agent-tier pane).
  const incoming = [
    ...(body.policyCanvases ?? []),
    ...(body.statePolicyCanvases ?? []),
    ...(body.workflowCanvases ?? []),
  ];

  const supabase = createSupabaseAdminClient();
  // UPDATE-only, scoped to this draft and matched by the row's own uuid. Never
  // deletes or inserts, so a save cannot destroy the migrated store; canvases
  // the studio added without a real row id (non-uuid) are skipped. `name` is
  // left untouched so the human tab prefix ("Task generator · …") is not
  // written back into the stored canonical name.
  let updated = 0;
  const skipped: string[] = [];
  for (const row of incoming) {
    const id = row?.canvas?.id;
    if (!id || !UUID_RE.test(id)) {
      if (id) skipped.push(id);
      continue;
    }
    const { error, count } = await supabase
      .from("agent_canvases")
      .update(
        {
          canvas: row.canvas.graph,
          free_text: row.canvas.freeText ?? "",
          updated_at: new Date().toISOString(),
        },
        { count: "exact" }
      )
      .eq("id", id)
      .eq("draft_id", DRAFT_ID);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    updated += count ?? 0;
  }

  // SetupStudio treats a truthy `executionPlanSaved` as a clean save. There is
  // no separate execution plan for this store, so report success.
  return NextResponse.json({ id: DRAFT_ID, executionPlanSaved: true, updated, skipped });
}
