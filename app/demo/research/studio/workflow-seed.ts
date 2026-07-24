/* workflow-seed.ts — the Research studio's canvases.

   Source of the daemon canvases: general_orchestration_daemon_drafts /
   c2b2f46c-3c3e-451a-a4cb-1b8acaf86115, agent_connections[id=93c45cc3-...] and
   the top-level workflow/policy/state_policy canvas tables (DEMO_1_LONGEVITY).

   Three seeds are exported:
     · buildResearchWorkflowSeed — the bottom "Workflow" drawer: all seven pulled
       daemon canvases mirrored 1:1 as tabs (read-only reference of the setup).
     · buildResearchPolicySeed  — Model Setup -> Policy: a CHAT-NATIVE screening
       decision flow. Unlike the daemon policy (which emits an agent-action JSON
       commit), this compiles to a conversational screening prompt, so saving it
       from Model Setup reproduces the intended chat behavior. Kept in sync with
       the policy_canvases row stored for /demo/research/input.
     · buildResearchStateSeed   — Model Setup -> State: the chat-native
       state-extraction canvas, kept in sync with the stored state canvas.

   These seeds are only the fallback shown until the saved DB canvas hydrates. */

import type { CanvasDoc } from "../../../components/canvas/Canvas";

/** Bottom-drawer seed: the DB daemon canvases mirrored 1:1 as tabs. */
export function buildResearchWorkflowSeed(_primaryAgent: string): CanvasDoc {
  return {
    "version": 2,
    "activeId": "starter-policy-canvas",
    "canvases": [
      {
        "id": "workflow-overview",
        "name": "Overall Workflow",
        "graph": {
          "edges": [
            {
              "id": "56f3198e-d564-4535-a058-adc28356dc45",
              "source": "workflow-overview-start",
              "target": "workflow-overview-stage-idea-generation-screening",
              "sourceHandle": null,
              "targetHandle": null
            }
          ],
          "nodes": [
            {
              "id": "workflow-overview-start",
              "data": {
                "label": "Editable overview of the main workflow stages. Each active agent receives stage-scoped policy/state canvases; direct exchanges additionally use pairwise agent-interaction canvases.",
                "runtimeRole": "workflow_overview",
                "workflowCanvasId": "workflow-overview",
                "workflowOverview": true
              },
              "type": "start",
              "position": {
                "x": 80,
                "y": 120
              }
            },
            {
              "id": "workflow-overview-stage-idea-generation-screening",
              "data": {
                "label": "Stage: Idea generation screening\nPurpose: Receive the selected company profile and available context, perform the full initial screening workflow, and return a structured idea note with a recommendation.\nEntry: The task environment agent has selected a company profile and any available supporting company, disclosure, peer, and consensus context.\nCompletion: A final idea-generation note is returned with all required fields populated, including Initial Hypothesis, Questions Requiring Investigation, Reasons NOT to Continue, Screening Decision, and Confidence.\nAgents:\n- An investment analyst workflow: idea generation stage (905cdf83-5970-4598-8642-dea17852cc99) - Deliver the selected company task and context, receive one final screening note JSON, validate it against the required contract, and score the result.\n- Investment analyst performing idea-generation screening (task_performing_agent) - Deliver the selected company task and context, receive one final screening note JSON, validate it against the required contract, and score the result.",
                "runtimeRole": "workflow_overview",
                "workflowStageId": "idea-generation-screening",
                "workflowCanvasId": "workflow-overview",
                "workflowOverview": true,
                "workflowStageName": "Idea generation screening",
                "workflowStageAgents": [
                  {
                    "role": "Deliver the selected company task and context, receive one final screening note JSON, validate it against the required contract, and score the result.",
                    "agentId": "905cdf83-5970-4598-8642-dea17852cc99",
                    "agentTitle": "An investment analyst workflow: idea generation stage"
                  },
                  {
                    "role": "Deliver the selected company task and context, receive one final screening note JSON, validate it against the required contract, and score the result.",
                    "agentId": "task_performing_agent",
                    "agentTitle": "Investment analyst performing idea-generation screening"
                  }
                ],
                "workflowStagePurpose": "Receive the selected company profile and available context, perform the full initial screening workflow, and return a structured idea note with a recommendation.",
                "workflowStageEntryCondition": "The task environment agent has selected a company profile and any available supporting company, disclosure, peer, and consensus context.",
                "workflowStageCompletionCondition": "A final idea-generation note is returned with all required fields populated, including Initial Hypothesis, Questions Requiring Investigation, Reasons NOT to Continue, Screening Decision, and Confidence."
              },
              "type": "stage",
              "position": {
                "x": 420,
                "y": 120
              }
            }
          ]
        },
        "freeText": "airlab:workflow-overview\nPrimary agent: An investment analyst workflow: idea generation stage\nThis overview is editable and non-runtime. Solo-stage agent policy/state canvases are separate from pairwise canvases used only for actual agent interactions."
      },
      {
        "id": "task-environment-policy",
        "name": "Task lifecycle",
        "graph": {
          "edges": [
            {
              "id": "task-policy-start-condition",
              "source": "task-policy-start",
              "target": "task-policy-observation-empty"
            },
            {
              "id": "task-policy-empty-sample",
              "source": "task-policy-observation-empty",
              "target": "task-policy-set-action",
              "sourceHandle": "true"
            },
            {
              "id": "task-policy-not-empty-completed",
              "source": "task-policy-observation-empty",
              "target": "task-policy-completed",
              "sourceHandle": "false"
            },
            {
              "id": "task-policy-commit-display",
              "source": "task-policy-set-action",
              "target": "task-policy-display-started"
            },
            {
              "id": "task-policy-completed-terminate",
              "source": "task-policy-completed",
              "target": "task-policy-terminate-completed"
            }
          ],
          "nodes": [
            {
              "id": "task-policy-start",
              "data": {
                "label": "Handle one task-environment turn."
              },
              "type": "start",
              "position": {
                "x": 0,
                "y": 160
              }
            },
            {
              "id": "task-policy-observation-empty",
              "data": {
                "label": "state agent_latest_observation is empty"
              },
              "type": "condition",
              "position": {
                "x": 260,
                "y": 160
              }
            },
            {
              "id": "task-policy-set-action",
              "data": {
                "label": "Construct and commit the sampled-task action directly from selected_task.",
                "actionType": "code",
                "codeSource": "const defaultTargetAgentId = \"\";\nconst actingAgentId = \"\";\nconst boundDispatchOperationTypes: string[] = [\"display\"];\nconst operationTypes = new Set([\n  \"display\",\n  \"agent_call\",\n  \"tool_call\",\n]);\n\nconst collapseWhitespace = (value: string): string =>\n  value.replace(/\\s+/g, \" \").trim();\nconst asRecord = (value: unknown): Record<string, unknown> | null =>\n  value && typeof value === \"object\" && !Array.isArray(value)\n    ? (value as Record<string, unknown>)\n    : null;\nconst asText = (value: unknown): string =>\n  typeof value === \"string\" ? collapseWhitespace(value) : \"\";\nconst parseJsonLike = (value: unknown): unknown => {\n  if (typeof value !== \"string\") return value;\n  const trimmed = value.trim();\n  if (!trimmed) return value;\n  try {\n    return JSON.parse(trimmed);\n  } catch {\n    return value;\n  }\n};\nconst normalizeOperationType = (value: unknown): string => {\n  const normalized = asText(value).toLowerCase().replace(/[\\s-]+/g, \"_\");\n  if (normalized === \"call_agent\" || normalized === \"agent\") return \"agent_call\";\n  if (normalized === \"call_tool\" || normalized === \"tool\") return \"tool_call\";\n  if (normalized === \"message\" || normalized === \"reply\") return \"display\";\n  return operationTypes.has(normalized) ? normalized : \"display\";\n};\nconst normalizePayload = (value: unknown): unknown => {\n  if (value === undefined) return null;\n  if (typeof value === \"string\") return collapseWhitespace(value);\n  return value;\n};\n\nconst normalizeOperation = (rawValue: unknown, forcedType = \"\") => {\n  const parsed = parseJsonLike(rawValue);\n  const record = asRecord(parsed);\n  if (!record) {\n    const payload = normalizePayload(parsed);\n    if (payload === null || payload === \"\") return null;\n    return { type: forcedType || \"display\", payload };\n  }\n  const rawPayload =\n    record.payload ??\n    record.message ??\n    record.content ??\n    record.assistantMessage ??\n    record.observation ??\n    (typeof record.action === \"string\" ? record.action : undefined);\n  const payload = normalizePayload(rawPayload);\n  const toolName = asText(record.toolName ?? record.tool_name);\n  const metadata = asRecord(record.metadata);\n  return {\n    type:\n      forcedType ||\n      normalizeOperationType(record.type ?? record.actionType ?? record.kind),\n    payload,\n    ...(toolName ? { toolName } : {}),\n    ...(record.input !== undefined ? { input: record.input } : {}),\n    ...(metadata ? { metadata } : {}),\n  };\n};\n\nconst normalizeAction = (rawValue: unknown) => {\n  const parsed = parseJsonLike(rawValue);\n  let record = asRecord(parsed);\n  if (record) {\n    const nestedLatestAction = parseJsonLike(record.agent_latest_action);\n    const nestedAction = parseJsonLike(record.action);\n    record = asRecord(nestedLatestAction) ?? asRecord(nestedAction) ?? record;\n  }\n\n  if (!record) {\n    if (!defaultTargetAgentId) return null;\n    const firstOperation = normalizeOperation(\n      parsed,\n      boundDispatchOperationTypes[0] ?? \"\"\n    );\n    if (!firstOperation) return null;\n    const operations =\n      boundDispatchOperationTypes.length > 0\n        ? boundDispatchOperationTypes.map((type, index) =>\n            index === 0 ? firstOperation : { type, payload: null }\n          )\n        : [firstOperation];\n    return {\n      targetAgentId: defaultTargetAgentId,\n      operations,\n    };\n  }\n\n  const requestedTargetAgentId = asText(\n      record.targetAgentId ??\n        record.target_agent_id ??\n        record.recipientAgentId ??\n        record.recipient_agent_id\n    );\n  const targetAgentId =\n    !requestedTargetAgentId || requestedTargetAgentId === actingAgentId\n      ? defaultTargetAgentId\n      : requestedTargetAgentId;\n  if (!targetAgentId || targetAgentId === actingAgentId) return null;\n  const rawOperations = Array.isArray(record.operations)\n    ? record.operations\n    : Array.isArray(record.actions)\n      ? record.actions\n      : Array.isArray(record.dispatches)\n        ? record.dispatches\n        : [record];\n  const operations =\n    boundDispatchOperationTypes.length > 0\n      ? boundDispatchOperationTypes.map((type, index) =>\n          normalizeOperation(rawOperations[index] ?? {}, type) ?? {\n            type,\n            payload: null,\n          }\n        )\n      : rawOperations\n          .map((operation) => normalizeOperation(operation))\n          .filter((operation): operation is Record<string, unknown> => operation !== null);\n  if (operations.length === 0) return null;\n  const rawMetadata = asRecord(record.metadata);\n  const reward = record.target_reward ?? record.reward_for_target ?? record.reward;\n  const metadata = {\n    ...(rawMetadata ?? {}),\n    ...(reward !== undefined ? { reward } : {}),\n  };\n\n  return {\n    targetAgentId,\n    operations,\n    ...(Object.keys(metadata).length > 0 ? { metadata } : {}),\n  };\n};\n\nconst readPolicyOutput = (): unknown => {\n  const statePayload = parseJsonLike(ctx.state.selected_task);\n  const statePayloadRecord = asRecord(statePayload);\n  if (\n    statePayload === null ||\n    statePayload === undefined ||\n    statePayload === \"\" ||\n    (statePayloadRecord && Object.keys(statePayloadRecord).length === 0)\n  ) {\n    throw new Error(\"The state canvas did not persist a value in selected_task.\");\n  }\n  return {\n    targetAgentId: defaultTargetAgentId,\n    operations: [{\n      type: boundDispatchOperationTypes[0] ?? \"display\",\n      payload: statePayload,\n    }],\n    metadata: {\"reward\":0},\n  };\n};\nconst committedAction = normalizeAction(readPolicyOutput());\nif (!committedAction) return {};\n\nconst fieldNames = Object.keys(ctx.state);\nconst findField = (canonicalName: string): string | null =>\n  fieldNames.find((name) => name.trim().toLowerCase() === canonicalName) ?? null;\nconst memoryFieldName = findField(\"new_events\") ??\n  findField(\"new_conversations\");\nconst latestActionFieldName = findField(\"agent_latest_action\");\nconst latestObservationFieldName = findField(\"agent_latest_observation\");\nconst latestRewardFieldName = findField(\"agent_latest_reward\");\nconst fieldType = (fieldName: string | null): string =>\n  fieldName\n    ? ctx.stateSchema.find((field) => field.fieldName === fieldName)?.type ?? \"string\"\n    : \"string\";\nconst latestObservation = latestObservationFieldName\n  ? ctx.state[latestObservationFieldName] ?? null\n  : null;\nconst latestReward = latestRewardFieldName\n  ? ctx.state[latestRewardFieldName] ?? null\n  : null;\n\nconst parseEvents = (value: unknown): Array<Record<string, unknown>> => {\n  const parsed = parseJsonLike(value);\n  return Array.isArray(parsed)\n    ? parsed\n        .filter(\n          (entry): entry is Record<string, unknown> => asRecord(entry) !== null\n        )\n        .map((entry) => ({ ...entry }))\n    : [];\n};\nconst events = memoryFieldName ? parseEvents(ctx.state[memoryFieldName]) : [];\nconst latestEvent = events[events.length - 1];\nif (latestEvent && (latestEvent.action === null || latestEvent.action === undefined || latestEvent.action === \"\")) {\n  latestEvent.action = committedAction;\n  if (latestEvent.observation === null || latestEvent.observation === undefined || latestEvent.observation === \"\") {\n    latestEvent.observation = latestObservation;\n  }\n  if (latestEvent.reward === null || latestEvent.reward === undefined || latestEvent.reward === \"\") {\n    latestEvent.reward = latestReward;\n  }\n} else {\n  events.push({\n    action: committedAction,\n    observation: latestObservation,\n    reward: latestReward,\n  });\n}\n\nconst setState: Record<string, unknown> = {};\nif (latestActionFieldName) {\n  setState[latestActionFieldName] =\n    fieldType(latestActionFieldName) === \"json\"\n      ? committedAction\n      : JSON.stringify(committedAction);\n}\nif (memoryFieldName) {\n  setState[memoryFieldName] =\n    fieldType(memoryFieldName) === \"json\" ? events : JSON.stringify(events);\n}\n\nconst operationLocals = committedAction.operations.reduce(\n  (locals: Record<string, unknown>, operation: Record<string, unknown>, index: number) => {\n    locals[`committed_action_operation_${index}`] = operation;\n    locals[`committed_action_operation_${index}_payload`] = operation.payload;\n    locals[`committed_action_operation_${index}_input`] = operation.input ?? null;\n    locals[`committed_action_operation_${index}_dispatch_input`] =\n      operation.input ?? operation.payload ?? null;\n    return locals;\n  },\n  {}\n);\nconst firstPayload = committedAction.operations[0]?.payload ?? null;\n\nreturn {\n  setState,\n  setLocals: {\n    committed_action: committedAction,\n    committed_action_payload: firstPayload,\n    carried_output: firstPayload,\n    ...operationLocals,\n  },\n};",
                "codeLanguage": "typescript",
                "codeTemplateId": "policy_turn_commit",
                "actionTypeSource": "manual",
                "localInputFields": [
                  {
                    "name": "finalized_assistant_message",
                    "type": "string"
                  },
                  {
                    "name": "carried_output",
                    "type": "string"
                  }
                ],
                "codeLocalOutputFields": [
                  {
                    "name": "committed_action",
                    "type": "json"
                  },
                  {
                    "name": "committed_action_payload",
                    "type": "json"
                  },
                  {
                    "name": "carried_output",
                    "type": "json"
                  },
                  {
                    "name": "committed_action_operation_0",
                    "type": "json"
                  },
                  {
                    "name": "committed_action_operation_0_payload",
                    "type": "json"
                  },
                  {
                    "name": "committed_action_operation_0_input",
                    "type": "json"
                  },
                  {
                    "name": "committed_action_operation_0_dispatch_input",
                    "type": "json"
                  }
                ],
                "policyStatePayloadField": "selected_task",
                "policyStatePayloadMetadata": {
                  "reward": 0
                }
              },
              "type": "code",
              "position": {
                "x": 540,
                "y": 40
              }
            },
            {
              "id": "task-policy-display-started",
              "data": {
                "label": "Display the sampled task to the connected solution agent.",
                "displayType": "text",
                "inputVariable": "committed_action_operation_0_payload"
              },
              "type": "display",
              "position": {
                "x": 800,
                "y": 40
              }
            },
            {
              "id": "task-policy-completed",
              "data": {
                "label": "Return an empty action after receiving the final solution.",
                "actionType": "code",
                "codeSource": "return {\n  setState: {\n    agent_latest_action: \"\",\n  },\n};",
                "codeLanguage": "typescript",
                "actionTypeSource": "manual"
              },
              "type": "code",
              "position": {
                "x": 540,
                "y": 300
              }
            },
            {
              "id": "task-policy-terminate-completed",
              "data": {
                "label": "The final solution has been evaluated.",
                "terminationScope": "interaction"
              },
              "type": "terminate",
              "position": {
                "x": 820,
                "y": 300
              }
            }
          ]
        },
        "freeText": ""
      },
      {
        "id": "starter-state-canvas",
        "name": "Task selection and state update",
        "graph": {
          "edges": [
            {
              "id": "starter-state-ingress-to-summary-gate",
              "source": "starter-state-ingress-append",
              "target": "starter-state-summary-gate-memory-size"
            },
            {
              "id": "starter-state-summary-gate-true",
              "source": "starter-state-summary-gate",
              "target": "starter-state-update-summary",
              "sourceHandle": "true"
            },
            {
              "id": "starter-state-summary-gate-false",
              "source": "starter-state-summary-gate",
              "target": "starter-state-update-remaining",
              "sourceHandle": "false"
            },
            {
              "id": "starter-state-summary-to-clear",
              "source": "starter-state-update-summary",
              "target": "starter-state-clear-new-events"
            },
            {
              "id": "starter-state-clear-to-remaining",
              "source": "starter-state-clear-new-events",
              "target": "starter-state-update-remaining"
            },
            {
              "id": "starter-state-summary-gate-memory-size-to-condition",
              "source": "starter-state-summary-gate-memory-size",
              "target": "starter-state-summary-gate"
            },
            {
              "id": "task-state-start-condition",
              "source": "starter-state-start",
              "target": "task-state-observation-empty"
            },
            {
              "id": "task-state-empty-selection-check",
              "source": "task-state-observation-empty",
              "target": "task-state-selection-empty",
              "sourceHandle": "true"
            },
            {
              "id": "task-state-not-empty-ingress",
              "source": "task-state-observation-empty",
              "target": "starter-state-ingress-append",
              "sourceHandle": "false"
            },
            {
              "id": "task-state-needs-selection",
              "source": "task-state-selection-empty",
              "target": "task-state-random-task",
              "sourceHandle": "true"
            },
            {
              "id": "task-state-selection-exists-ingress",
              "source": "task-state-selection-empty",
              "target": "starter-state-ingress-append",
              "sourceHandle": "false"
            },
            {
              "id": "task-state-random-prepare",
              "source": "task-state-random-task",
              "target": "task-state-prepare-selection"
            },
            {
              "id": "task-state-prepare-trajectory",
              "source": "task-state-prepare-selection",
              "target": "task-state-read-trajectory"
            },
            {
              "id": "task-state-selection-commit",
              "source": "task-state-read-trajectory",
              "target": "task-state-commit-selection"
            },
            {
              "id": "task-state-commit-ingress",
              "source": "task-state-commit-selection",
              "target": "starter-state-ingress-append"
            }
          ],
          "nodes": [
            {
              "id": "starter-state-start",
              "data": {
                "label": "Adapt this Start text to the project/agent. Use the current state as the default input. summary stores condensed past context, and new_events stores recent unsummarized { action, observation, reward } events."
              },
              "type": "start",
              "position": {
                "x": 0,
                "y": 200
              }
            },
            {
              "id": "starter-state-ingress-append",
              "data": {
                "label": "Add agent_latest_observation and agent_latest_reward to new_events.",
                "actionType": "code",
                "actionTypeSource": "auto",
                "localInputFields": [
                  {
                    "name": "agent_latest_observation",
                    "type": "string"
                  },
                  {
                    "name": "agent_latest_reward",
                    "type": "string"
                  }
                ],
                "executableCodeOps": [
                  {
                    "kind": "append_list_item",
                    "field": "new_events",
                    "source": {
                      "kind": "latest_observation_and_reward_event"
                    }
                  }
                ]
              },
              "type": "code",
              "position": {
                "x": 1940,
                "y": 190
              }
            },
            {
              "id": "starter-state-summary-gate",
              "data": {
                "label": "memory_over_limit is true"
              },
              "type": "condition",
              "position": {
                "x": 1940,
                "y": 510
              }
            },
            {
              "id": "starter-state-update-summary",
              "data": {
                "label": "Update summary with a concise summary of summary plus new_events.",
                "actionType": "prompt"
              },
              "type": "prompt",
              "position": {
                "x": 1760,
                "y": 670
              }
            },
            {
              "id": "starter-state-clear-new-events",
              "data": {
                "label": "Set new_events to empty list.",
                "actionType": "code",
                "actionTypeSource": "auto",
                "executableCodeOps": [
                  {
                    "kind": "set_field",
                    "field": "new_events",
                    "source": {
                      "kind": "constant",
                      "value": []
                    }
                  }
                ]
              },
              "type": "code",
              "position": {
                "x": 1760,
                "y": 820
              }
            },
            {
              "id": "starter-state-update-remaining",
              "data": {
                "label": "Use only the current state to update the remaining fields. Leave unchanged values untouched and only fill fields supported by the current state.",
                "actionType": "prompt"
              },
              "type": "prompt",
              "position": {
                "x": 2130,
                "y": 670
              }
            },
            {
              "id": "starter-state-summary-gate-memory-size",
              "data": {
                "label": "Measure whether summary plus new_events exceeds 4000 characters.",
                "actionType": "code",
                "codeSource": "const textLength = (value: unknown): number => {\n  if (value === null || value === undefined) return 0;\n  if (typeof value === \"string\") return value.length;\n  return JSON.stringify(value).length;\n};\n\nconst memoryLength =\n  textLength(ctx.state.summary) +\n  textLength(ctx.state.new_events);\n\nreturn {\n  setLocals: {\n    memory_over_limit: memoryLength > 4000,\n  },\n};",
                "codeLanguage": "typescript",
                "actionTypeSource": "auto",
                "codeLocalOutputFields": [
                  {
                    "name": "memory_over_limit",
                    "type": "boolean"
                  }
                ]
              },
              "type": "code",
              "position": {
                "x": 1940,
                "y": 350
              }
            },
            {
              "id": "task-state-observation-empty",
              "data": {
                "label": "state agent_latest_observation is empty"
              },
              "type": "condition",
              "position": {
                "x": 260,
                "y": 200
              }
            },
            {
              "id": "task-state-selection-empty",
              "data": {
                "label": "state selected_task_id is empty"
              },
              "type": "condition",
              "position": {
                "x": 540,
                "y": 80
              }
            },
            {
              "id": "task-state-random-task",
              "data": {
                "label": "Choose one complete task when the simulation starts.",
                "toolName": "choose_random_task",
                "sourceType": "dataset_read",
                "datasetName": "tasks",
                "description": "Return exactly one randomly sampled complete task row.",
                "paramsSchema": "",
                "resultVariable": "state_sampled_task_result",
                "datasetReadRandomRow": true
              },
              "type": "tool_call",
              "position": {
                "x": 820,
                "y": 0
              }
            },
            {
              "id": "task-state-prepare-selection",
              "data": {
                "label": "Prepare the sampled task and task id for state storage.",
                "actionType": "code",
                "codeSource": "const asRecord = (value: unknown): Record<string, unknown> => {\n  if (value && typeof value === \"object\" && !Array.isArray(value)) return value as Record<string, unknown>;\n  if (typeof value === \"string\" && value.trim()) {\n    try {\n      const parsed = JSON.parse(value) as unknown;\n      return parsed && typeof parsed === \"object\" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};\n    } catch { return {}; }\n  }\n  return {};\n};\nconst result = asRecord(ctx.locals.state_sampled_task_result);\nconst records = Array.isArray(result.records) ? result.records : [];\nconst sampledTaskRow = asRecord(records[0]);\nconst sampledTask = asRecord(sampledTaskRow.profile);\nconst taskId = String(sampledTaskRow.task_id ?? sampledTask.task_id ?? \"\").trim();\nif (!taskId) throw new Error(\"The sampled task is missing task_id.\");\nreturn {\n  setLocals: {\n    sampled_task_for_run: sampledTask,\n    sampled_task_id_for_run: taskId,\n    task_id: taskId,\n  },\n};",
                "codeLanguage": "typescript",
                "actionTypeSource": "manual",
                "localInputFields": [
                  {
                    "name": "state_sampled_task_result",
                    "type": "json"
                  }
                ],
                "codeLocalOutputFields": [
                  {
                    "name": "sampled_task_for_run",
                    "type": "json"
                  },
                  {
                    "name": "sampled_task_id_for_run",
                    "type": "string"
                  },
                  {
                    "name": "task_id",
                    "type": "string"
                  }
                ]
              },
              "type": "code",
              "position": {
                "x": 1100,
                "y": 0
              }
            },
            {
              "id": "task-state-read-trajectory",
              "data": {
                "label": "Load only the trajectory associated with the sampled task.",
                "toolName": "read_associated_price_trajectory",
                "sourceType": "dataset_read",
                "datasetName": "price_trajectories",
                "description": "Return the hidden price trajectory whose task_id matches the sampled task.",
                "paramsSchema": "{\"task_id\":{\"type\":\"string\",\"description\":\"The sampled task id.\"}}",
                "resultVariable": "state_sampled_trajectory_result",
                "datasetReadRandomRow": true
              },
              "type": "tool_call",
              "position": {
                "x": 1380,
                "y": 0
              }
            },
            {
              "id": "task-state-commit-selection",
              "data": {
                "label": "Set the selected task and associated trajectory in state.",
                "actionType": "code",
                "codeSource": "const asRecord = (value: unknown): Record<string, unknown> => {\n  if (value && typeof value === \"object\" && !Array.isArray(value)) return value as Record<string, unknown>;\n  if (typeof value === \"string\" && value.trim()) {\n    try {\n      const parsed = JSON.parse(value) as unknown;\n      return parsed && typeof parsed === \"object\" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};\n    } catch { return {}; }\n  }\n  return {};\n};\nconst sampledTask = asRecord(ctx.locals.sampled_task_for_run);\nconst trajectoryResult = asRecord(ctx.locals.state_sampled_trajectory_result);\nconst trajectoryRecords = Array.isArray(trajectoryResult.records) ? trajectoryResult.records : [];\nconst sampledTrajectory = asRecord(trajectoryRecords[0]);\nif (String(sampledTrajectory.task_id ?? \"\") !== String(ctx.locals.sampled_task_id_for_run ?? \"\")) {\n  throw new Error(\"No price trajectory is associated with the sampled task.\");\n}\nreturn {\n  setState: {\n    selected_task_id: String(ctx.locals.sampled_task_id_for_run ?? \"\"),\n    selected_task: sampledTask,\n    selected_price_trajectory: sampledTrajectory,\n  },\n};",
                "codeLanguage": "typescript",
                "actionTypeSource": "manual",
                "localInputFields": [
                  {
                    "name": "sampled_task_for_run",
                    "type": "json"
                  },
                  {
                    "name": "sampled_task_id_for_run",
                    "type": "string"
                  },
                  {
                    "name": "state_sampled_trajectory_result",
                    "type": "json"
                  }
                ]
              },
              "type": "code",
              "position": {
                "x": 1660,
                "y": 0
              }
            }
          ]
        },
        "freeText": "Editable starter state template. Adapt the Start text and downstream prompts to the project/agent while preserving the first ingress append Code node unless the project genuinely needs a different deterministic ingress append."
      },
      {
        "id": "task-environment-price-trajectory-reward",
        "name": "Thirty-day realized return",
        "graph": {
          "edges": [
            {
              "id": "task-reward-start-validation",
              "source": "task-reward-start",
              "target": "task-reward-validate-format"
            },
            {
              "id": "task-reward-validation-gate",
              "source": "task-reward-validate-format",
              "target": "task-reward-format-valid"
            },
            {
              "id": "task-reward-invalid-calculate",
              "source": "task-reward-format-valid",
              "target": "task-reward-calculate",
              "sourceHandle": "false"
            },
            {
              "id": "task-reward-valid-prepare",
              "source": "task-reward-format-valid",
              "target": "task-reward-prepare-price-action",
              "sourceHandle": "true"
            },
            {
              "id": "task-reward-prepare-availability",
              "source": "task-reward-prepare-price-action",
              "target": "task-reward-price-action-available"
            },
            {
              "id": "task-reward-price-unavailable-zero",
              "source": "task-reward-price-action-available",
              "target": "task-reward-zero-missing-trajectory",
              "sourceHandle": "false"
            },
            {
              "id": "task-reward-zero-calculate",
              "source": "task-reward-zero-missing-trajectory",
              "target": "task-reward-calculate"
            },
            {
              "id": "task-reward-price-available-score",
              "source": "task-reward-price-action-available",
              "target": "task-reward-score-decision",
              "sourceHandle": "true"
            },
            {
              "id": "task-reward-score-calculate",
              "source": "task-reward-score-decision",
              "target": "task-reward-calculate"
            }
          ],
          "nodes": [
            {
              "id": "task-reward-start",
              "data": {
                "label": "Validate the completed screening decision against final_output_format {\"type\":\"object\",\"required\":[\"Initial Hypothesis\",\"Questions Requiring Investigation\",\"Reasons NOT to Continue\",\"Screening Decision\",\"Confidence\"],\"properties\":{\"Initial Hypothesis\":{\"type\":\"string\"},\"Questions Requiring Investigation\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}},\"Reasons NOT to Continue\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}},\"Screening Decision\":{\"type\":\"string\",\"enum\":[\"Reject\",\"Watchlist\",\"Advance to full research\"],\"description\":\"Reject: do not invest and remove from active consideration. Watchlist: interesting but insufficient evidence; continue monitoring. Advance to full research: worth deeper investigation; begin detailed due diligence.\"},\"Confidence\":{\"type\":\"string\"}},\"additionalProperties\":false}, then return its matched 30-day realized percentage return."
              },
              "type": "start",
              "position": {
                "x": 0,
                "y": 180
              }
            },
            {
              "id": "task-reward-validate-format",
              "data": {
                "label": "Return 0 for an empty observation; otherwise validate it against final_output_format.",
                "actionType": "code",
                "codeSource": "const parseJsonValue = (value: unknown): { ok: boolean; value: unknown } => {\n  if (value !== null && typeof value === \"object\") return { ok: true, value };\n  if (typeof value !== \"string\") return { ok: false, value: null };\n  const text = value.trim();\n  if (!text || text.startsWith(\"```\")) return { ok: false, value: null };\n  try { return { ok: true, value: JSON.parse(text) as unknown }; }\n  catch { return { ok: false, value: null }; }\n};\nconst isRecord = (value: unknown): value is Record<string, unknown> =>\n  !!value && typeof value === \"object\" && !Array.isArray(value);\nconst sameJson = (left: unknown, right: unknown): boolean =>\n  JSON.stringify(left) === JSON.stringify(right);\nconst valueType = (value: unknown): string => {\n  if (value === null) return \"null\";\n  if (Array.isArray(value)) return \"array\";\n  if (Number.isInteger(value)) return \"integer\";\n  return typeof value;\n};\nconst validateSchema = (value: unknown, schema: unknown): boolean => {\n  if (!isRecord(schema)) return true;\n  if (Array.isArray(schema.allOf) && !schema.allOf.every((item) => validateSchema(value, item))) return false;\n  if (Array.isArray(schema.anyOf) && !schema.anyOf.some((item) => validateSchema(value, item))) return false;\n  if (Array.isArray(schema.oneOf) && schema.oneOf.filter((item) => validateSchema(value, item)).length !== 1) return false;\n  if (Array.isArray(schema.enum) && !schema.enum.some((item) => sameJson(item, value))) return false;\n  if (Object.prototype.hasOwnProperty.call(schema, \"const\") && !sameJson(schema.const, value)) return false;\n  const allowedTypes = Array.isArray(schema.type) ? schema.type : typeof schema.type === \"string\" ? [schema.type] : [];\n  if (allowedTypes.length > 0) {\n    const actual = valueType(value);\n    if (!allowedTypes.some((expected) => expected === actual || (expected === \"number\" && (actual === \"number\" || actual === \"integer\")))) return false;\n  }\n  const properties = isRecord(schema.properties) ? schema.properties : null;\n  const required = Array.isArray(schema.required) ? schema.required.map(String) : [];\n  if (properties || required.length > 0) {\n    if (!isRecord(value)) return false;\n    if (required.some((name) => !Object.prototype.hasOwnProperty.call(value, name))) return false;\n    if (properties) {\n      for (const [name, childSchema] of Object.entries(properties)) {\n        if (Object.prototype.hasOwnProperty.call(value, name) && !validateSchema(value[name], childSchema)) return false;\n      }\n      if (schema.additionalProperties === false && Object.keys(value).some((name) => !Object.prototype.hasOwnProperty.call(properties, name))) return false;\n    }\n  }\n  if (Object.prototype.hasOwnProperty.call(schema, \"items\")) {\n    if (!Array.isArray(value) || !value.every((item) => validateSchema(item, schema.items))) return false;\n  }\n  return true;\n};\nconst validateTemplate = (value: unknown, template: unknown): boolean => {\n  if (Array.isArray(template)) {\n    return Array.isArray(value) && (template.length === 0 || value.every((item) => validateTemplate(item, template[0])));\n  }\n  if (isRecord(template)) {\n    if (!isRecord(value) || Object.keys(template).length === 0) return false;\n    return Object.entries(template).every(([name, child]) =>\n      Object.prototype.hasOwnProperty.call(value, name) && validateTemplate(value[name], child)\n    );\n  }\n  if (template === null) return value === null;\n  return typeof value === typeof template;\n};\nconst zero = (reason: string) => ({\n  setLocals: {\n    reward_should_score: false,\n    validated_decision: null,\n    format_validation_error: reason,\n    reward: 0,\n    scalar_reward: 0,\n    carried_output: \"0\",\n  },\n});\nconst rawObservation = ctx.state.agent_latest_observation;\nif (rawObservation === null || rawObservation === undefined || (typeof rawObservation === \"string\" && !rawObservation.trim())) {\n  return zero(\"agent_latest_observation is empty\");\n}\nconst observation = parseJsonValue(rawObservation);\nif (!observation.ok) return zero(\"agent_latest_observation is not one unwrapped JSON value\");\nconst format = parseJsonValue(ctx.state.final_output_format);\nif (!format.ok || (isRecord(format.value) && Object.keys(format.value).length === 0)) {\n  return zero(\"final_output_format is unavailable\");\n}\nconst schemaKeys = new Set([\"$schema\", \"type\", \"properties\", \"required\", \"items\", \"allOf\", \"anyOf\", \"oneOf\", \"enum\", \"const\"]);\nconst isSchema = isRecord(format.value) && Object.keys(format.value).some((key) => schemaKeys.has(key));\nconst valid = isSchema\n  ? validateSchema(observation.value, format.value)\n  : validateTemplate(observation.value, format.value);\nif (!valid) return zero(\"agent_latest_observation does not match final_output_format\");\nreturn {\n  setLocals: {\n    reward_should_score: true,\n    validated_decision: observation.value,\n    format_validation_error: \"\",\n  },\n};",
                "codeLanguage": "typescript",
                "actionTypeSource": "manual",
                "codeLocalOutputFields": [
                  {
                    "name": "reward_should_score",
                    "type": "boolean"
                  },
                  {
                    "name": "validated_decision",
                    "type": "json"
                  },
                  {
                    "name": "format_validation_error",
                    "type": "string"
                  },
                  {
                    "name": "reward",
                    "type": "number"
                  },
                  {
                    "name": "scalar_reward",
                    "type": "number"
                  },
                  {
                    "name": "carried_output",
                    "type": "string"
                  }
                ]
              },
              "type": "code",
              "position": {
                "x": 280,
                "y": 180
              }
            },
            {
              "id": "task-reward-format-valid",
              "data": {
                "label": "reward_should_score is true"
              },
              "type": "condition",
              "position": {
                "x": 600,
                "y": 180
              }
            },
            {
              "id": "task-reward-prepare-price-action",
              "data": {
                "label": "Prepare only the next 30 calendar days of price action.",
                "actionType": "code",
                "codeSource": "const asRecord = (value: unknown): Record<string, unknown> => {\n  if (value && typeof value === \"object\" && !Array.isArray(value)) return value as Record<string, unknown>;\n  if (typeof value === \"string\" && value.trim()) {\n    try {\n      const parsed = JSON.parse(value) as unknown;\n      return parsed && typeof parsed === \"object\" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};\n    } catch { return {}; }\n  }\n  return {};\n};\nconst parseCsvLine = (line: string): string[] => {\n  const cells: string[] = [];\n  let cell = \"\";\n  let quoted = false;\n  for (let index = 0; index < line.length; index += 1) {\n    const character = line[index];\n    if (character === '\"') {\n      if (quoted && line[index + 1] === '\"') { cell += '\"'; index += 1; }\n      else quoted = !quoted;\n    } else if (character === \",\" && !quoted) { cells.push(cell); cell = \"\"; }\n    else cell += character;\n  }\n  cells.push(cell);\n  return cells;\n};\nconst trajectoryRow = asRecord(ctx.state.selected_price_trajectory);\nconst trajectory = asRecord(trajectoryRow.trajectory);\nconst files = Array.isArray(trajectory.files) ? trajectory.files.map(asRecord) : [];\nconst csvText = String(files.find((file) => String(file.name ?? \"\").toLowerCase().endsWith(\".csv\"))?.content ?? files[0]?.content ?? \"\");\nconst lines = csvText.split(/\\r?\\n/).filter((line) => line.trim());\nconst headers = lines.length > 0 ? parseCsvLine(lines[0]).map((value) => value.trim().toLowerCase()) : [];\nconst rows = lines.slice(1).flatMap((line) => {\n  const cells = parseCsvLine(line);\n  const read = (names: string[]) => {\n    const index = headers.findIndex((header) => names.includes(header));\n    return index >= 0 ? cells[index] : \"\";\n  };\n  const date = read([\"date\"]);\n  const close = Number(read([\"close\", \"adj close\", \"adjusted close\"]));\n  const high = Number(read([\"high\"]));\n  const low = Number(read([\"low\"]));\n  return /^20\\d{2}-\\d{2}-\\d{2}$/.test(date) && Number.isFinite(close)\n    ? [{ date, close, high: Number.isFinite(high) ? high : close, low: Number.isFinite(low) ? low : close }]\n    : [];\n}).sort((left, right) => left.date.localeCompare(right.date));\nconst requestedStart = String(trajectoryRow.start_date ?? trajectory.start_date ?? rows[0]?.date ?? \"\").slice(0, 10);\nconst startTime = Date.parse(requestedStart + \"T00:00:00Z\");\nconst endTime = Number.isFinite(startTime) ? startTime + 30 * 24 * 60 * 60 * 1000 : Number.NaN;\nconst windowRows = Number.isFinite(endTime)\n  ? rows.filter((row) => {\n      const time = Date.parse(row.date + \"T00:00:00Z\");\n      return time >= startTime && time <= endTime;\n    })\n  : [];\nlet peak = windowRows[0]?.close ?? 0;\nlet maxDrawdown = 0;\nfor (const row of windowRows) {\n  peak = Math.max(peak, row.close);\n  if (peak > 0) maxDrawdown = Math.min(maxDrawdown, (row.close - peak) / peak);\n}\nconst startClose = windowRows[0]?.close ?? 0;\nconst endClose = windowRows.at(-1)?.close ?? 0;\nconst available = windowRows.length >= 2 && startClose > 0;\nconst priceAction = available\n  ? {\n      ticker: String(trajectoryRow.ticker ?? trajectory.ticker ?? \"\"),\n      start_date: windowRows[0].date,\n      end_date: windowRows.at(-1)?.date ?? \"\",\n      calendar_day_horizon: 30,\n      trading_days: windowRows.length,\n      start_close: startClose,\n      end_close: endClose,\n      return_pct: ((endClose - startClose) / startClose) * 100,\n      max_drawdown_pct: maxDrawdown * 100,\n      highest_price: Math.max(...windowRows.map((row) => row.high)),\n      lowest_price: Math.min(...windowRows.map((row) => row.low)),\n      daily_price_action: windowRows,\n    }\n  : {};\nreturn {\n  setLocals: {\n    future_price_action_available: available,\n    future_price_action_30d: priceAction,\n  },\n};",
                "codeLanguage": "typescript",
                "actionTypeSource": "manual",
                "codeLocalOutputFields": [
                  {
                    "name": "future_price_action_available",
                    "type": "boolean"
                  },
                  {
                    "name": "future_price_action_30d",
                    "type": "json"
                  }
                ]
              },
              "type": "code",
              "position": {
                "x": 900,
                "y": 320
              }
            },
            {
              "id": "task-reward-price-action-available",
              "data": {
                "label": "future_price_action_available is true"
              },
              "type": "condition",
              "position": {
                "x": 1200,
                "y": 320
              }
            },
            {
              "id": "task-reward-zero-missing-trajectory",
              "data": {
                "label": "Return 0 when the matched 30-day price action is unavailable.",
                "actionType": "code",
                "codeSource": "return { setLocals: { reward: 0, scalar_reward: 0, carried_output: \"0\" } };",
                "codeLanguage": "typescript",
                "actionTypeSource": "manual",
                "codeLocalOutputFields": [
                  {
                    "name": "reward",
                    "type": "number"
                  },
                  {
                    "name": "scalar_reward",
                    "type": "number"
                  },
                  {
                    "name": "carried_output",
                    "type": "string"
                  }
                ]
              },
              "type": "code",
              "position": {
                "x": 1480,
                "y": 80
              }
            },
            {
              "id": "task-reward-score-decision",
              "data": {
                "label": "Return future_price_action_30d.return_pct as the scalar reward.",
                "actionType": "code",
                "codeSource": "const priceAction = ctx.locals.future_price_action_30d;\nconst returnPct = priceAction && typeof priceAction === \"object\" && !Array.isArray(priceAction)\n  ? Number((priceAction as Record<string, unknown>).return_pct)\n  : Number.NaN;\nconst reward = Number.isFinite(returnPct) ? returnPct : 0;\nreturn {\n  setLocals: {\n    reward,\n    scalar_reward: reward,\n    carried_output: String(reward),\n  },\n};",
                "codeLanguage": "typescript",
                "actionTypeSource": "manual",
                "localInputFields": [
                  {
                    "name": "future_price_action_30d",
                    "type": "json"
                  }
                ],
                "codeLocalOutputFields": [
                  {
                    "name": "reward",
                    "type": "number"
                  },
                  {
                    "name": "scalar_reward",
                    "type": "number"
                  },
                  {
                    "name": "carried_output",
                    "type": "string"
                  }
                ]
              },
              "type": "code",
              "position": {
                "x": 1480,
                "y": 420
              }
            },
            {
              "id": "task-reward-calculate",
              "data": {
                "label": "Output the realized 30-day percentage return without clipping.",
                "actionType": "code",
                "codeSource": "const raw = ctx.locals.carried_output;\nconst matched = typeof raw === \"string\"\n  ? raw.trim().match(/-?\\d+(?:\\.\\d+)?/i)?.[0]\n  : undefined;\nconst candidate = typeof raw === \"number\"\n  ? raw\n  : Number(matched ?? raw ?? 0);\nconst reward = Number.isFinite(candidate) ? candidate : 0;\nreturn {\n  setLocals: {\n    reward,\n    scalar_reward: reward,\n    carried_output: String(reward),\n  },\n};",
                "codeLanguage": "typescript",
                "codeTemplateId": "reward_scalar_calculation",
                "actionTypeSource": "manual",
                "localInputFields": [
                  {
                    "name": "carried_output",
                    "type": "string"
                  }
                ],
                "codeLocalOutputFields": [
                  {
                    "name": "reward",
                    "type": "number"
                  },
                  {
                    "name": "scalar_reward",
                    "type": "number"
                  },
                  {
                    "name": "carried_output",
                    "type": "string"
                  }
                ]
              },
              "type": "code",
              "position": {
                "x": 1800,
                "y": 240
              }
            }
          ]
        },
        "freeText": "Validate the completed screening JSON against {\"type\":\"object\",\"required\":[\"Initial Hypothesis\",\"Questions Requiring Investigation\",\"Reasons NOT to Continue\",\"Screening Decision\",\"Confidence\"],\"properties\":{\"Initial Hypothesis\":{\"type\":\"string\"},\"Questions Requiring Investigation\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}},\"Reasons NOT to Continue\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}},\"Screening Decision\":{\"type\":\"string\",\"enum\":[\"Reject\",\"Watchlist\",\"Advance to full research\"],\"description\":\"Reject: do not invest and remove from active consideration. Watchlist: interesting but insufficient evidence; continue monitoring. Advance to full research: worth deeper investigation; begin detailed due diligence.\"},\"Confidence\":{\"type\":\"string\"}},\"additionalProperties\":false}, then return the realized percentage price return over the matched next 30 calendar days."
      },
      {
        "id": "starter-policy-canvas",
        "name": "stage1TargetPolicy",
        "graph": {
          "edges": [
            {
              "id": "66bc7387-7f13-47f1-a071-4212e935c28d",
              "source": "7c25ee38-4150-44cb-9603-8749d6e345f3",
              "target": "e7eb683d-d2e6-401d-ad32-64c0b9025f92",
              "sourceHandle": null,
              "targetHandle": null
            },
            {
              "id": "c7e27d39-e0c7-402c-8516-af94e82d289f",
              "source": "3635e275-1414-45b4-b58b-bbbc2e4bd035",
              "target": "809e7341-11f8-4826-a7b8-900e661ad973",
              "sourceHandle": "true",
              "targetHandle": null
            },
            {
              "id": "f69bad83-45c6-4cc0-8347-524f55275794",
              "source": "3635e275-1414-45b4-b58b-bbbc2e4bd035",
              "target": "a424fe03-35ef-4ee8-9493-f4af4e9990fa",
              "sourceHandle": "false",
              "targetHandle": null
            },
            {
              "id": "d0770d79-da09-4564-acbf-f3230c7ab955",
              "source": "e7eb683d-d2e6-401d-ad32-64c0b9025f92",
              "target": "3635e275-1414-45b4-b58b-bbbc2e4bd035",
              "sourceHandle": null,
              "targetHandle": null
            },
            {
              "id": "13ffd07d-d124-475c-845a-1c46199f6fd5",
              "source": "7e6d9c3c-126d-47e1-8bf1-ddeddd83dfba",
              "target": "3792279d-f3e4-4014-83c8-1258050d9b9f",
              "sourceHandle": "true",
              "targetHandle": null
            },
            {
              "id": "a8b5ee8a-86f9-405c-b8b7-60b329b32674",
              "source": "7e6d9c3c-126d-47e1-8bf1-ddeddd83dfba",
              "target": "a2b33ced-e6c2-4cdc-811f-411f1ae321f7",
              "sourceHandle": "false",
              "targetHandle": null
            },
            {
              "id": "87309658-6715-4d8b-a80a-2e68d223b9c8",
              "source": "809e7341-11f8-4826-a7b8-900e661ad973",
              "target": "7e6d9c3c-126d-47e1-8bf1-ddeddd83dfba",
              "sourceHandle": null,
              "targetHandle": null
            },
            {
              "id": "c2f2802a-3773-4bb6-a4be-83d75b2aef25",
              "source": "3792279d-f3e4-4014-83c8-1258050d9b9f",
              "target": "a390a5b0-ead7-4c8e-9cfc-b25c4c31f380",
              "sourceHandle": null,
              "targetHandle": null
            },
            {
              "id": "060b7839-0e30-4873-b8a5-5826d0c94a6b",
              "source": "starter-policy-start",
              "target": "7c25ee38-4150-44cb-9603-8749d6e345f3",
              "sourceHandle": null,
              "targetHandle": null
            },
            {
              "id": "171a7a55-dfdd-4d93-aca9-63e7f80d2991",
              "source": "df380f46-b899-4172-9a9b-f70c7263def0",
              "target": "081abc16-6418-4d3e-9b95-194e0e9ff3d3",
              "sourceHandle": null,
              "targetHandle": null
            },
            {
              "id": "49e1a81f-8389-4ccf-9be8-5ea5e2a95d03",
              "source": "c1ba2fa3-c4a3-4e75-9acc-bb8c1cf191d1",
              "target": "8d678036-c9d6-4f6f-9fc0-00cd7f471ebb",
              "sourceHandle": null,
              "targetHandle": null
            },
            {
              "id": "dfd58df1-1814-4bb2-808e-ae29cdee6da9",
              "source": "8d678036-c9d6-4f6f-9fc0-00cd7f471ebb",
              "target": "df380f46-b899-4172-9a9b-f70c7263def0",
              "sourceHandle": null,
              "targetHandle": null
            },
            {
              "id": "ff8c99f1-43fe-41f0-be41-cf053656c764",
              "source": "a390a5b0-ead7-4c8e-9cfc-b25c4c31f380",
              "target": "c1ba2fa3-c4a3-4e75-9acc-bb8c1cf191d1",
              "sourceHandle": null,
              "targetHandle": null
            },
            {
              "id": "d4e79420-0188-47ad-96af-f87a782f5298",
              "source": "a424fe03-35ef-4ee8-9493-f4af4e9990fa",
              "target": "7e6d9c3c-126d-47e1-8bf1-ddeddd83dfba",
              "sourceHandle": null,
              "targetHandle": null
            },
            {
              "id": "496adba1-33f1-4234-9b65-a9b98aeb8b5e",
              "source": "a2b33ced-e6c2-4cdc-811f-411f1ae321f7",
              "target": "a390a5b0-ead7-4c8e-9cfc-b25c4c31f380",
              "sourceHandle": null,
              "targetHandle": null
            }
          ],
          "nodes": [
            {
              "id": "starter-policy-start",
              "data": {
                "label": "Start screening task\n\nTask-environment lifecycle contract: use the selected task profile as input, complete every policy step, and send exactly one final response to the task environment."
              },
              "type": "start",
              "position": {
                "x": 220,
                "y": -36
              }
            },
            {
              "id": "7c25ee38-4150-44cb-9603-8749d6e345f3",
              "data": {
                "label": "Review company profile and available context to orient on business and recent changes",
                "actionType": "prompt",
                "actionTypeSource": "auto"
              },
              "type": "prompt",
              "position": {
                "x": 220,
                "y": 210
              }
            },
            {
              "id": "e7eb683d-d2e6-401d-ad32-64c0b9025f92",
              "data": {
                "label": "Perform preliminary financial valuation and balance sheet screening",
                "actionType": "prompt",
                "actionTypeSource": "auto"
              },
              "type": "prompt",
              "position": {
                "x": 220,
                "y": 380
              }
            },
            {
              "id": "3635e275-1414-45b4-b58b-bbbc2e4bd035",
              "data": {
                "label": "Are recent disclosures available"
              },
              "type": "condition",
              "position": {
                "x": 220,
                "y": 550
              }
            },
            {
              "id": "809e7341-11f8-4826-a7b8-900e661ad973",
              "data": {
                "label": "Read the most decision-relevant disclosure sections selectively",
                "actionType": "prompt",
                "actionTypeSource": "auto"
              },
              "type": "prompt",
              "position": {
                "x": -100,
                "y": 720
              }
            },
            {
              "id": "a424fe03-35ef-4ee8-9493-f4af4e9990fa",
              "data": {
                "label": "Proceed without disclosure review"
              },
              "type": "continue",
              "position": {
                "x": 540,
                "y": 720
              }
            },
            {
              "id": "7e6d9c3c-126d-47e1-8bf1-ddeddd83dfba",
              "data": {
                "label": "Is peer or consensus context available"
              },
              "type": "condition",
              "position": {
                "x": 220,
                "y": 890
              }
            },
            {
              "id": "3792279d-f3e4-4014-83c8-1258050d9b9f",
              "data": {
                "label": "Test whether valuation quality and catalysts are already reflected in expectations",
                "actionType": "prompt",
                "actionTypeSource": "auto"
              },
              "type": "prompt",
              "position": {
                "x": -100,
                "y": 1060
              }
            },
            {
              "id": "a2b33ced-e6c2-4cdc-811f-411f1ae321f7",
              "data": {
                "label": "Proceed without peer expectation check"
              },
              "type": "continue",
              "position": {
                "x": 540,
                "y": 1060
              }
            },
            {
              "id": "a390a5b0-ead7-4c8e-9cfc-b25c4c31f380",
              "data": {
                "label": "Form initial hypothesis key investigation questions reasons not to continue screening decision and confidence",
                "actionType": "prompt",
                "actionTypeSource": "auto"
              },
              "type": "prompt",
              "position": {
                "x": 220,
                "y": 1230
              }
            },
            {
              "id": "c1ba2fa3-c4a3-4e75-9acc-bb8c1cf191d1",
              "data": {
                "label": "Task-environment lifecycle contract: only after every preceding policy step is complete, assemble the completed solution and send it as the sole final action to the task environment. Return exactly one abstract action JSON object shaped {\"targetAgentId\":\"905cdf83-5970-4598-8642-dea17852cc99\",\"operations\":[{\"type\":\"display\",\"payload\":FINAL_OUTPUT}]}. Replace FINAL_OUTPUT with exactly one JSON value matching this authoritative final output format: {\"type\":\"object\",\"required\":[\"Initial Hypothesis\",\"Questions Requiring Investigation\",\"Reasons NOT to Continue\",\"Screening Decision\",\"Confidence\"],\"properties\":{\"Initial Hypothesis\":{\"type\":\"string\"},\"Questions Requiring Investigation\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}},\"Reasons NOT to Continue\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}},\"Screening Decision\":{\"type\":\"string\",\"enum\":[\"Reject\",\"Watchlist\",\"Advance to full research\"],\"description\":\"Reject: do not invest and remove from active consideration. Watchlist: interesting but insufficient evidence; continue monitoring. Advance to full research: worth deeper investigation; begin detailed due diligence.\"},\"Confidence\":{\"type\":\"string\"}},\"additionalProperties\":false}. Do not put agent_latest_action, reward, environment_notes, Markdown, a code fence, or explanatory wrapper text inside the Display payload.",
                "actionType": "prompt",
                "actionTypeSource": "auto"
              },
              "type": "prompt",
              "position": {
                "x": 220,
                "y": 1570
              }
            },
            {
              "id": "081abc16-6418-4d3e-9b95-194e0e9ff3d3",
              "data": {
                "label": "Finish after final note is sent"
              },
              "type": "terminate_stage",
              "position": {
                "x": 312,
                "y": 1876
              }
            },
            {
              "id": "df380f46-b899-4172-9a9b-f70c7263def0",
              "data": {
                "label": "Action",
                "actionType": "prompt",
                "actionTypeSource": "auto"
              },
              "type": "prompt",
              "position": {
                "x": 220,
                "y": 1730
              }
            },
            {
              "id": "8d678036-c9d6-4f6f-9fc0-00cd7f471ebb",
              "data": {
                "label": "Action",
                "actionType": "prompt",
                "actionTypeSource": "auto"
              },
              "type": "prompt",
              "position": {
                "x": 220,
                "y": 1730
              }
            }
          ]
        },
        "freeText": "Analyst receives the company context, performs pragmatic screening, and returns one concise final note JSON with the required fields.\n\nTask-environment lifecycle contract: preserve the inferred policy and enforce the task handoff and terminal-output contract around it."
      },
      {
        "id": "starter-state-canvas-target",
        "name": "stage1TargetState",
        "graph": {
          "edges": [
            {
              "id": "starter-state-start-to-ingress",
              "source": "starter-state-start",
              "target": "starter-state-ingress-append",
              "sourceHandle": null,
              "targetHandle": null
            },
            {
              "id": "starter-state-ingress-to-summary-gate",
              "source": "starter-state-ingress-append",
              "target": "starter-state-summary-gate-memory-size",
              "sourceHandle": null,
              "targetHandle": null
            },
            {
              "id": "starter-state-summary-gate-true",
              "source": "starter-state-summary-gate",
              "target": "starter-state-update-summary",
              "sourceHandle": "true",
              "targetHandle": null
            },
            {
              "id": "starter-state-summary-to-clear",
              "source": "starter-state-update-summary",
              "target": "starter-state-clear-new-events",
              "sourceHandle": null,
              "targetHandle": null
            },
            {
              "id": "starter-state-summary-gate-memory-size-to-condition",
              "source": "starter-state-summary-gate-memory-size",
              "target": "starter-state-summary-gate",
              "sourceHandle": null,
              "targetHandle": null
            },
            {
              "id": "5815f2ee-1900-466c-b0c5-5cd45936861a",
              "source": "starter-state-summary-gate",
              "target": "a144e131-803f-4bcb-a229-060bb32f9c9d",
              "sourceHandle": "false",
              "targetHandle": null
            },
            {
              "id": "9dd15181-7d7e-4404-866a-b8ae160d8f1a",
              "source": "starter-state-clear-new-events",
              "target": "a144e131-803f-4bcb-a229-060bb32f9c9d",
              "sourceHandle": null,
              "targetHandle": null
            },
            {
              "id": "fb45ebf2-1775-4502-90f0-180b21da1192",
              "source": "a144e131-803f-4bcb-a229-060bb32f9c9d",
              "target": "b8925323-1f4f-4b72-9074-6c2763dd0801",
              "sourceHandle": "true",
              "targetHandle": null
            },
            {
              "id": "859429bf-5a3b-49f2-9041-7ba942f690e4",
              "source": "a144e131-803f-4bcb-a229-060bb32f9c9d",
              "target": "80547d08-8caf-4f67-8ae8-af62c01467ce",
              "sourceHandle": "false",
              "targetHandle": null
            }
          ],
          "nodes": [
            {
              "id": "starter-state-start",
              "data": {
                "label": "Observe target-side task input"
              },
              "type": "start",
              "position": {
                "x": 200,
                "y": 40
              }
            },
            {
              "id": "starter-state-ingress-append",
              "data": {
                "label": "Add agent_latest_observation and agent_latest_reward to new_events.",
                "actionType": "code",
                "actionTypeSource": "auto",
                "localInputFields": [
                  {
                    "name": "agent_latest_observation",
                    "type": "string"
                  },
                  {
                    "name": "agent_latest_reward",
                    "type": "string"
                  }
                ],
                "executableCodeOps": [
                  {
                    "kind": "append_list_item",
                    "field": "new_events",
                    "source": {
                      "kind": "latest_observation_and_reward_event"
                    }
                  }
                ]
              },
              "type": "code",
              "position": {
                "x": 200,
                "y": 190
              }
            },
            {
              "id": "starter-state-summary-gate",
              "data": {
                "label": "memory_over_limit is true"
              },
              "type": "condition",
              "position": {
                "x": 200,
                "y": 510
              }
            },
            {
              "id": "starter-state-update-summary",
              "data": {
                "label": "Update summary with a concise summary of summary plus new_events.",
                "actionType": "prompt",
                "actionTypeSource": "auto"
              },
              "type": "prompt",
              "position": {
                "x": 20,
                "y": 670
              }
            },
            {
              "id": "starter-state-clear-new-events",
              "data": {
                "label": "Set new_events to empty list.",
                "actionType": "code",
                "actionTypeSource": "auto",
                "executableCodeOps": [
                  {
                    "kind": "set_field",
                    "field": "new_events",
                    "source": {
                      "kind": "constant",
                      "value": []
                    }
                  }
                ]
              },
              "type": "code",
              "position": {
                "x": 20,
                "y": 820
              }
            },
            {
              "id": "starter-state-summary-gate-memory-size",
              "data": {
                "label": "Measure whether summary plus new_events exceeds 4000 characters.",
                "actionType": "code",
                "codeSource": "\nconst textLength = (value: unknown): number => {\n  if (value === null || value === undefined) return 0;\n  if (typeof value === \"string\") return value.length;\n  return JSON.stringify(value).length;\n};\n\nconst memoryLength =\n  textLength(ctx.state.summary) +\n  textLength(ctx.state.new_events);\n\nreturn {\n  setLocals: {\n    memory_over_limit: memoryLength > 4000,\n  },\n};\n",
                "codeLanguage": "typescript",
                "actionTypeSource": "auto",
                "codeLocalOutputFields": [
                  {
                    "name": "memory_over_limit",
                    "type": "boolean"
                  }
                ]
              },
              "type": "code",
              "position": {
                "x": 200,
                "y": 350
              }
            },
            {
              "id": "a144e131-803f-4bcb-a229-060bb32f9c9d",
              "data": {
                "label": "Has source delivered company task package"
              },
              "type": "condition",
              "position": {
                "x": 420,
                "y": 720
              }
            },
            {
              "id": "b8925323-1f4f-4b72-9074-6c2763dd0801",
              "data": {
                "label": "Await task package from source"
              },
              "type": "continue",
              "position": {
                "x": 740,
                "y": 890
              }
            },
            {
              "id": "80547d08-8caf-4f67-8ae8-af62c01467ce",
              "data": {
                "label": "Prepare state values for initial_hypothesis questions_requiring_investigation reasons_not_to_continue screening_decision and confidence",
                "actionType": "prompt",
                "actionTypeSource": "auto"
              },
              "type": "prompt",
              "position": {
                "x": 420,
                "y": 1230
              }
            }
          ]
        },
        "freeText": "Receives the delivered task package as observation, reads only the provided context fields, and stores the final note fields before returning them."
      },
      {
        "id": "starter-reward-canvas",
        "name": "Task environment final solution quality",
        "graph": {
          "edges": [
            {
              "id": "starter-reward-start-to-score",
              "source": "starter-reward-start",
              "target": "starter-reward-default-score",
              "sourceHandle": null,
              "targetHandle": null
            },
            {
              "id": "starter-reward-score-to-calculate",
              "source": "starter-reward-default-score",
              "target": "starter-reward-calculate",
              "sourceHandle": null,
              "targetHandle": null
            }
          ],
          "nodes": [
            {
              "id": "starter-reward-start",
              "data": {
                "label": "This is the task environment agent's quality evaluator. Treat final_output_format as the authoritative JSON contract for agent_latest_observation: {\"type\":\"object\",\"required\":[\"Initial Hypothesis\",\"Questions Requiring Investigation\",\"Reasons NOT to Continue\",\"Screening Decision\",\"Confidence\"],\"properties\":{\"Initial Hypothesis\":{\"type\":\"string\"},\"Questions Requiring Investigation\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}},\"Reasons NOT to Continue\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}},\"Screening Decision\":{\"type\":\"string\",\"enum\":[\"Reject\",\"Watchlist\",\"Advance to full research\"],\"description\":\"Reject: do not invest and remove from active consideration. Watchlist: interesting but insufficient evidence; continue monitoring. Advance to full research: worth deeper investigation; begin detailed due diligence.\"},\"Confidence\":{\"type\":\"string\"}},\"additionalProperties\":false} Return 0 when agent_latest_observation is empty, is not JSON, includes Markdown or wrapper text, or does not conform to that contract. For a conforming completed final solution, compare it against the selected task profile and return a scalar reward measuring solution quality. This scalar is the solution action's reward. Return 0 for opening profile delivery and for a missing, draft, or intermediate solution."
              },
              "type": "start",
              "position": {
                "x": 220,
                "y": 40
              }
            },
            {
              "id": "starter-reward-default-score",
              "data": {
                "label": "This is the task environment agent's quality evaluator. Treat final_output_format as the authoritative JSON contract for agent_latest_observation: {\"type\":\"object\",\"required\":[\"Initial Hypothesis\",\"Questions Requiring Investigation\",\"Reasons NOT to Continue\",\"Screening Decision\",\"Confidence\"],\"properties\":{\"Initial Hypothesis\":{\"type\":\"string\"},\"Questions Requiring Investigation\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}},\"Reasons NOT to Continue\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}},\"Screening Decision\":{\"type\":\"string\",\"enum\":[\"Reject\",\"Watchlist\",\"Advance to full research\"],\"description\":\"Reject: do not invest and remove from active consideration. Watchlist: interesting but insufficient evidence; continue monitoring. Advance to full research: worth deeper investigation; begin detailed due diligence.\"},\"Confidence\":{\"type\":\"string\"}},\"additionalProperties\":false} Return 0 when agent_latest_observation is empty, is not JSON, includes Markdown or wrapper text, or does not conform to that contract. For a conforming completed final solution, compare it against the selected task profile and return a scalar reward measuring solution quality. This scalar is the solution action's reward. Return 0 for opening profile delivery and for a missing, draft, or intermediate solution.\n\nIf the latest action, recipient objective, or relevant agent states are insufficient to score the recipient's reward:\n- Return 0 when the reward cannot be determined from the available state and action.\n\nOtherwise:\n- Parse agent_latest_observation as JSON and validate it against final_output_format.\n- Read the selected task profile and conforming completed final solution.\n- Evaluate correctness, completeness, relevance, and constraint satisfaction.\n- Return only the scalar quality reward for the solution action.\n\nResponse rule: return only the final solution quality reward\n\nReturn one abstract action object shaped `{ targetAgentId, operations: [{ type, payload, ... }] }`. Use the connected other agent as targetAgentId. operations is ordered and may combine display, agent_call, and tool_call. Do not execute the operations in this decision step; the following commit and matching outbound nodes do that. Continue, stage transition, and Terminate are canvas control flow, not operations.",
                "actionType": "prompt",
                "starterFallback": true,
                "actionTypeSource": "auto"
              },
              "type": "prompt",
              "position": {
                "x": 220,
                "y": 200
              }
            },
            {
              "id": "starter-reward-calculate",
              "data": {
                "label": "Calculate the scalar reward value.",
                "actionType": "code",
                "codeSource": "const normalizeText = (value: unknown): string => {\n  if (typeof value === \"string\") return value.replace(/\\s+/g, \" \").trim();\n  if (value === null || value === undefined) return \"\";\n  return String(value).replace(/\\s+/g, \" \").trim();\n};\n\nconst readRewardCandidate = (value: unknown): unknown => {\n  if (typeof value === \"number\") return value;\n  if (typeof value === \"string\") {\n    const trimmed = value.trim();\n    if (!trimmed) return \"\";\n    try {\n      return readRewardCandidate(JSON.parse(trimmed) as unknown);\n    } catch {\n      const match = trimmed.match(/-?\\d+(?:\\.\\d+)?/);\n      return match?.[0] ?? trimmed;\n    }\n  }\n  if (value && typeof value === \"object\" && !Array.isArray(value)) {\n    const record = value as Record<string, unknown>;\n    return readRewardCandidate(\n      record.reward ??\n        record.scalar_reward ??\n        record.value ??\n        record.score ??\n        \"\"\n    );\n  }\n  return \"\";\n};\n\nconst rawReward = readRewardCandidate(ctx.locals.carried_output);\nconst numericReward =\n  typeof rawReward === \"number\" ? rawReward : Number(normalizeText(rawReward));\nconst reward = Number.isFinite(numericReward) ? numericReward : 0;\n\nreturn {\n  setLocals: {\n    reward,\n    scalar_reward: reward,\n    carried_output: String(reward),\n  },\n};",
                "codeLanguage": "typescript",
                "codeTemplateId": "reward_scalar_calculation",
                "actionTypeSource": "auto",
                "localInputFields": [
                  {
                    "name": "carried_output",
                    "type": "number"
                  },
                  {
                    "name": "agent_latest_observation",
                    "type": "string"
                  }
                ],
                "codeLocalOutputFields": [
                  {
                    "name": "reward",
                    "type": "number"
                  },
                  {
                    "name": "scalar_reward",
                    "type": "number"
                  },
                  {
                    "name": "carried_output",
                    "type": "number"
                  }
                ]
              },
              "type": "code",
              "position": {
                "x": 220,
                "y": 360
              }
            }
          ]
        },
        "freeText": "The evaluator belongs to the task environment agent, which waits for the full workflow and scores only the final solution."
      }
    ]
  };
}

