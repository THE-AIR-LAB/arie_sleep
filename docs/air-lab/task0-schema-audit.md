# Task 0 — Schema audit (ground truth)

**Project:** `doyyvsfnrcjqtwnvatwa` (DEMO_1_LONGEVITY), Postgres 17, `public` schema.
**Reference draft:** `general_orchestration_daemon_drafts.id = c2b2f46c-3c3e-451a-a4cb-1b8acaf86115`
**Method:** read-only SQL via the Supabase MCP surface (scoped access token, *not* the codebase service-role key — satisfies the credential rule).

This note is authoritative over the assumptions in the work-breakdown doc. Several of those assumptions are wrong for this database; they are flagged as **⚠ DOC CORRECTION** below.

---

## 0. Headline corrections to the governing document

1. **`agent_connections` is a JSONB *column* on `general_orchestration_daemon_drafts`, not a table.** There is no `agent_connections` table to "enumerate rows in." A draft has one JSONB array of connection objects.
2. **There is no `reward_canvases` table.** Reward canvases exist only as `source_reward_canvases` / `target_reward_canvases` fields inside a connection object. The canvas tables are exactly: `policy_canvases`, `state_policy_canvases`, `state_system_canvases`, `workflow_canvases`, `sandbox_canvases`.
3. **Two parallel, unrelated storage models share the canvas tables.** The doc conflates them:
   - *Legacy single-agent demos* (`analyst_inputs`, `law_inputs`, `sleep_inputs`, `nutrition`, `dnd_inputs`, `research_assistant_inputs`) store canvases as **top-level rows** in the `*_canvases` tables, keyed `(setup_table, setup_id, canvas_id)`.
   - *The multi-agent daemon* (`general_orchestration_daemon_drafts`) stores agents in `agent_bindings` and **all** policy/state/reward canvases **inside the `agent_connections` JSONB**. It uses only `workflow_canvases` at top level.
4. **No daemon draft has any top-level `policy_canvases` / `state_policy_canvases` / `state_system_canvases` row** (verified across all ~85 drafts: counts are 0). The doc's Task 1/Task 3 concern about a top-level `policy_canvases/task-environment-policy` row and a top-level `state_policy_canvases/starter-state-canvas` row **duplicating** the connection canvases is unfounded for the daemon. Those top-level rows exist for `analyst_inputs`, not for the daemon draft.
5. **The daemon already has a two-agent collection** in `agent_bindings`. Task 2's "promote agents to first-class" is partially done; the missing piece is a per-agent **reward** slot and moving the canvases out of the connection.

Net effect: the Task 3 migration for daemon drafts touches only the `agent_connections` JSONB column and `agent_bindings`. It does **not** touch the legacy per-kind canvas tables (except `workflow_canvases`, which stays as-is).

---

## 1. `general_orchestration_daemon_drafts` columns

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | uuid | no | PK |
| `expert_id` | uuid | no | |
| `endpoint` | text | no | e.g. `/demo/general-orchestration-daemon` |
| `config_name` | text | yes | |
| `route_slug` | text | yes | |
| `setup_summary` | text | yes | |
| `policy_intent` | text | yes | |
| `workspace_status` | text | yes | |
| `conversation_messages` | jsonb | no | daemon chat log |
| `created_at` / `updated_at` | timestamptz | no | |
| `daemon_state` | jsonb | no | |
| `environment_players` | jsonb | no | **empty array in every draft — legacy/unused** |
| `interaction_protocol` | jsonb | no | object; simulation wiring (see §5) |
| `shared_datasets` | jsonb | no | array (Task 7 target) |
| `agent_connections` | jsonb | no | **array of connection objects — carries the six canvases** |
| `agent_bindings` | jsonb | no | **array of agent objects — the de-facto agents collection** |
| `interaction_mode` | text | no | reference draft = `data_only` |
| `shared_uploaded_files` | jsonb | no | array (Task 7 target) |
| `agent_stage_behaviors` | jsonb | no | **empty array in reference draft** |

## 2. Canvas tables

All of `policy_canvases`, `state_policy_canvases`, `state_system_canvases`, `workflow_canvases` share the same shape:
`id (uuid PK), setup_table (text), setup_id (uuid), canvas_id (text), name (text), sort_order (int), canvas (jsonb), created_at, updated_at`.

`sandbox_canvases` is different: `id, config_id (uuid, FK), name, doc (jsonb), sort_order, …` — unrelated to the daemon setup panes.

