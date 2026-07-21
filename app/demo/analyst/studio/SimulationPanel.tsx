"use client";

import React from "react";
export type { SimRun, SimRunControls, SimulationController } from "../../studio-components/SimulationPanel";
import {
  SimulationPanel as SharedSimulationPanel,
  type SimulationPanelConfig,
} from "../../studio-components/SimulationPanel";

const SCENARIO_EXAMPLES: { title: string; text: string }[] = [
  {
    title: "NVDA after earnings",
    text: "A retail investor wants a read on NVIDIA (NVDA) after its latest earnings — the stock's move, valuation versus peers, and whether near-term momentum looks stretched over the next week or two.",
  },
  {
    title: "S&P 500 near highs",
    text: "Someone with a 401(k) is nervous about the S&P 500 near all-time highs and wants a clear read on the index trend, market breadth, and the main equity risks (earnings, multiples) over the next month.",
  },
  {
    title: "Nasdaq vs. S&P relative strength",
    text: "A user has heard big tech is underperforming and wants to know whether the Nasdaq is lagging the S&P 500, how far the gap has opened, and what that says about equity leadership.",
  },
  {
    title: "Russell 2000 / small caps",
    text: "An investor asks how the Russell 2000 is doing versus large caps — recent performance, valuation, and whether small-cap equities look like they are catching up or still lagging.",
  },
  {
    title: "Mega-cap leadership",
    text: "A user wants to know how concentrated the S&P 500 has become in the largest mega-cap names, how those stocks have driven index returns, and what that concentration means for equity risk.",
  },
  {
    title: "Sector rotation in equities",
    text: "Someone asks which equity sectors have led and lagged lately (tech, financials, energy, healthcare), whether a rotation is underway, and what that implies for a diversified stock portfolio.",
  },
  {
    title: "Dividend equity check",
    text: "A retiree wants a read on a large dividend-paying stock like Coca-Cola (KO): current price action, valuation, dividend yield context, and whether the recent move signals anything about stability.",
  },
  {
    title: "Comparing two stocks",
    text: "A user wants to compare Apple (AAPL) and Microsoft (MSFT) on recent equity performance, valuation, and momentum to understand which has looked stronger lately.",
  },
  {
    title: "Earnings season pulse",
    text: "During earnings season, an investor asks how the S&P 500 and major sectors are reacting to reports so far — beat/miss tone, guidance trends, and what that means for near-term equity direction.",
  },
  {
    title: "Equity sell-off day",
    text: "During a sharp stock-market sell-off, an anxious investor asks how bad the move is for the S&P 500 and Nasdaq versus recent history, which sectors are hit hardest, and how to put the drawdown in context.",
  },
];

const CONFIG: SimulationPanelConfig = {
  simulateUserPath: "/api/chat/analyst/simulate-user",
  summarizeScenarioPath: "/api/chat/analyst/summarize-scenario",
  examples: SCENARIO_EXAMPLES,
  improvisedLabel: "Improvised user",
  scenarioFieldLabel: "Market scenario",
  examplesModalTitle: "Example equity market scenarios",
  examplesModalSub: "Pick a scenario, then use it to fill the Market scenario field.",
  simulatingUserStatus: (t, total) => `Turn ${t}/${total} · simulating the user…`,
  assistantReplyingStatus: (t, total) => `Turn ${t}/${total} · analyst replying…`,
  simulateUserError: "The simulated user step failed.",
  improvisedInfoBlurb: "Improvised user — no scenario was provided; the user improvised.",
  drawerSubhead: "Run a simulated user against your setup",
  scenarioPlaceholder:
    "e.g. A retail investor asking how NVDA is trading after earnings and whether equity momentum looks stretched over the next week. Leave blank to let the user improvise.",
  examplesButtonTitle: "Pick from example equity market scenarios",
  helpPipelineLabel: "analyst",
  helpImproviseProfile: "a generic client profile",
  simulatedActor: "user",
};

export function SimulationPanel(
  props: Omit<React.ComponentProps<typeof SharedSimulationPanel>, "config">
) {
  return <SharedSimulationPanel {...props} config={CONFIG} />;
}
