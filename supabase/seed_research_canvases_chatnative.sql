-- Swap the Research Model Setup canvases to chat-native versions so saving from
-- the studio compiles to a conversational screening policy (not daemon action JSON).
-- Stores policy_prompt/state_update_prompt = the compiled output of those canvases,
-- so a fresh load matches what a Save produces. Idempotent: safe to re-run.

begin;

update analyst_inputs
set policy_prompt = $pp$## Policy Flowchart (auto-generated)

### Canvas: Screening

General-purpose prompt:
You are a disciplined equity research analyst running an initial idea-generation screening. You will be given the current conversation plus an already-updated screening state. Use the state to decide the next step and never re-ask for something the state already captures. Be concise, specific, and balanced. This is general research for idea generation, not investment advice.

Flow:
IF the emergency flag in the state is set to true
  TRUE -> PROMPT Stop routine screening and tell the user that the urgent risk (for example possible bankruptcy, fraud, or a covenant breach) should be resolved or independently verified before continuing.
  FALSE -> PROMPT Orient: from the company profile and any context provided, restate in one or two sentences what the business does and what recently changed.

  TERMINATE STAGE: Finish after the screening note is delivered.. The current action is kept, and the next turn is controlled by the next stage canvas.

  PROMPT Value: give a quick read on valuation and balance-sheet health versus the company's own history and its peers. Qualitative judgement is fine when hard data is thin.

  IF recent disclosures or filings are available for the company
    TRUE -> PROMPT Read the few most decision-relevant disclosure points and note what they change about the thesis.
    FALSE -> CONTINUE STAGE: Proceed without a disclosure review.. The current action is kept, and the next turn stays in this stage canvas.

    IF peer or consensus context is available
      TRUE -> PROMPT Test whether the company's quality and catalysts are already reflected in peer or consensus expectations.
      FALSE -> CONTINUE STAGE: Proceed without a peer expectation check.. The current action is kept, and the next turn stays in this stage canvas.

      PROMPT Deliver the screening note with these fields: Initial Hypothesis; Questions Requiring Investigation; Reasons NOT to Continue; Screening Decision (Reject, Watchlist, or Advance to full research); and Confidence (low, medium, or high). Keep it concise and balanced.

      TERMINATE STAGE: Finish after the screening note is delivered.. The current action is kept, and the next turn is controlled by the next stage canvas.

## Additional policy notes

### Screening
Chat-native screening policy for the Research studio. Compiles to a conversational idea-generation screening prompt (no daemon action/commit nodes), so saving from Model Setup reproduces the intended behavior.$pp$,
    state_update_prompt = $sup$## Policy Flowchart (auto-generated)

### Canvas: Main

General-purpose prompt:
You are a careful state-tracking assistant for an investment idea-generation screening tool. Update only the screening state using the previous known state plus the latest user message. Return exactly one JSON object and nothing else.

Return exactly a JSON object of this form and nothing else:
{
  "company": string,
  "sector": string,
  "initial_hypothesis": string,
  "questions_to_investigate": [],
  "reasons_not_to_continue": [],
  "screening_decision": string,
  "confidence": string,
  "emergency": false,
  "summary": string,
  "turn_count": 0
}

Flow:
PROMPT State rules:
- company: the name or ticker of the company being screened, or blank if not yet given.
- sector: the company's sector or industry if stated or clearly implied, else blank.
- initial_hypothesis: a one-sentence working thesis for why this could or could not be an idea worth pursuing; blank until enough is known.
- questions_to_investigate: the open questions that most need answering before a decision; empty until there are any.
- reasons_not_to_continue: concrete red flags or reasons to stop; empty if none.
- screening_decision: one of "Reject", "Watchlist", or "Advance to full research"; blank until a decision is reached.
- confidence: "low", "medium", or "high"; blank until decided.
- emergency: true only if the user raises an urgent risk (for example imminent bankruptcy, fraud, or a covenant breach) that should halt normal screening, otherwise false.
- summary: a short running summary of the screening so far; blank at the start.
- turn_count: increment by 1 each user turn.
Only fill a field when the conversation supports it; otherwise leave it unchanged.

