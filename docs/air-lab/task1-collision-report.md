# Task 1 — Canvas `canvas_id` collision report & canonical-identity decision

**Scope:** all `general_orchestration_daemon_drafts` with ≥1 connection (46 drafts, 75 connection rows, 440 canvas instances). Read-only.
**Depends on:** `task0-schema-audit.md`.
**Acceptance target:** *no two canvases resolvable by the same key return different payloads.*

---

## 1. Result in one line

`canvas_id` is a **template seed**, not an identity. Under `canvas_id` alone there are **59 colliding keys**. The canonical key **`(draft_id, connection_id, side, kind)`** resolves **all 440 canvases with 0 collisions** — verified. `canvas_id` is redundant (≤1 canvas per slot) and should be **retained but never used as a key**. No id rewrite is required.

## 2. How collisions scale under each candidate key

| Resolution key | Colliding keys (same key, ≠ payload) |
|---|--:|
| `canvas_id` (today's UI key) | **59** |
| `(agent_id, kind, canvas_id)` — the doc's proposal | 26 |
| `(agent_id, canvas_id)` | 26 |
| `+ stage_id` | 8 remain |
| **`(connection_id, side, kind, canvas_id)`** *(with draft_id)* | **0** ✅ |
| `(agent_id, 'state')` — state only | 2 (drift; see §5) |

The doc's proposed `(agent_id, canvas_kind, canvas_id)` **does not meet the acceptance criterion** — it leaves 26 collisions. Adding `stage_id` is also insufficient (8 remain) because in the CBT-I workflows one agent participates in several connections *within the same stage* (e.g. the therapist talking to both the client and the PCP in one stage). Only the connection scope fully disambiguates.

## 3. Root cause

The generator stamps a fixed seed id on every canvas of a kind: **`starter-policy-canvas`**, **`starter-state-canvas`**, **`starter-reward-canvas`** (plus the task-generator's `task-environment-*` ids). Nothing makes them unique. They are disambiguated today only by their JSON path (`source_`/`target_` × field), which is exactly why any UI keyed on `canvas_id` flattens six distinct canvases into one tab bar (the symptom in the reference draft).

## 4. What the payloads actually are — ownership model (this refines the doc)

For agents that appear in **more than one connection** (13 agent-groups per kind), payload divergence by kind:

| kind | multi-conn groups | identical across conns | **divergent per conn** | ⇒ ownership |
|---|--:|--:|--:|---|
| **policy** | 13 | 1 | **12** | **interaction-scoped** (per connection) |
| **reward** | 13 | 1 | **12** | **interaction-scoped** (per connection) |
| **state** | 13 | **11** | 2 | **agent-owned** (one per agent) |

The divergence is **semantic, not cosmetic**. Example — the CBT-I `therapist` agent has a distinct policy canvas per connection, each named `"<stage>: Interaction with <counterpart>"`:

- `Between-session adherence support: Interaction with Client`
- `Initial intervention implementation: Interaction with Client`
- `Referral review for possible sleep-disordered breathing: Interaction with Client`
- `Referral review for possible sleep-disordered breathing: Interaction with primary care suggester`
- …12 in total, all different freeText.

**Implication for Tasks 2/5/6 (must be resolved before building the nav):** the doc's "each agent owns exactly four canvases (state, policy, reward, +schema)" is true only for **single-connection agents** (like the reference draft). For a multi-connection agent:
- **State** is genuinely one canvas owned by the agent.
- **Policy** and **Reward** are **one-per-interaction**. "The therapist's Policy tab" is not a single canvas; it is N canvases, one per connection the therapist participates in.

So the agent-tier nav needs a rule for policy/reward when an agent has multiple interactions — e.g. the Policy tab shows a sub-selector by counterpart/stage, or policy/reward are rendered on the *connection* rather than the agent. **This is a design decision for Yasin**, analogous to the state-schema question already flagged. The reference draft cannot surface it because it has one connection.

## 5. Two `state` drift cases to reconcile

State is agent-owned in 11/13 multi-connection agents. Two exceptions where an agent's state canvas differs across its own connections (should be one):

| draft | agent | connections |
|---|---|--:|
| `Idea generation stage of an investment analyst workflow` (`9a0bd903`) | `task_environment_agent` | 2 |
| `Investment analyst workflow: idea generation stage` (`fe410505`) | `investment_analyst` | 2 |

These look like generator drift. During the Task 3 migration, pick the authoritative state canvas per agent (recommend the one on the earliest/stage-1 connection) and log the discarded variant in the snapshot. Do **not** silently merge.

## 6. Decision: compound key, **do not rewrite** `canvas_id`

**Chosen canonical identity**

- **Interaction canvases (policy, reward, and the interaction state-update canvas):**
  `(draft_id, connection_id, side, kind)` — verified 0 collisions; `canvas_id` retained as a display/label field only.
- **Agent-owned state canvas:** `(draft_id, agent_id, 'state')` — after the two §5 reconciliations.
- **Workflow canvas:** unchanged — top-level `workflow_canvases` row `(setup_table, setup_id, canvas_id)`.

**Why compound key, not rewrite:**

1. **`canvas_id` is referenced across ~30 files** — compiler (`packages/canvas-compiler/*`), planner (`packages/canvas-planner/*`), runtime (`packages/orchestration-runtime/*`), and UI (`packages/canvas-ui/*`, `app/demo/studio-components/*`), plus the per-slot **`activeId`** pointer inside each `{activeId, version, canvases}` wrapper. A blanket rewrite of 440 seed ids risks breaking every `activeId` reference and any compiler lookup that assumes the seed.
2. **The seed ids are harmless once nothing keys on them alone.** With the connection scope in the key, `starter-policy-canvas` appearing 40× is fine — each instance is uniquely addressed by its slot.
3. **Uniqueness is only unenforced where it doesn't matter.** Per §Task0, `state_policy_canvases`/`state_system_canvases`/`workflow_canvases` lack the `(setup_table,setup_id,canvas_id)` unique constraint — but the daemon does not write agent canvases to those tables at all (they live in JSONB), so no DB constraint change is needed for the daemon path. (If Task 3 ever externalizes canvases into tables, add the constraint then.)
4. **Human-readable ids can come from the generator going forward (Task 4)** without a historical backfill: have the daemon emit `${agentId}--${kind}` or `${connectionId}--${side}-${kind}` ids for *new* output. Old drafts keep their seeds; the resolver treats both uniformly because it keys on the compound tuple, not the string.

**Rejected alternative — rewrite ids to be globally unique:** cleaner strings, but (a) breaks the code/`activeId` references above, (b) requires touching all 440 instances and any stored cross-references, (c) buys nothing the compound key doesn't already give. Revisit only if a later requirement needs a canvas addressable by a single opaque id detached from its slot.

## 7. Structural facts the migration (Task 3) must respect

- **Every connection slot holds exactly one canvas** (`max canvases/slot = 1`; 0 slots with >1; 10 empty slots). So slot = canvas; no intra-slot disambiguation needed.
- **Connection ids are not unique across drafts** — 6 connection ids are shared by multiple clone drafts (51 distinct ids across 75 rows). **`draft_id` is mandatory in every key**; never resolve a canvas by `connection_id` alone.
- **`environment_players` is empty everywhere** — ignore/deprecate; it is not the agents collection (`agent_bindings` is).

## 8. Acceptance — met

Under `(draft_id, connection_id, side, kind, canvas_id)`: **0 groups return >1 payload** across all 440 canvases. The criterion "no two canvases resolvable by the same key return different payloads" is satisfied. The only residual multi-payload groups are the 2 state-drift cases under the *semantic* agent-owned key, explicitly slated for reconciliation in Task 3 (§5).

## 9. Open decisions carried forward (need Yasin)

1. **Policy/reward for multi-connection agents** (§4): rendered per-interaction under the agent (sub-selector), or moved onto the connection? Blocks Task 2's canvas-slot shape and Task 5's nav.
2. **State schema vs state canvas** (from Task 0): `state_fields` already lives once per binding → argues "property of the agent, own tab." Confirm.
3. Whether to emit human-readable canvas ids from the daemon going forward (Task 4) — recommended, no backfill.
