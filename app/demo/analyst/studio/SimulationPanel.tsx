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
    text: "A retail investor wants to understand how NVIDIA (NVDA) is trading after its latest earnings — the recent move, valuation, and whether momentum looks stretched — over the next week or two.",
  },
  {
    title: "S&P 500 direction",
    text: "Someone with a 401(k) is nervous about the S&P 500 near highs and wants a read on the index's trend, breadth, and the main risks (rates, earnings) over the next month.",
  },
  {
    title: "Bond yields and rates",
    text: "A user asks what the US 10-year Treasury yield is doing and what rising or falling yields would mean for stocks and their bond fund over the next few months.",
  },
  {
    title: "Bitcoin volatility",
    text: "A curious investor wants to understand bitcoin's recent price action and volatility, and how it compares to equities, to decide whether a small allocation makes sense — general context only.",
  },
  {
    title: "Tech sector rotation",
    text: "A user has heard money is rotating out of big tech and wants to know whether the Nasdaq is underperforming the broader market and what could be driving it.",
  },
  {
    title: "Oil / energy outlook",
    text: "Someone asks about crude oil prices and energy stocks — the recent trend, what's moving them (supply, demand, geopolitics), and the near-term outlook.",
  },
  {
    title: "Dividend stock check",
    text: "A retiree wants a read on a large dividend-paying stock like Coca-Cola (KO): current level, valuation, and whether its recent move signals anything about stability.",
  },
  {
    title: "Comparing two stocks",
    text: "A user wants to compare Apple (AAPL) and Microsoft (MSFT) — recent performance, valuation, and momentum — to understand which has looked stronger lately.",
  },
  {
    title: "The dollar and FX",
    text: "Someone traveling abroad asks what the US dollar has been doing and how a stronger or weaker dollar affects markets and multinational earnings.",
  },
  {
    title: "Volatile market day",
    text: "During a sharp sell-off, an anxious investor asks what's happening in the market today, how bad the move is versus history (VIX), and whether they should be worried.",
  },
];

const CONFIG: SimulationPanelConfig = {
  simulateUserPath: "/api/chat/analyst/simulate-user",
  summarizeScenarioPath: "/api/chat/analyst/summarize-scenario",
  examples: SCENARIO_EXAMPLES,
  improvisedLabel: "Improvised user",
  scenarioFieldLabel: "Market scenario",
  examplesModalTitle: "Example market scenarios",
  examplesModalSub: "Pick a scenario, then use it to fill the Market scenario field.",
  simulatingUserStatus: (t, total) => `Turn ${t}/${total} · simulating the user…`,
  assistantReplyingStatus: (t, total) => `Turn ${t}/${total} · analyst replying…`,
  simulateUserError: "The simulated user step failed.",
  improvisedInfoBlurb: "Improvised user — no scenario was provided; the user improvised.",
  drawerSubhead: "Run a simulated user against your setup",
  scenarioPlaceholder:
    "e.g. A retail investor asking how NVDA is trading after earnings and whether momentum looks stretched over the next week. Leave blank to let the user improvise.",
  examplesButtonTitle: "Pick from example market scenarios",
  helpPipelineLabel: "analyst",
  helpImproviseProfile: "a generic client profile",
  simulatedActor: "user",
};

export function SimulationPanel(
  props: Omit<React.ComponentProps<typeof SharedSimulationPanel>, "config">
) {
  return <SharedSimulationPanel {...props} config={CONFIG} />;
}
