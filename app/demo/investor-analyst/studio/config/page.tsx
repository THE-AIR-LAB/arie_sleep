"use client";

import "../ra-theme.css";
import * as sleepData from "../sleep-data";
import { buildResearchPolicySeed, buildResearchStateSeed } from "../workflow-seed";
import {
  createSetupStudio,
  turnExtractedStateKeys,
  type StudioSetupConfig,
} from "../../../studio-components/config/SetupStudio";

const config: StudioSetupConfig = {
  // Load/save the Setup pane's Policy + State canvases straight from the new
  // agent-first store (agent_canvases) for the investor-analyst reference draft,
  // instead of the legacy /api/admin/setup/research (*_canvases) tables.
  setupEndpoint: "/api/investor-analyst/canvases",
  productName: "Investment Analyst",
  studioPath: "/demo/investor-analyst/studio",
  assistantNoun: "analyst",
  coachNoun: "client",
  subjectNoun: "user",
  // Mirror the DB canvases 1:1 instead of the default sleep Intake/Assess seeds.
  policySeedDoc: buildResearchPolicySeed(),
  stateSeedDoc: buildResearchStateSeed(),
};

// Keep the generated config page + helpers, but override the drawer's Model
// Setup pane with the agent-tier editor: an agent selector (source task
// generator / target analyst) over the real editable Canvas, reading and
// saving the agent-first store via /api/investor-analyst/canvases.
const { useSleepSetup, Page } = createSetupStudio(config, sleepData);

export { turnExtractedStateKeys, useSleepSetup };
export { default as SetupBar } from "../AgentCanvasSetupBar";
export default Page;
