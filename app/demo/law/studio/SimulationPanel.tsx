"use client";

import React from "react";
export type { SimRun, SimRunControls, SimulationController } from "../../studio-components/SimulationPanel";
import {
  SimulationPanel as SharedSimulationPanel,
  type SimulationPanelConfig,
} from "../../studio-components/SimulationPanel";

const SCENARIO_EXAMPLES: { title: string; text: string }[] = [
  {
    title: "Stock purchase vs. asset purchase",
    text: "A founder of a Series B SaaS company is negotiating a sale to a strategic buyer. The buyer wants an asset purchase; the founder prefers a stock purchase for tax and continuity reasons. They want to understand the tradeoffs, liability allocation, and what typically gets negotiated in the purchase agreement.",
  },
  {
    title: "Letter of intent / exclusivity",
    text: "A PE firm sent a non-binding LOI with a 60-day exclusivity period and a $2M break fee if the seller walks. The seller's board wants to know what is actually binding, whether the exclusivity is market, and what diligence and interim covenants they should expect before a definitive agreement.",
  },
  {
    title: "Due diligence red flags",
    text: "Buyer's counsel is mid-diligence on a manufacturing target and found customer concentration (one customer is 40% of revenue), an expired key IP license, and an open wage-and-hour claim. They want to know how these typically affect price, reps, indemnities, and whether to walk or restructure the deal.",
  },
  {
    title: "Earnout dispute risk",
    text: "A founder sold their company with a $15M earnout tied to EBITDA over two years. Post-close, the buyer changed revenue recognition and cut the go-to-market budget. The founder believes the earnout was sabotaged and wants to understand contractual protections and remedies.",
  },
  {
    title: "Working capital adjustment",
    text: "A buyer and seller agreed on a $50M enterprise value with a pegged working capital target. At closing, the estimated net working capital was $3M below the peg. The seller disputes the buyer's calculation of accrued liabilities. They want to understand how pegs, true-ups, and dispute mechanisms usually work.",
  },
  {
    title: "Series B preferred financing",
    text: "A startup is raising a $40M Series B led by a growth fund. The term sheet includes a 1x non-participating liquidation preference, a broad-based weighted-average anti-dilution, a board seat, and pro rata rights. Founders want to know what is standard, what to push back on, and how this affects existing common and Option holders.",
  },
  {
    title: "Convertible note / SAFE stack",
    text: "A company raised $8M on SAFEs (uncapped and $60M cap) and now has a priced round at a $45M pre-money. Early SAFE holders expect conversion economics that would heavily dilute the founders. They want to understand conversion math, most-favored-nation issues, and how to negotiate a clean-up with investors.",
  },
  {
    title: "Debt financing / credit agreement",
    text: "A mid-market company is negotiating a $75M senior secured credit facility to fund an acquisition. The lender's draft has tight financial covenants, a sweeping change-of-control default, and broad events of default. Management wants to know which terms are negotiable and how they interact with the planned M&A timeline.",
  },
  {
    title: "Rollover equity / management package",
    text: "In a PE buyout, management is asked to roll 30% of after-tax proceeds into a new holdco and take a new equity incentive plan with a 4-year vest and double-trigger acceleration. They want to understand tax, governance, dilution, and what happens if they leave or the company is sold again.",
  },
  {
    title: "Representations, warranties & R&W insurance",
    text: "On a $200M stock deal, the buyer wants a $20M indemnity escrow and broad knowledge qualifiers only for the seller. The seller proposes R&W insurance with a small retention. Both sides want to understand how R&W insurance changes escrow size, survival periods, and negotiation leverage on the reps schedule.",
  },
];

const CONFIG: SimulationPanelConfig = {
  simulateUserPath: "/api/chat/law/simulate-user",
  summarizeScenarioPath: "/api/chat/law/summarize-scenario",
  examples: SCENARIO_EXAMPLES,
  improvisedLabel: "Improvised patient",
  scenarioFieldLabel: "Client scenario",
  examplesModalTitle: "Example client scenarios",
  examplesModalSub: "Pick a scenario, then use it to fill the Client scenario field.",
  simulatingUserStatus: (t, total) => `Turn ${t}/${total} · simulating the patient…`,
  assistantReplyingStatus: (t, total) => `Turn ${t}/${total} · council replying…`,
  simulateUserError: "The simulated patient step failed.",
  improvisedInfoBlurb: "Improvised patient — no scenario was provided; the patient improvised.",
  drawerSubhead: "Run a simulated patient against your setup",
  scenarioPlaceholder:
    "e.g. A founder negotiating a stock vs. asset sale to a strategic buyer; wants to understand tax, liability allocation, and what typically gets negotiated in the purchase agreement. Leave blank to let the client improvise.",
  examplesButtonTitle: "Pick from example client scenarios",
  helpPipelineLabel: "council",
  helpImproviseProfile: "a generic client profile",
  simulatedActor: "patient",
};

export function SimulationPanel(
  props: Omit<React.ComponentProps<typeof SharedSimulationPanel>, "config">
) {
  return <SharedSimulationPanel {...props} config={CONFIG} />;
}
