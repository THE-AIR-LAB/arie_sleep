-- Seed the Research demo (investment idea-generation screening) into the
-- DEMO_1_LONGEVITY Supabase project (doyyvsfnrcjqtwnvatwa).
--
-- Research reuses the analyst_inputs table, isolated by its own endpoint row
-- (/demo/research/input). The pipeline resolves it from the /demo/research
-- referer (see packages/orchestration-runtime/src/chat-route.ts →
-- RESEARCH_SETUP_SOURCE) and compiles nothing extra: the authored
-- policy_prompt + state_update_prompt below drive the chat; the policy/state
-- canvases (copied verbatim from the general-orchestration-daemon draft) are
-- attached for the Model Setup display + trace animation.
--
-- Safe to re-run: it deletes any prior research seed first.
--
-- Run in the Supabase SQL editor (or: supabase db execute < this file), using a
-- role that can write these tables (service role / SQL editor).

begin;

-- 1. Remove any prior research seed so this file is idempotent.
delete from policy_canvases
where setup_table = 'analyst_inputs'
  and setup_id in (select id from analyst_inputs where endpoint = '/demo/research/input');
delete from state_policy_canvases
where setup_table = 'analyst_inputs'
  and setup_id in (select id from analyst_inputs where endpoint = '/demo/research/input');
delete from analyst_inputs where endpoint = '/demo/research/input';

-- 2. Insert the research config row + its policy/state canvases.
with cfg as (
  insert into analyst_inputs (expert_id, config_name, endpoint, state_schema, state_update_prompt, policy_prompt)
  values (
    '8dd445bc-7985-5eb8-a314-fcef3eb7c550',  -- same expert_id as the analyst config row
    'research configuration',
    '/demo/research/input',
    '[
      {"field_name":"company","type":"string","initial_value":"null"},
      {"field_name":"sector","type":"string","initial_value":"null"},
      {"field_name":"initial_hypothesis","type":"string","initial_value":"null"},
      {"field_name":"questions_to_investigate","type":"string[]","initial_value":"[]"},
      {"field_name":"reasons_not_to_continue","type":"string[]","initial_value":"[]"},
      {"field_name":"screening_decision","type":"string","initial_value":"null"},
      {"field_name":"confidence","type":"string","initial_value":"null"},
      {"field_name":"emergency","type":"boolean","initial_value":"false"},
      {"field_name":"summary","type":"string","initial_value":"null"},
      {"field_name":"turn_count","type":"integer","initial_value":"0"}
    ]'::jsonb,
    $sup$You are a careful state-tracking assistant for an investment idea-generation screening tool.
Update only the screening state using the previous known state plus the latest user message.
Return exactly one JSON object and nothing else.

State rules:
- company: the name or ticker of the company being screened, or blank if not yet given.
- sector: the company's sector or industry if stated or clearly implied, else blank.
- initial_hypothesis: a one-sentence working thesis for why this could or could not be an idea worth pursuing; blank until enough is known.
- questions_to_investigate: the open questions that most need answering before a decision; [] if none yet.
- reasons_not_to_continue: concrete red flags or reasons to stop; [] if none.
- screening_decision: one of "Reject", "Watchlist", or "Advance to full research"; blank until the analyst reaches a decision.
- confidence: "low", "medium", or "high"; blank until decided.
- emergency: "true" only if the user raises an urgent risk (e.g. imminent bankruptcy, fraud, covenant breach) that should halt normal screening, else "false".
- summary: a short running summary of the screening so far; blank at the start.
- turn_count: increment by 1 each user turn.

Only fill a field when the conversation supports it; otherwise leave it unchanged. Return exactly a JSON object with these keys and nothing else.$sup$,
    $pp$You are a disciplined equity research analyst running an initial idea-generation screening. You will be given the current conversation plus an already-updated screening state. Use the state to decide the next step and never re-ask for something the state already captures.

Screen one company at a time and reach a clear recommendation. Work pragmatically through this flow, one focused step per turn:
1. Orient: from the company profile and any context provided, restate what the business does and what recently changed.
2. Value: give a quick read on valuation and balance-sheet health versus the company's own history and peers (qualitative is fine when data is thin).
3. Disclosures: if recent disclosures or filings are available, note the few most decision-relevant points; if not, say so and proceed.
4. Expectations: if peer or consensus context is available, test whether the quality and catalysts are already priced in.
5. Decide: form an initial hypothesis, list the key questions requiring investigation and the reasons NOT to continue, then give a screening decision (Reject, Watchlist, or Advance to full research) with a confidence level.

Style: be concise, specific, and balanced. Ask at most one clarifying question when a genuinely blocking fact is missing; otherwise make reasonable assumptions and keep moving. This is general research for idea generation, not investment advice.

If the emergency flag is set, stop routine screening and tell the user the urgent risk should be resolved or verified first.

When you have enough to decide, present a short screening note with these fields: Initial Hypothesis, Questions Requiring Investigation, Reasons NOT to Continue, Screening Decision (Reject / Watchlist / Advance to full research), and Confidence.$pp$
  )
  returning id
),
pol as (
  insert into policy_canvases (setup_table, setup_id, canvas_id, name, sort_order, canvas)
  select 'analyst_inputs', cfg.id, canvas->>'id', canvas->>'name', 0, canvas
  from cfg
  cross join lateral (
    select canvas
    from general_orchestration_daemon_drafts d
    cross join lateral jsonb_array_elements(d.agent_connections) connection
    cross join lateral jsonb_array_elements(connection->'target_policy_canvases'->'canvases') canvas
    where d.id = 'c2b2f46c-3c3e-451a-a4cb-1b8acaf86115'
      and connection->>'id' = '93c45cc3-f6b8-4e76-8831-b9632ffdfb03'
      and canvas->>'id' = 'starter-policy-canvas'
  ) pc
  returning setup_id
),
st as (
  insert into state_policy_canvases (setup_table, setup_id, canvas_id, name, sort_order, canvas)
  select 'analyst_inputs', cfg.id, 'starter-state-canvas-target', canvas->>'name', 0,
         jsonb_set(canvas, '{id}', '"starter-state-canvas-target"')
  from cfg
  cross join lateral (
    select canvas
    from general_orchestration_daemon_drafts d
    cross join lateral jsonb_array_elements(d.agent_connections) connection
    cross join lateral jsonb_array_elements(connection->'target_state_policy_canvases'->'canvases') canvas
    where d.id = 'c2b2f46c-3c3e-451a-a4cb-1b8acaf86115'
      and connection->>'id' = '93c45cc3-f6b8-4e76-8831-b9632ffdfb03'
      and canvas->>'id' = 'starter-state-canvas'
  ) sc
  returning setup_id
)
select (select id from cfg)       as config_id,
       (select count(*) from pol) as policy_canvas_rows,
       (select count(*) from st)  as state_canvas_rows;

commit;
