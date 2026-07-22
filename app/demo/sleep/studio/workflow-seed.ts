/* workflow-seed.ts — the Therapist studio's bottom "Workflow" drawer seed.
   Instead of a single Overall Workflow overview canvas, the therapist splits the
   sleep-care process into one canvas per workflow stage — Intake, Assess, Guide,
   and Follow up — each a detailed decision flow (start → conditions → prompt /
   tool actions). This mirrors how the Analyst studio drives its bottom drawer:
   each tab IS a stage rather than a box inside one overview.

   The entry (start) node of each canvas carries `workflowStageId` /
   `workflowStageName` so the live stage highlight still works — when a turn is
   derived to a stage, the drawer auto-switches to that stage's canvas and fires
   the node. */

import type { CanvasDoc } from "../../../components/canvas/Canvas";

/** Build the Therapist bottom-drawer seed: one canvas per workflow stage. */
export function buildSleepWorkflowSeed(_primaryAgent: string): CanvasDoc {
  return {
    version: 2,
    activeId: "intake",
    canvases: [
      /* ── Intake ─────────────────────────────────────────────────────── */
      {
        id: "intake",
        name: "Intake",
        freeText: "",
        graph: {
          nodes: [
            {
              id: "start",
              type: "start",
              position: { x: 340, y: 40 },
              data: {
                label:
                  "You are conducting a structured sleep intake for the patient. Ask one warm, focused question at a time, confirm each answer, and record it to the patient state. Do not give advice in this stage — your only goal is to capture a complete sleep history. Use the already-updated state to skip anything known and ask only for what is still missing.",
                workflowStageId: "intake",
                workflowStageName: "Intake",
              },
            },
            {
              id: "incomplete",
              type: "condition",
              position: { x: 340, y: 260 },
              data: {
                label:
                  "the structured sleep intake is still incomplete — one or more of the intake domains below is missing from the state",
              },
            },
            {
              id: "complaint",
              type: "action",
              position: { x: 600, y: 440 },
              data: {
                label:
                  "Capture the presenting complaint and its history: the main sleep problem in the patient's own words, when it began and what changed at onset, how it has progressed, and how many nights per week it occurs.",
                actionType: "prompt",
              },
            },
            {
              id: "schedule",
              type: "action",
              position: { x: 600, y: 650 },
              data: {
                label:
                  "Capture the sleep schedule and pattern: weeknight and weekend bedtimes, time to fall asleep, number and timing of night awakenings, ability to return to sleep, wake time and time out of bed, and daytime function — fatigue, focus, and napping.",
                actionType: "prompt",
              },
            },
            {
              id: "lifestyle",
              type: "action",
              position: { x: 600, y: 880 },
              data: {
                label:
                  "Capture lifestyle and environment: caffeine (type, amount, timing of last intake), alcohol on weekdays vs weekends, other evening intake, exercise, screens before bed, and the sleep environment — light, noise, temperature, and bed partner.",
                actionType: "prompt",
              },
            },
            {
              id: "medical",
              type: "action",
              position: { x: 600, y: 1090 },
              data: {
                label:
                  "Capture medical, psychiatric, and medication history: relevant conditions and current medications; mood and anxiety including middle-of-the-night rumination; and prior sleep medications tried and how the patient responded. Finally, ask the patient to rate sleep quality and sleep-related stress from 0–10.",
                actionType: "prompt",
              },
            },
            {
              id: "wrapup",
              type: "action",
              position: { x: 90, y: 440 },
              data: {
                label:
                  "All intake domains are captured. Summarize the full sleep history back to the patient in a few sentences, confirm it is accurate, and let them know you're ready to move on to assessment.",
                actionType: "prompt",
              },
            },
          ],
          edges: [
            { id: "e_s_i", source: "start", target: "incomplete" },
            { id: "e_i_complaint", source: "incomplete", target: "complaint", sourceHandle: "true", label: "true" },
            { id: "e_complaint_schedule", source: "complaint", target: "schedule" },
            { id: "e_schedule_lifestyle", source: "schedule", target: "lifestyle" },
            { id: "e_lifestyle_medical", source: "lifestyle", target: "medical" },
            { id: "e_i_wrapup", source: "incomplete", target: "wrapup", sourceHandle: "false", label: "false" },
          ],
        },
      },

      /* ── Assess ─────────────────────────────────────────────────────── */
      {
        id: "assess",
        name: "Assess",
        freeText: "",
        graph: {
          nodes: [
            {
              id: "start",
              type: "start",
              position: { x: 340, y: 40 },
              data: {
                label:
                  "You are assessing the sleep history you gathered. Identify the likely drivers of the sleep problem (onset, maintenance, schedule, habits) and screen for anything that needs a clinician. Use the already-updated state; do not re-ask what intake already captured.",
                workflowStageId: "assess",
                workflowStageName: "Assess",
              },
            },
            {
              id: "ready",
              type: "condition",
              position: { x: 340, y: 260 },
              data: {
                label:
                  "enough history is captured to form a working hypothesis about what is driving and maintaining the sleep problem",
              },
            },
            {
              id: "patterns",
              type: "action",
              position: { x: 600, y: 440 },
              data: {
                label:
                  "Identify the patterns behind the sleep problem: what triggered onset, and what now maintains it — conditioned arousal, an irregular schedule, caffeine or alcohol, napping, evening screens, or worry — and how the pieces fit together.",
                actionType: "prompt",
              },
            },
            {
              id: "redflags",
              type: "condition",
              position: { x: 600, y: 660 },
              data: {
                label:
                  "red flags for a medical sleep disorder are present (loud snoring, witnessed breathing pauses, gasping, heavy daytime sleepiness, or restless legs)",
              },
            },
            {
              id: "escalate",
              type: "action",
              position: { x: 860, y: 840 },
              data: {
                label:
                  "Flag the red flags and recommend evaluation by a clinician rather than continuing routine coaching.",
                actionType: "prompt",
              },
            },
            {
              id: "hypothesis",
              type: "action",
              position: { x: 560, y: 900 },
              data: {
                label:
                  "Share a plain-language working hypothesis with the sleeper and confirm it matches their experience before moving on to guidance.",
                actionType: "prompt",
              },
            },
            {
              id: "back",
              type: "action",
              position: { x: 90, y: 440 },
              data: {
                label:
                  "Not enough history yet — return to Intake and capture the missing domains before assessing.",
                actionType: "prompt",
              },
            },
          ],
          edges: [
            { id: "e_s_ready", source: "start", target: "ready" },
            { id: "e_ready_patterns", source: "ready", target: "patterns", sourceHandle: "true", label: "true" },
            { id: "e_patterns_redflags", source: "patterns", target: "redflags" },
            { id: "e_redflags_escalate", source: "redflags", target: "escalate", sourceHandle: "true", label: "true" },
            { id: "e_redflags_hypothesis", source: "redflags", target: "hypothesis", sourceHandle: "false", label: "false" },
            { id: "e_ready_back", source: "ready", target: "back", sourceHandle: "false", label: "false" },
          ],
        },
      },

      /* ── Guide ──────────────────────────────────────────────────────── */
      {
        id: "guide",
        name: "Guide",
        freeText: "",
        graph: {
          nodes: [
            {
              id: "start",
              type: "start",
              position: { x: 340, y: 40 },
              data: {
                label:
                  "You are offering CBT-I style guidance based on the agreed assessment. Give practical, specific recommendations the sleeper can act on, one change at a time. Use the already-updated state to tailor the advice.",
                workflowStageId: "guide",
                workflowStageName: "Guide",
              },
            },
            {
              id: "emergency",
              type: "condition",
              position: { x: 340, y: 260 },
              data: { label: "the emergency flag in the state is set to true" },
            },
            {
              id: "urgent",
              type: "action",
              position: { x: 90, y: 440 },
              data: {
                label:
                  "Advise the sleeper to seek urgent medical help and stop routine coaching.",
                actionType: "prompt",
              },
            },
            {
              id: "lookup",
              type: "tool_call",
              position: { x: 600, y: 440 },
              data: {
                label:
                  "lookup_guideline(topic) — retrieve the matching CBT-I guideline for the drivers identified in Assess.",
                sourceType: "http",
              },
            },
            {
              id: "recommend",
              type: "action",
              position: { x: 600, y: 640 },
              data: {
                label:
                  "Offer the matched CBT-I recommendations as a short numbered list, tailored to this sleeper. Start with the highest-leverage change — usually a fixed wake time — and explain why.",
                actionType: "prompt",
              },
            },
            {
              id: "accepted",
              type: "condition",
              position: { x: 600, y: 860 },
              data: { label: "the sleeper accepts the plan" },
            },
            {
              id: "revise",
              type: "action",
              position: { x: 860, y: 1040 },
              data: {
                label:
                  "Adjust the recommendation to fit the sleeper's constraints and re-offer it.",
                actionType: "prompt",
              },
            },
            {
              id: "commit",
              type: "action",
              position: { x: 560, y: 1060 },
              data: {
                label:
                  "Plan accepted — confirm the first change, agree on a check-in, and move to Follow up.",
                actionType: "prompt",
              },
            },
          ],
          edges: [
            { id: "e_s_em", source: "start", target: "emergency" },
            { id: "e_em_urgent", source: "emergency", target: "urgent", sourceHandle: "true", label: "true" },
            { id: "e_em_lookup", source: "emergency", target: "lookup", sourceHandle: "false", label: "false" },
            { id: "e_lookup_recommend", source: "lookup", target: "recommend", sourceHandle: "success", label: "success" },
            { id: "e_recommend_accepted", source: "recommend", target: "accepted" },
            { id: "e_accepted_commit", source: "accepted", target: "commit", sourceHandle: "true", label: "true" },
            { id: "e_accepted_revise", source: "accepted", target: "revise", sourceHandle: "false", label: "false" },
            { id: "e_revise_accepted", source: "revise", target: "accepted", label: "re-offer" },
          ],
        },
      },

      /* ── Follow up ──────────────────────────────────────────────────── */
      {
        id: "followup",
        name: "Follow up",
        freeText: "",
        graph: {
          nodes: [
            {
              id: "start",
              type: "start",
              position: { x: 340, y: 40 },
              data: {
                label:
                  "You are following up on the agreed plan. Check what the sleeper actually did, what changed, and whether to hold the plan, adjust it, or return to Assess. Use the already-updated state to compare against the last check-in.",
                workflowStageId: "followup",
                workflowStageName: "Follow up",
              },
            },
            {
              id: "log",
              type: "tool_call",
              position: { x: 340, y: 260 },
              data: {
                label:
                  "save_sleep_log(entry) — record last night's sleep quality and how closely the sleeper followed the plan.",
                sourceType: "http",
              },
            },
            {
              id: "working",
              type: "condition",
              position: { x: 340, y: 460 },
              data: {
                label:
                  "the plan is working — the sleeper's sleep is stable or improving and adherence is reasonable",
              },
            },
            {
              id: "affirm",
              type: "action",
              position: { x: 600, y: 640 },
              data: {
                label:
                  "Affirm the progress, reinforce the habit that helped, keep the current plan, and schedule the next check-in.",
                actionType: "prompt",
              },
            },
            {
              id: "adjust",
              type: "action",
              position: { x: 90, y: 640 },
              data: {
                label:
                  "The plan isn't working yet — adjust one variable and re-test, or return to Assess to re-evaluate the drivers.",
                actionType: "prompt",
              },
            },
          ],
          edges: [
            { id: "e_s_log", source: "start", target: "log" },
            { id: "e_log_working", source: "log", target: "working", sourceHandle: "success", label: "success" },
            { id: "e_working_affirm", source: "working", target: "affirm", sourceHandle: "true", label: "true" },
            { id: "e_working_adjust", source: "working", target: "adjust", sourceHandle: "false", label: "false" },
          ],
        },
      },
    ],
  };
}
