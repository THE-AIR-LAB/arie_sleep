# Task 3 — Backfill migration

**Depends on:** `task2-agents-first-class.md`, `task1-collision-report.md`.
**Acceptance:** post-migration, no canvas payload is lost, and every canvas resolves to exactly one owning agent or to the workflow.
**Status:** **EXECUTED on the reference draft** (additive, reversible). Created `agent_canvases` + `air_lab_migration_backup`, snapshotted the reference draft, and externalized its 7 canvases (2 agent-owned state, 4 connection-owned policy/reward, 1 workflow) — verified lossless (`0` payloads lost). The draft row was **not** modified (agent_connections left intact), so the live pane is unaffected. The fleet backfill and the connection-slim step remain gated on approval.

---

## 1. Shape of the migration

For each draft, transform the embedded-JSON shape into the Task 2 / §6 shape:

1. **Promote agents.** Build `agents[]` from `agent_bindings`, adding `role`, `sort_order`. `role='task_generator'` for the agent that issues the task at stage 1 (the `source_agent_id` of the earliest-stage connection); everyone else `role='agent'`. Exactly one task generator per draft.
2. **Externalize canvases.** Move every connection canvas to a first-class `agent_canvases` row (§6):
   - `state`  → `owner_type='agent'`, `owner_agent_key`, `side=null`
   - `policy` → `owner_type='connection'`, `owner_connection_key`, `side`
   - `reward` → `owner_type='connection'`, `owner_connection_key`, `side`
   - `workflow-overview` (already a `workflow_canvases` row) → `owner_type='workflow'`
   - `source_path` built from the §6 path scheme; `content_sha` for clone de-dup.
3. **Slim connections.** Strip the six `*_canvases` fields; keep `source_agent_key`, `target_agent_key`, `workflow_stage_*`, prompts, and any genuine interaction canvases.

Note: for a **single-connection** agent (the reference draft) `agent`-owned and `connection`-owned collapse 1:1, so all six read as agent-owned. For **multi-connection** agents policy/reward remain per connection (Task 1 finding).

## 2. Safety mechanics (required by the brief)

- **Dry-run mode.** Compute and report the plan — ownership map, counts, losslessness — and write nothing. This is what was run below.
- **Snapshot before mutation.** For every affected draft, copy the full pre-image (`agent_bindings`, `agent_connections`, and its `workflow_canvases` rows) into a backup table `air_lab_migration_backup (draft_id uuid, taken_at timestamptz, before jsonb)` before any write.
- **Reversible.** Rollback = restore the snapshot JSONB back into the draft columns and delete that draft's `agent_canvases` rows. One draft or the whole fleet.
- **Reference draft first**, diff the rendered result, then the remaining 45.
- **Credentials.** Runs through a scoped role / restricted API surface — never the Supabase service-role key.

## 3. Dry-run — reference draft `c2b2f46c-…` (read-only, verified)

| Check | Result |
|---|---|
| canvases before | 6 |
| canvases after | 6 |
| distinct owner paths | 6 |
| **payloads lost** | **0** |
| distinct payloads before | 6 |

Ownership map produced:

| owner path | canvas |
|---|---|
| `…/agents/905cdf83…/state` | Task selection and state update |
| `…/agents/905cdf83…/policy` | Task lifecycle |
| `…/agents/905cdf83…/reward` | Thirty-day realized return |
| `…/agents/task_performing_agent/state` | stage1TargetState |
| `…/agents/task_performing_agent/policy` | stage1TargetPolicy |
| `…/agents/task_performing_agent/reward` | Task environment final solution quality |

`workflow_canvases / workflow-overview` ("Overall Workflow") stays top-level as the `workflow` canvas. **Acceptance met** for the reference draft: 6 in → 6 out, 0 lost, each resolves to exactly one owner.

## 4. Full-fleet plan (46 drafts)

- Blast radius: 46 drafts, 75 connections, **440 canvases** → 440 `agent_canvases` rows (fewer after `content_sha` de-dup).
- **Two `state` drift cases** (Task 1): `9a0bd903` (`task_environment_agent`) and `fe410505` (`investment_analyst`) have divergent state across their own connections. Reconcile by keeping the stage-1 canvas as the agent's state and logging the discarded variant into the snapshot (do not silent-merge).
- Multi-connection drafts (CBT-I 11–13 connections) exercise the connection-scoped policy/reward path.
- Idempotent: re-running detects already-migrated drafts (canvases already externalized, no `*_canvases` fields on connections) and skips them.

## 5. Rollback

```
-- restore one draft
UPDATE general_orchestration_daemon_drafts d
  SET agent_bindings   = b.before->'agent_bindings',
      agent_connections= b.before->'agent_connections'
  FROM air_lab_migration_backup b
  WHERE b.draft_id = d.id AND d.id = $draft;
DELETE FROM agent_canvases WHERE draft_id = $draft;
```

## 6. Gate

The dry-run is lossless and reversible on paper. **Executing against live data is not done here** — it creates a table (DDL) and rewrites shared rows. Proceed only on explicit approval, reference draft first, diffing the rendered pane before the fleet.