## Additional policy notes

### Main
Chat-native state-tracking canvas for the Research studio. Compiles to the screening state-extraction prompt, so saving from Model Setup reproduces the intended behavior.$sup$,
    updated_at = now()
where endpoint = '/demo/research/input';

delete from policy_canvases
where setup_table = 'analyst_inputs'
  and setup_id in (select id from analyst_inputs where endpoint = '/demo/research/input');
insert into policy_canvases (setup_table, setup_id, canvas_id, name, sort_order, canvas)
select 'analyst_inputs', ai.id, 'research-screening-policy', 'Screening', 0, $polc${"id": "research-screening-policy", "name": "Screening", "freeText": "Chat-native screening policy for the Research studio. Compiles to a conversational idea-generation screening prompt (no daemon action/commit nodes), so saving from Model Setup reproduces the intended behavior.", "graph": {"nodes": [{"id": "start", "type": "start", "position": {"x": 320, "y": 20}, "data": {"label": "You are a disciplined equity research analyst running an initial idea-generation screening. You will be given the current conversation plus an already-updated screening state. Use the state to decide the next step and never re-ask for something the state already captures. Be concise, specific, and balanced. This is general research for idea generation, not investment advice."}}, {"id": "emergency", "type": "condition", "position": {"x": 320, "y": 200}, "data": {"label": "the emergency flag in the state is set to true"}}, {"id": "urgent", "type": "action", "position": {"x": 60, "y": 360}, "data": {"label": "Stop routine screening and tell the user that the urgent risk (for example possible bankruptcy, fraud, or a covenant breach) should be resolved or independently verified before continuing.", "actionType": "prompt"}}, {"id": "orient", "type": "action", "position": {"x": 560, "y": 360}, "data": {"label": "Orient: from the company profile and any context provided, restate in one or two sentences what the business does and what recently changed.", "actionType": "prompt"}}, {"id": "value", "type": "action", "position": {"x": 560, "y": 540}, "data": {"label": "Value: give a quick read on valuation and balance-sheet health versus the company's own history and its peers. Qualitative judgement is fine when hard data is thin.", "actionType": "prompt"}}, {"id": "disclosures", "type": "condition", "position": {"x": 560, "y": 720}, "data": {"label": "recent disclosures or filings are available for the company"}}, {"id": "read_disclosures", "type": "action", "position": {"x": 320, "y": 880}, "data": {"label": "Read the few most decision-relevant disclosure points and note what they change about the thesis.", "actionType": "prompt"}}, {"id": "no_disclosures", "type": "continue", "position": {"x": 800, "y": 880}, "data": {"label": "Proceed without a disclosure review."}}, {"id": "expectations", "type": "condition", "position": {"x": 560, "y": 1040}, "data": {"label": "peer or consensus context is available"}}, {"id": "test_expectations", "type": "action", "position": {"x": 320, "y": 1200}, "data": {"label": "Test whether the company's quality and catalysts are already reflected in peer or consensus expectations.", "actionType": "prompt"}}, {"id": "no_expectations", "type": "continue", "position": {"x": 800, "y": 1200}, "data": {"label": "Proceed without a peer expectation check."}}, {"id": "decide", "type": "action", "position": {"x": 560, "y": 1360}, "data": {"label": "Deliver the screening note with these fields: Initial Hypothesis; Questions Requiring Investigation; Reasons NOT to Continue; Screening Decision (Reject, Watchlist, or Advance to full research); and Confidence (low, medium, or high). Keep it concise and balanced.", "actionType": "prompt"}}, {"id": "done", "type": "terminate_stage", "position": {"x": 600, "y": 1560}, "data": {"label": "Finish after the screening note is delivered."}}], "edges": [{"id": "e_start_emergency", "source": "start", "target": "emergency"}, {"id": "e_emergency_urgent", "source": "emergency", "target": "urgent", "sourceHandle": "true", "label": "true"}, {"id": "e_emergency_orient", "source": "emergency", "target": "orient", "sourceHandle": "false", "label": "false"}, {"id": "e_urgent_done", "source": "urgent", "target": "done"}, {"id": "e_orient_value", "source": "orient", "target": "value"}, {"id": "e_value_disclosures", "source": "value", "target": "disclosures"}, {"id": "e_disclosures_read", "source": "disclosures", "target": "read_disclosures", "sourceHandle": "true", "label": "true"}, {"id": "e_disclosures_skip", "source": "disclosures", "target": "no_disclosures", "sourceHandle": "false", "label": "false"}, {"id": "e_read_expectations", "source": "read_disclosures", "target": "expectations"}, {"id": "e_skip_expectations", "source": "no_disclosures", "target": "expectations"}, {"id": "e_expectations_test", "source": "expectations", "target": "test_expectations", "sourceHandle": "true", "label": "true"}, {"id": "e_expectations_skip", "source": "expectations", "target": "no_expectations", "sourceHandle": "false", "label": "false"}, {"id": "e_test_decide", "source": "test_expectations", "target": "decide"}, {"id": "e_skip_decide", "source": "no_expectations", "target": "decide"}, {"id": "e_decide_done", "source": "decide", "target": "done"}]}}$polc$::jsonb
from analyst_inputs ai where ai.endpoint = '/demo/research/input';

