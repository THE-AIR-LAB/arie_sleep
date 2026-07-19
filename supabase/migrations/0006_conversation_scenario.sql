-- Persist the patient scenario that drove a simulation run, so selecting a run in
-- the Simulation panel can repopulate the Patient scenario field with the exact
-- text that set it up. Null for normal (non-simulation) conversations.
alter table public.conversations
  add column if not exists scenario text;

comment on column public.conversations.scenario is
  'For simulation runs: the patient scenario text that drove the run, so selecting a run can repopulate the Patient scenario field. Null for normal chats.';
