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
  setupEndpoint: "/api/admin/setup/research",
  productName: "Market Researcher",
  studioPath: "/demo/research/studio",
  assistantNoun: "analyst",
  coachNoun: "client",
  subjectNoun: "user",
  // Mirror the DB canvases 1:1 instead of the default sleep Intake/Assess seeds.
  policySeedDoc: buildResearchPolicySeed(),
  stateSeedDoc: buildResearchStateSeed(),
};

const { SetupBar, useSleepSetup, Page } = createSetupStudio(config, sleepData);

export { turnExtractedStateKeys, useSleepSetup, SetupBar };
export default Page;