delete from state_policy_canvases
where setup_table = 'analyst_inputs'
  and setup_id in (select id from analyst_inputs where endpoint = '/demo/research/input');
insert into state_policy_canvases (setup_table, setup_id, canvas_id, name, sort_order, canvas)
select 'analyst_inputs', ai.id, 'research-screening-state', 'Main', 0, $stc${"id": "research-screening-state", "name": "Main", "freeText": "Chat-native state-tracking canvas for the Research studio. Compiles to the screening state-extraction prompt, so saving from Model Setup reproduces the intended behavior.", "graph": {"nodes": [{"id": "start", "type": "start", "position": {"x": 360, "y": 40}, "data": {"label": "You are a careful state-tracking assistant for an investment idea-generation screening tool. Update only the screening state using the previous known state plus the latest user message. Return exactly one JSON object and nothing else."}}, {"id": "rules", "type": "action", "position": {"x": 320, "y": 300}, "data": {"label": "State rules:\n- company: the name or ticker of the company being screened, or blank if not yet given.\n- sector: the company's sector or industry if stated or clearly implied, else blank.\n- initial_hypothesis: a one-sentence working thesis for why this could or could not be an idea worth pursuing; blank until enough is known.\n- questions_to_investigate: the open questions that most need answering before a decision; empty until there are any.\n- reasons_not_to_continue: concrete red flags or reasons to stop; empty if none.\n- screening_decision: one of \"Reject\", \"Watchlist\", or \"Advance to full research\"; blank until a decision is reached.\n- confidence: \"low\", \"medium\", or \"high\"; blank until decided.\n- emergency: true only if the user raises an urgent risk (for example imminent bankruptcy, fraud, or a covenant breach) that should halt normal screening, otherwise false.\n- summary: a short running summary of the screening so far; blank at the start.\n- turn_count: increment by 1 each user turn.\nOnly fill a field when the conversation supports it; otherwise leave it unchanged.", "actionType": "prompt"}}], "edges": [{"id": "e_start_rules", "source": "start", "target": "rules"}]}}$stc$::jsonb
from analyst_inputs ai where ai.endpoint = '/demo/research/input';

commit;

select
  (select length(policy_prompt) from analyst_inputs where endpoint='/demo/research/input') as policy_len,
  (select length(state_update_prompt) from analyst_inputs where endpoint='/demo/research/input') as state_len,
  (select count(*) from policy_canvases where setup_table='analyst_inputs'
     and setup_id in (select id from analyst_inputs where endpoint='/demo/research/input')) as policy_rows,
  (select count(*) from state_policy_canvases where setup_table='analyst_inputs'
     and setup_id in (select id from analyst_inputs where endpoint='/demo/research/input')) as state_rows;
