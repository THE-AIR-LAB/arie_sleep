# Task 4 — Change the master agent's output contract

**Depends on:** `task2-agents-first-class.md`, `task3-backfill-migration.md`, §6 recommendation.
**Acceptance:** regenerating the investment analyst agent from scratch produces the Task 2 shape with no migration needed.

The daemon currently emits agent-owned canvases into connection `source_`/`target_` fields; left alone it re-creates the old shape on the next generation and undoes Task 3. This task installs the agent-first output contract and a validator that rejects the old shape.

## What shipped (additive, non-breaking)

`packages/orchestration-core/src/agent-first-canvas-contract.ts` (exported from the package index):

- **Types** — `AgentFirstOutput` = `{ agents[], connections[], canvases[] }` with `AgentFirstAgent` (agentKey, name, `role`, sortOrder, stateSchema), `AgentFirstConnection` (keys + stage only), `AgentFirstCanvas` (sourcePath, canvasKind, ownerType, ownerAgentKey/ownerConnectionKey/side, name, canvas, freeText).
- **`buildCanvasSourcePath(draftId, canvas)`** — assigns the unique, path-addressable id per agent/connection scope (Task 1's rule); never the reused `starter-*` seed id.
- **`validateAgentFirstOutput(output)`** — the validator the brief requires. Returns `{ ok, errors[] }`, flagging:
  - `CANVAS_IN_CONNECTION` — any embedded `*_canvases` field inside a connection (the old shape).
  - `STATE_NOT_AGENT_OWNED` / `INTERACTION_NOT_CONNECTION_OWNED` — wrong ownership per kind.
  - `NO_TASK_GENERATOR` / `MULTIPLE_TASK_GENERATORS` — task generator must be named explicitly, exactly one.
  - `DUP_SOURCE_PATH`, `DUP_AGENT_KEY`, `DUP_CONNECTION_KEY`, `BAD_CONNECTION_REF`, `AGENT_MISSING_STATE`, `INTERACTION_MISSING_SIDE`, `INTERACTION_BAD_OWNER`, …

Pure + additive: nothing imports it yet, so live generation is untouched. It is a self-check the generator runs against its own output, and the guard to wire into the persistence path once the compiler resolves canvases through the agent tier (Task 9).

Verified: a valid agent-first output returns `ok:true`; an output with an embedded connection canvas + two task generators returns `CANVAS_IN_CONNECTION, MULTIPLE_TASK_GENERATORS, …`.

## The prompt contract

The daemon's generation instructions are the §6.1 prompt (`/system` → "Daemon prompt — the generation contract"): emit `agents[]` + `connections[]` + `canvases[]`, one task_generator peer, canvases as first-class documents with owner + source_path, and a self-check before returning.

## Gate

Installing the prompt into the **live** daemon (so it actually emits the new shape) is coupled to Task 9 — the compiler/UI must read `agent_canvases` before generation stops writing the old fields, or generation would produce output nothing yet renders. So: contract defined + validator shipped now; the live prompt swap lands with Task 9. After that, regenerating the analyst produces the Task 2 shape and `validateAgentFirstOutput` passes with no migration.
