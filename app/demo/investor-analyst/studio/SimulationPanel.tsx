"use client";

import React from "react";
export type { SimRun, SimRunControls, SimulationController } from "../../studio-components/SimulationPanel";
import {
  SimulationPanel as SharedSimulationPanel,
  type SimulationPanelConfig,
} from "../../studio-components/SimulationPanel";

const SCENARIO_EXAMPLES: { title: string; text: string }[] = [
  {
    title: "Cheap cyclical screen",
    text: "The task environment delivers an industrial-cyclical company trading near the low end of its historical EV/EBITDA range after a demand air-pocket. Screen it: form an initial hypothesis, list the questions worth investigating, note the reasons not to continue, and return a Reject / Watchlist / Advance decision with confidence.",
  },
  {
    title: "High-growth SaaS",
    text: "A fast-growing SaaS company is delivered with rich disclosures and a premium valuation versus peers. Screen whether the growth and margins justify the multiple, what the key questions are, and whether to advance to full research or watchlist it.",
  },
  {
    title: "Turnaround candidate",
    text: "A company mid-turnaround is delivered — falling revenue but a new management team and a cost program. Screen it: is the thesis that the market is over-discounting a credible recovery, or are there red flags that argue against continuing?",
  },
  {
    title: "Dividend compounder",
    text: "A stable, cash-generative consumer-staples business with a long dividend record is delivered near a modest premium. Screen whether the quality is already reflected in expectations and whether it merits deeper work.",
  },
  {
    title: "Balance-sheet risk",
    text: "A company with high leverage and near-term maturities is delivered. Screen the downside first: capital-structure risk, covenant headroom, and the reasons NOT to continue before any bullish case.",
  },
  {
    title: "Post-earnings gap",
    text: "A company that just gapped after earnings is delivered with the latest disclosure available. Screen whether the reaction created an opportunity or confirmed a deteriorating trend, and what to investigate next.",
  },
  {
    title: "Spin-off / special situation",
    text: "A recently spun-off business with a short standalone history is delivered. Screen the setup: is there a mispricing from forced selling and limited coverage, and what disclosures would confirm or kill the idea?",
  },
  {
    title: "Cash-rich small cap",
    text: "A small-cap trading below net cash with a slow-growth core business is delivered. Screen whether the balance sheet is a real margin of safety or a value trap, and decide Reject / Watchlist / Advance.",
  },
  {
    title: "Commodity producer",
    text: "A commodity producer is delivered near mid-cycle pricing with peer and consensus context. Screen whether valuation and catalysts are already priced in, and what the key swing factors are for the next leg.",
  },
  {
    title: "Sparse-context screen",
    text: "A company is delivered with only a basic profile and no recent disclosures or peer set. Screen it under uncertainty: state the hypothesis, the questions that matter most, and why limited information should push toward Watchlist rather than Advance.",
  },
];

const CONFIG: SimulationPanelConfig = {
  simulateUserPath: "/api/chat/research/simulate-user",
  summarizeScenarioPath: "/api/chat/research/summarize-scenario",
  examples: SCENARIO_EXAMPLES,
  improvisedLabel: "Improvised task",
  scenarioFieldLabel: "Screening scenario",
  examplesModalTitle: "Example screening scenarios",
  examplesModalSub: "Pick a scenario, then use it to fill the Screening scenario field.",
  simulatingUserStatus: (t, total) => `Turn ${t}/${total} · delivering the company…`,
  assistantReplyingStatus: (t, total) => `Turn ${t}/${total} · analyst screening…`,
  simulateUserError: "The task-environment step failed.",
  improvisedInfoBlurb: "Improvised task — no scenario was provided; the task environment improvised a company.",
  drawerSubhead: "Run a simulated screening task against your setup",
  scenarioPlaceholder:
    "e.g. Deliver a cheap industrial-cyclical company after a demand air-pocket and have the analyst screen it end-to-end. Leave blank to let the task environment improvise a company.",
  examplesButtonTitle: "Pick from example screening scenarios",
  helpPipelineLabel: "research analyst",
  helpImproviseProfile: "a generic company profile",
  simulatedActor: "task",
};

export function SimulationPanel(
  props: Omit<React.ComponentProps<typeof SharedSimulationPanel>, "config">
) {
  return <SharedSimulationPanel {...props} config={CONFIG} />;
}