/** Model Setup -> Policy seed: chat-native screening decision flow. */
export function buildResearchPolicySeed(): CanvasDoc {
  return {
    "version": 2,
    "activeId": "research-screening-policy",
    "canvases": [
      {
        "id": "research-screening-policy",
        "name": "Screening",
        "graph": {
          "nodes": [
            {
              "id": "start",
              "type": "start",
              "position": {
                "x": 320,
                "y": 20
              },
              "data": {
                "label": "You are a disciplined equity research analyst running an initial idea-generation screening. You will be given the current conversation plus an already-updated screening state. Use the state to decide the next step and never re-ask for something the state already captures. Be concise, specific, and balanced. This is general research for idea generation, not investment advice."
              }
            },
            {
              "id": "emergency",
              "type": "condition",
              "position": {
                "x": 320,
                "y": 200
              },
              "data": {
                "label": "the emergency flag in the state is set to true"
              }
            },
            {
              "id": "urgent",
              "type": "action",
              "position": {
                "x": 60,
                "y": 360
              },
              "data": {
                "label": "Stop routine screening and tell the user that the urgent risk (for example possible bankruptcy, fraud, or a covenant breach) should be resolved or independently verified before continuing.",
                "actionType": "prompt"
              }
            },
            {
              "id": "orient",
              "type": "action",
              "position": {
                "x": 560,
                "y": 360
              },
              "data": {
                "label": "Orient: from the company profile and any context provided, restate in one or two sentences what the business does and what recently changed.",
                "actionType": "prompt"
              }
            },
            {
              "id": "value",
              "type": "action",
              "position": {
                "x": 560,
                "y": 540
              },
              "data": {
                "label": "Value: give a quick read on valuation and balance-sheet health versus the company's own history and its peers. Qualitative judgement is fine when hard data is thin.",
                "actionType": "prompt"
              }
            },
            {
              "id": "disclosures",
              "type": "condition",
              "position": {
                "x": 560,
                "y": 720
              },
              "data": {
                "label": "recent disclosures or filings are available for the company"
              }
            },
            {
              "id": "read_disclosures",
              "type": "action",
              "position": {
                "x": 320,
                "y": 880
              },
              "data": {
                "label": "Read the few most decision-relevant disclosure points and note what they change about the thesis.",
                "actionType": "prompt"
              }
            },
            {
              "id": "no_disclosures",
              "type": "continue",
              "position": {
                "x": 800,
                "y": 880
              },
              "data": {
                "label": "Proceed without a disclosure review."
              }
            },
            {
              "id": "expectations",
              "type": "condition",
              "position": {
                "x": 560,
                "y": 1040
              },
              "data": {
                "label": "peer or consensus context is available"
              }
            },
            {
              "id": "test_expectations",
              "type": "action",
              "position": {
                "x": 320,
                "y": 1200
              },
              "data": {
                "label": "Test whether the company's quality and catalysts are already reflected in peer or consensus expectations.",
                "actionType": "prompt"
              }
            },
            {
              "id": "no_expectations",
              "type": "continue",
              "position": {
                "x": 800,
                "y": 1200
              },
              "data": {
                "label": "Proceed without a peer expectation check."
              }
            },
            {
              "id": "decide",
              "type": "action",
              "position": {
                "x": 560,
                "y": 1360
              },
              "data": {
                "label": "Deliver the screening note with these fields: Initial Hypothesis; Questions Requiring Investigation; Reasons NOT to Continue; Screening Decision (Reject, Watchlist, or Advance to full research); and Confidence (low, medium, or high). Keep it concise and balanced.",
                "actionType": "prompt"
              }
            },
            {
              "id": "done",
              "type": "terminate_stage",
              "position": {
                "x": 600,
                "y": 1560
              },
              "data": {
                "label": "Finish after the screening note is delivered."
              }
            }
          ],
          "edges": [
            {
              "id": "e_start_emergency",
              "source": "start",
              "target": "emergency"
            },
            {
              "id": "e_emergency_urgent",
              "source": "emergency",
              "target": "urgent",
              "sourceHandle": "true",
              "label": "true"
            },
            {
              "id": "e_emergency_orient",
              "source": "emergency",
              "target": "orient",
              "sourceHandle": "false",
              "label": "false"
            },
            {
              "id": "e_urgent_done",
              "source": "urgent",
              "target": "done"
            },
            {
              "id": "e_orient_value",
              "source": "orient",
              "target": "value"
            },
            {
              "id": "e_value_disclosures",
              "source": "value",
              "target": "disclosures"
            },
            {
              "id": "e_disclosures_read",
              "source": "disclosures",
              "target": "read_disclosures",
              "sourceHandle": "true",
              "label": "true"
            },
            {
              "id": "e_disclosures_skip",
              "source": "disclosures",
              "target": "no_disclosures",
              "sourceHandle": "false",
              "label": "false"
            },
            {
              "id": "e_read_expectations",
              "source": "read_disclosures",
              "target": "expectations"
            },
            {
              "id": "e_skip_expectations",
              "source": "no_disclosures",
              "target": "expectations"
            },
            {
              "id": "e_expectations_test",
              "source": "expectations",
              "target": "test_expectations",
              "sourceHandle": "true",
              "label": "true"
            },
            {
              "id": "e_expectations_skip",
              "source": "expectations",
              "target": "no_expectations",
              "sourceHandle": "false",
              "label": "false"
            },
            {
              "id": "e_test_decide",
              "source": "test_expectations",
              "target": "decide"
            },
            {
              "id": "e_skip_decide",
              "source": "no_expectations",
              "target": "decide"
            },
            {
              "id": "e_decide_done",
              "source": "decide",
              "target": "done"
            }
          ]
        },
        "freeText": "Chat-native screening policy for the Research studio. Compiles to a conversational idea-generation screening prompt (no daemon action/commit nodes), so saving from Model Setup reproduces the intended behavior."
      }
    ]
  };
}

