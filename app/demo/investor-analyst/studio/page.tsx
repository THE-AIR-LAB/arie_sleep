"use client";

import "./ra-theme.css";
import { SetupBar, turnExtractedStateKeys } from "./config/page";
import { SimulationPanel } from "./SimulationPanel";
import { ACTION_CHIPS, SUGGESTIONS } from "./sleep-data";
import { buildResearchWorkflowSeed } from "./workflow-seed";
import { createStudioPage } from "../../studio-components/chat/StudioApp";
import type { StudioChatConfig } from "../../studio-components/chat/types";
import type { Turn } from "../../../components/trace/TraceView";

/** Derive the active workflow stage for a completed turn.
 *  The mirrored DB workflow is a single idea-generation screening stage; the
 *  overview canvas carries that `workflowStageId`, so any completed turn lights
 *  it up. */
function deriveWorkflowStage(turn: Turn | null | undefined): string | null {
  if (!turn) return null;
  return "idea-generation-screening";
}

const studioChatConfig: StudioChatConfig = {
  productName: "Investment Analyst",
  studioPath: "/demo/investor-analyst/studio",
  assistantMark: "logo",
  avatarSrc: "/market_researcher.png",
  emptyStateHref: "/demo/investor-analyst/studio",
  emptyStateTitle: "Investment Analyst",
  emptyStateBody: (
    <>
      Investment Analyst runs the investment idea-generation screening: it reviews a
      company profile, values the business, reads disclosures and peer
      expectations, and returns a structured screening note with a
      recommendation. General research, not investment advice.
    </>
  ),
  emptyStatePrimaryAgent: "Primary agent: Investment Analyst",
  buildWorkflowSeed: buildResearchWorkflowSeed,
  subjectNoun: "user",
  apiTopic: "research",
  // Hydrate/save the bottom workflow drawer from the agent-first store, which
  // returns only the workflow overview — the agent-owned state/policy/reward
  // canvases live in the side drawer's agent tier, so they no longer duplicate
  // as tabs here. (apiTopic stays "research" for chat/conversations.)
  workflowEndpoint: "/api/investor-analyst/canvases",
  suggestions: SUGGESTIONS,
  actionChips: ACTION_CHIPS,
  deriveWorkflowStage,
  SetupBar,
  turnExtractedStateKeys,
  SimulationPanel,
};

export default createStudioPage(studioChatConfig);