### Uniqueness of `(setup_table, setup_id, canvas_id)` — ⚠ only partially enforced

| Table | `(setup_table, setup_id, canvas_id)` UNIQUE? |
|---|---|
| `policy_canvases` | **YES** — `policy_canvases_setup_table_setup_id_canvas_id_key` |
| `state_policy_canvases` | **NO** |
| `state_system_canvases` | **NO** |
| `workflow_canvases` | **NO** |

Only `policy_canvases` enforces it. The others rely on application discipline. Any Task-3 work that lands canvases into these tables must add the missing unique constraints (or the compound key from Task 1) or it can silently duplicate.

### Where the canvas tables are actually used (row counts by `setup_table`)

| setup_table | policy | state_policy | state_system | workflow |
|---|--:|--:|--:|--:|
| analyst_inputs | 5 | 2 | – | 8 |
| law_inputs | 5 | 1 | – | 1 |
| sleep_inputs | 4 | 1 | – | 1 |
| nutrition | 2 | 1 | – | – |
| research_assistant_inputs | 1 | 2 | 1 | – |
| dnd_inputs | 1 | 1 | – | – |
| **general_orchestration_daemon_drafts** | **0** | **0** | **0** | **44** |
| general_orchestration_daemon_inputs | – | – | – | 2 |

The daemon uses **only** `workflow_canvases` at top level. Everything else it needs is in `agent_connections`.

## 3. The reference draft's single connection

`agent_connections` has **length 1**. One connection object, keys:

```
id, purpose, invocation_mode, workflow_stage_id, workflow_stage_name,
source_agent_id, source_policy_canvases, source_policy_prompt,
source_state_policy_canvases, source_state_update_prompt,
source_reward_canvases, source_reward_prompt,
target_agent_id, target_agent_shared_id, target_agent_title,
target_policy_canvases, target_policy_prompt,
target_state_policy_canvases, target_state_update_prompt,
target_reward_canvases, target_reward_prompt
```

- `id` = `93c45cc3-f6b8-4e76-8831-b9632ffdfb03`
- `workflow_stage_id` = `idea-generation-screening`, `workflow_stage_name` = "Idea generation screening" — **single stage**.
- `source_agent_id` = `905cdf83-5970-4598-8642-dea17852cc99`
- `target_agent_id` = `task_performing_agent`

### The two agents (from `agent_bindings`)