/** Model Setup -> State seed: chat-native state-extraction flow. */
export function buildResearchStateSeed(): CanvasDoc {
  return {
    "version": 2,
    "activeId": "research-screening-state",
    "canvases": [
      {
        "id": "research-screening-state",
        "name": "Main",
        "graph": {
          "nodes": [
            {
              "id": "start",
              "type": "start",
              "position": {
                "x": 360,
                "y": 40
              },
              "data": {
                "label": "You are a careful state-tracking assistant for an investment idea-generation screening tool. Update only the screening state using the previous known state plus the latest user message. Return exactly one JSON object and nothing else."
              }
            },
            {
              "id": "rules",
              "type": "action",
              "position": {
                "x": 320,
                "y": 300
              },
              "data": {
                "label": "State rules:\n- company: the name or ticker of the company being screened, or blank if not yet given.\n- sector: the company's sector or industry if stated or clearly implied, else blank.\n- initial_hypothesis: a one-sentence working thesis for why this could or could not be an idea worth pursuing; blank until enough is known.\n- questions_to_investigate: the open questions that most need answering before a decision; empty until there are any.\n- reasons_not_to_continue: concrete red flags or reasons to stop; empty if none.\n- screening_decision: one of \"Reject\", \"Watchlist\", or \"Advance to full research\"; blank until a decision is reached.\n- confidence: \"low\", \"medium\", or \"high\"; blank until decided.\n- emergency: true only if the user raises an urgent risk (for example imminent bankruptcy, fraud, or a covenant breach) that should halt normal screening, otherwise false.\n- summary: a short running summary of the screening so far; blank at the start.\n- turn_count: increment by 1 each user turn.\nOnly fill a field when the conversation supports it; otherwise leave it unchanged.",
                "actionType": "prompt"
              }
            }
          ],
          "edges": [
            {
              "id": "e_start_rules",
              "source": "start",
              "target": "rules"
            }
          ]
        },
        "freeText": "Chat-native state-tracking canvas for the Research studio. Compiles to the screening state-extraction prompt, so saving from Model Setup reproduces the intended behavior."
      }
    ]
  };
}
