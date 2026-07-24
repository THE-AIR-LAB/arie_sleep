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
  productName: "Research",
  studioPath: "/demo/research/studio",
  assistantMark: "logo",
  avatarSrc: "/analyst.png",
  emptyStateHref: "/demo/research/studio",
  emptyStateTitle: "Research",
  emptyStateBody: (
    <>
      Research runs the investment idea-generation screening: it reviews a
      company profile, values the business, reads disclosures and peer
      expectations, and returns a structured screening note with a
      recommendation. General research, not investment advice.
    </>
  ),
  emptyStatePrimaryAgent: "Primary agent: Research analyst",
  buildWorkflowSeed: buildResearchWorkflowSeed,
  subjectNoun: "user",
  apiTopic: "research",
  suggestions: SUGGESTIONS,
  actionChips: ACTION_CHIPS,
  deriveWorkflowStage,
  SetupBar,
  turnExtractedStateKeys,
  SimulationPanel,
};

export default createStudioPage(studioChatConfig);