| agent id | title | role | distinctive state fields |
|---|---|---|---|
| `905cdf83-5970-4598-8642-dea17852cc99` | "Task environment · An investment analyst workflow: idea generation stage" | **task generator / environment** (the connection's `source_`) | `selected_task_id`, `selected_task`, `selected_price_trajectory`, `task_profile_sent`, `final_solution_received` |
| `task_performing_agent` | "Investment analyst performing idea-generation screening" | **analyst** (the connection's `target_`) | `work_complete`, `final_solution` |

`agent_bindings` element shape (per agent):
`id, title, template_id, template_version_id, role_context, state_fields[], policy_canvases_override, policy_prompt_override, state_policy_canvases_override, state_update_prompt_override, dataset_overrides, guideline_overrides, skill_overrides, uploaded_file_overrides`.

⚠ **No `reward_*` slot exists on a binding.** Reward lives only in the connection. This is the gap Task 6 (Reward tab) and Task 2 (per-agent reward canvas) must close.

## 4. The six connection canvases — shape and identity

All six canvas fields share one identical wrapper: `{ activeId, version, canvases: [ { id, name, freeText, graph } ] }`. A "canvas" is a node **graph** plus **freeText**. Each field currently holds exactly one canvas.

| Connection field | canvas_id | display name | owning agent |
|---|---|---|---|
| `source_policy_canvases` | `task-environment-policy` | Task lifecycle | task generator |
| `source_state_policy_canvases` | `starter-state-canvas` | Task selection and state update | task generator |
| `source_reward_canvases` | `task-environment-price-trajectory-reward` | Thirty-day realized return | task generator |
| `target_policy_canvases` | `starter-policy-canvas` | stage1TargetPolicy | analyst |
| `target_state_policy_canvases` | `starter-state-canvas` | stage1TargetState | analyst |
| `target_reward_canvases` | `starter-reward-canvas` | Task environment final solution quality | analyst |

### The actual `canvas_id` collision (confirms Task 1's mechanical premise)

`starter-state-canvas` is used **twice inside the same connection**:
- `source_state_policy_canvases` → name "Task selection and state update" (task generator's state)
- `target_state_policy_canvases` → name "stage1TargetState" (analyst's state)

Two distinct canvases, one `canvas_id`, disambiguated **only by JSON path** (`source_` vs `target_`). Any UI keyed on `canvas_id` alone cannot tell them apart — this is the mechanical cause of the six canvases flattening into one workflow tab bar. ⚠ Correction to doc: the collision is **intra-connection (source vs target)**, not "top-level row vs connection". `task-environment-policy` appears only once in this draft (no collision for it here).

**Recommended canonical identity (Task 1):** `(agent_id, canvas_kind, canvas_id)`, with `canvas_id` unique within an agent-scope. Under this key the two `starter-state-canvas` canvases resolve distinctly because they belong to different `agent_id`s. Note the two agents also both define `starter-*` ids independently, so agent-scoping is required, not optional.

## 5. `interaction_protocol` (object) keys

```
default_target_observation, default_target_reward,
live_agent_action_instruction,
simulation_agent_selector, simulation_connection_id, simulation_opening_speaker,
simulation_target_agent_id, simulation_turn_count,
source_action_instruction, target_action_instruction,
target_reply_notes_key, target_reply_observation_key, target_reply_reward_key
```

This is the simulation/runtime wiring (Task 9). It references agents by id and the connection by id — so promoting agents to first-class must keep these ids stable.

## 6. `state_policy_canvases` vs `policy_canvases` (Task 0 step 5 — resolved)

Confirmed from payloads and adjacent prompt fields: **`state_policy_canvases` = the policy governing state *updates*.** Evidence: the source state canvas is named "Task selection and state update" and its sibling prompt field is `source_state_update_prompt`; the plain `policy_canvases` sibling is `source_policy_prompt` ("Task lifecycle"). So per agent there are two policy-like canvases: the action **policy** and the **state-update** policy. The nav's "State" tab should map to the state-update canvas; "Policy" to the action policy.

---

## 7. Cross-draft blast radius (seed for Task 1 collision report)

~85 drafts total. Every non-empty daemon draft has `tl_policy = tl_state_policy = tl_state_system = 0`; workflow rows are 0 or 1; `environment_players` empty everywhere.

Drafts with connections (the migration set) and their agent/connection counts:

| draft | config_name | agents | connections |
|---|---|--:|--:|
| `27b1e280` | Behavioral sleep therapy / CBT-I care workflow | 5 | 13 |
| `97afb256` | Outpatient behavioral sleep therapy / CBT-I episode | 5 | 11 |
| `465f430b` | Profile-driven investment-idea workflow | 4 | 5 |
| `9a0bd903` | Idea generation stage … | 3 | 2 |
| `fe410505` | Investment analyst … | 2 | 2 |
| `be69b489` | Idea generation stage … | 2 | **0** |
| ~35 more | investment-analyst / idea-generation / linear-algebra / sleep variants | 2 | 1 |

Notes for Task 1/3:
- **`be69b489`** has 2 agent_bindings and 0 connections — the exact "agent that participates in no connection" case the doc says the relationship-encoding can't express. It already exists in the data, so the migration must not assume canvases only come from connections; agents with no connection carry their canvases only in bindings overrides (to verify per-draft).
- **Multi-connection drafts (11–13 connections)** are where `starter-*` canvas_ids will collide most heavily — the same id reused across many source/target slots. These are the real stress test for the Task 1 canonical-identity rule, not the reference draft.
- The legacy `*_inputs` top-level rows are a **separate** namespace with their own (mostly enforced) uniqueness and are out of scope for the daemon migration.

---

## 8. Gate

Task 0 is complete and blocking. Before any migration (Task 3) or generation-contract change (Task 4):
- The canonical-identity decision (Task 1) should adopt `(agent_id, canvas_kind, canvas_id)`.
- Confirm with Yasin whether the state **schema** (`state_fields`, already on each binding) is its own canvas/tab or a property of the state canvas — the storage already keeps `state_fields` on the binding, which argues for "property of the agent," rendered as its own tab.
- The migration is a **JSONB restructure within `general_orchestration_daemon_drafts`** (agent_connections → agent_bindings-owned canvases + slimmed connections), not a cross-table move. Snapshot the affected columns before mutating.
