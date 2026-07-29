# Task 2 — Promote agents to first-class

**Depends on:** `task0-schema-audit.md`, `task1-collision-report.md`.
**Reference draft:** `c2b2f46c-3c3e-451a-a4cb-1b8acaf86115` (investment analyst), connection `93c45cc3-…`.
**Acceptance:** the reference draft can be expressed with two agents and one connection, where the connection carries only interaction canvases and each agent owns its four canvas slots.

This is a *representation* task (define the shape + show the reference draft maps to it losslessly). The destructive backfill is Task 3; the generation-contract change is Task 4.

---

## 1. The problem

Today an agent's identity is implied by the `source_`/`target_` prefix inside one `agent_connections` entry. That encodes a **relationship**, not an **entity**, so it cannot express:
- three or more agents,
- an agent that participates in **no** connection (already exists: draft `be69b489`, 2 agents / 0 connections),
- an agent's canvases independent of who it talks to.

A partial agents collection already exists in `agent_bindings` (two entries, with `id`, `title`, `template_id`, `state_fields[]`, and `*_override` slots) — but it has **no role marker, no explicit ordering, and no reward slot**, and the canvases still live in the connection.

## 2. Target shape — the agents collection

Add an ordered agents collection to the draft (JSONB column `agents`, or a child table keyed on `draft_id`). Each agent:

```
agent
  agent_key     text   -- stable within the draft (slug or uuid)
  name          text
  role          'task_generator' | 'agent'   -- type marker only (Task 9 bookends), NOT a nav group
  sort_order    int
  state_schema  jsonb  -- the state_fields (see §5 open question)
  # the four canvas slots (owner references, resolved via §6 store):
  state_canvas   -> agent-owned  (one per agent)
  policy_canvas  -> per the connection(s) the agent participates in  (interaction-scoped)
  reward_canvas  -> per the connection(s) the agent participates in  (interaction-scoped)
```

Rules:
- **Exactly one** agent per draft has `role = 'task_generator'`. It is a **peer** in the collection (rendered in the same selector row), not a parent. The marker exists only for the runtime bookends (Task 9).
- **Ordering** is explicit (`sort_order`), so the selector is stable.
- Per the Task 1 ownership finding: **state is agent-owned; policy and reward are interaction-scoped.** For a single-connection agent (the reference draft) each has exactly one instance, so "each agent owns four canvases" holds literally. For a multi-connection agent the policy/reward slots fan out per connection (rendered under the agent with a per-interaction sub-selector — pending Yasin, §5).

`agent_connections` is reduced to what it actually is: **pairwise interaction wiring** between two `agent_key`s — `source_agent_key`, `target_agent_key`, `workflow_stage_*`, prompts, and any genuine *interaction* canvases (canvases that belong to the pair, not to one agent). Agent-owned canvases move out of the connection entirely.

## 3. The reference draft expressed in the new shape

```jsonc
{
  "agents": [
    {
      "agent_key": "task_environment_agent",          // was 905cdf83-5970-4598-8642-dea17852cc99
      "name": "Task environment",
      "role": "task_generator",
      "sort_order": 0,
      "state_schema": { "fields": [ /* 34 fields incl. selected_task, selected_price_trajectory,
                                       task_profile_sent, final_solution_received */ ] },
      "state_canvas":  "Task selection and state update",     // was source_state_policy_canvases
      "policy_canvas": "Task lifecycle",                      // was source_policy_canvases
      "reward_canvas": "Thirty-day realized return"           // was source_reward_canvases
    },
    {
      "agent_key": "task_performing_agent",
      "name": "Investment analyst",
      "role": "agent",
      "sort_order": 1,
      "state_schema": { "fields": [ /* 18 fields incl. work_complete, final_solution,
                                       screening_decision, initial_hypothesis */ ] },
      "state_canvas":  "stage1TargetState",                   // was target_state_policy_canvases
      "policy_canvas": "stage1TargetPolicy",                  // was target_policy_canvases
      "reward_canvas": "Task environment final solution quality" // was target_reward_canvases
    }
  ],
  "connections": [
    {
      "connection_key": "93c45cc3-f6b8-4e76-8831-b9632ffdfb03",
      "source_agent_key": "task_environment_agent",
      "target_agent_key": "task_performing_agent",
      "workflow_stage_id": "idea-generation-screening",
      "workflow_stage_name": "Idea generation screening",
      "sort_order": 0,
      "interaction_canvases": []      // reference draft has none — all six were agent-owned
    }
  ]
}
```

Mapping is the Task 3 table, now expressed as ownership rather than JSON path:

| Old (connection slot) | canvas | New owner |
|---|---|---|
| `source_state_policy_canvases` | Task selection and state update | task_environment_agent · state |
| `source_policy_canvases` | Task lifecycle | task_environment_agent · policy |
| `source_reward_canvases` | Thirty-day realized return | task_environment_agent · reward |
| `target_state_policy_canvases` | stage1TargetState | task_performing_agent · state |
| `target_policy_canvases` | stage1TargetPolicy | task_performing_agent · policy |
| `target_reward_canvases` | Task environment final solution quality | task_performing_agent · reward |

## 4. Acceptance — met

- **Two agents**, one marked `task_generator`, both peers, explicitly ordered.
- **One connection** carrying only the relationship (agent keys + stage); `interaction_canvases` is empty for this draft.
- **Each agent owns its four slots** (state_schema, state, policy, reward). The `starter-state-canvas` collision is dissolved because the two state canvases now resolve by owning `agent_key`, not by shared `canvas_id`.

## 5. Open question (Yasin) — state schema vs state canvas

`state_fields` already lives once per binding (34 / 18 fields here), which argues **state_schema is a property of the agent, rendered as its own tab** alongside the state canvas — not a separate canvas document. Recommended: keep `state_schema` as a JSONB property on the agent; the nav gets a "State schema" tab that reads it. Confirm before Task 5 builds the tab.

## 6. Notes

- `role`/`kind` is a **type marker**, not `is_main_agent` and not a nav grouping — honoring the "no hardcoded roles" ground rule.
- `environment_players` stays deprecated (empty everywhere); `agent_bindings` is the collection being promoted.
- This representation is the input to Task 3 (backfill) and the output contract for Task 4 (daemon generation). It targets the §6 canvas store (`agent_canvases` / `airie_canvas_documents`).
