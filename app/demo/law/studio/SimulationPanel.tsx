"use client";

import React from "react";
export type { SimRun, SimRunControls, SimulationController } from "../../studio-components/SimulationPanel";
import {
  SimulationPanel as SharedSimulationPanel,
  type SimulationPanelConfig,
} from "../../studio-components/SimulationPanel";

const SCENARIO_EXAMPLES: { title: string; text: string }[] = [
  {
    title: "Wrongful termination",
    text: "A 34-year-old software engineer in California was fired two weeks after reporting sexual harassment to HR. They believe it was retaliation, have their offer letter and a few emails, and want to know if they have a wrongful-termination claim and what the deadline to act is.",
  },
  {
    title: "Landlord withholding a security deposit",
    text: "A tenant in New York moved out 45 days ago and the landlord still hasn't returned the $2,400 security deposit or sent an itemized list of deductions. The apartment was left clean. They want to recover the deposit and know whether they can go to small claims court.",
  },
  {
    title: "Unpaid invoice / breach of contract",
    text: "A freelance graphic designer completed a $9,500 branding project under a signed contract, but the client has ignored invoices for three months and now claims the work was 'never approved.' They have the contract, deliverables, and email approvals, and want to get paid.",
  },
  {
    title: "Divorce with young children",
    text: "A parent of two children (ages 4 and 7) has decided to divorce their spouse after eight years of marriage. They're worried about custody, the family home, and child support, and want to understand the process and what to expect in their state.",
  },
  {
    title: "Car accident injury",
    text: "A driver was rear-ended at a red light three weeks ago and has ongoing neck and back pain plus $6,000 in medical bills. The other driver's insurer is pushing for a quick low settlement. They want to know their options and whether to accept.",
  },
  {
    title: "Immigration / work visa",
    text: "An H-1B holder's employer is being acquired and they're unsure whether their visa and pending green-card petition survive the transition. They want to understand their status, timing, and what happens if they're laid off.",
  },
  {
    title: "First-time DUI",
    text: "A 27-year-old was arrested for a first-offense DUI over the weekend, has a court date in three weeks, and no prior record. They want to understand the charges, possible penalties, effect on their license, and what to do before the hearing.",
  },
  {
    title: "Estate / probate after a parent's death",
    text: "A person's mother recently passed away leaving a house, some savings, and a handwritten will naming them executor. They have two siblings and aren't sure whether probate is required or how to handle the estate and debts.",
  },
  {
    title: "Trademark / small-business IP",
    text: "A small coffee-roaster owner just received a cease-and-desist letter claiming their brand name infringes a larger company's trademark. They've used the name for two years and have a small following. They want to know their risk and options.",
  },
  {
    title: "Eviction notice dispute",
    text: "A renter received a 30-day eviction notice they believe is retaliation for requesting repairs to a broken heater they'd reported in writing. Rent is current. They want to know if the eviction is lawful and how to respond before the deadline.",
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
    "e.g. A 34-year-old software engineer in California fired two weeks after reporting harassment to HR; wants to know if they have a wrongful-termination claim and what the deadline is. Leave blank to let the client improvise.",
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
