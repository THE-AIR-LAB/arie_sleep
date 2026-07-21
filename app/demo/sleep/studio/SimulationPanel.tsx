"use client";

import React from "react";
export type { SimRun, SimRunControls, SimulationController } from "../../studio-components/SimulationPanel";
import {
  SimulationPanel as SharedSimulationPanel,
  type SimulationPanelConfig,
} from "../../studio-components/SimulationPanel";

const SCENARIO_EXAMPLES: { title: string; text: string }[] = [
  {
    title: "Middle-of-the-night waking",
    text: "A 45-year-old woman falls asleep fine but wakes around 3am most nights and can't fall back asleep. It started after a stressful job change a few months ago. She wants to understand why and what she can do.",
  },
  {
    title: "Trouble falling asleep",
    text: "A 29-year-old scrolls on their phone in bed and lies awake for over an hour most nights before falling asleep. They feel wired at bedtime and groggy in the morning, and want practical steps to fall asleep faster.",
  },
  {
    title: "Shift worker, rotating schedule",
    text: "A 38-year-old nurse rotates between day and night shifts every week and struggles to sleep during the day after nights. They feel constantly jet-lagged and want strategies to sleep better around an irregular schedule.",
  },
  {
    title: "New parent, fragmented sleep",
    text: "A parent of a 4-month-old is up two or three times a night and can't nap when the baby naps. They're exhausted and anxious about never feeling rested, and want realistic ways to get more sleep right now.",
  },
  {
    title: "Waking too early",
    text: "A 60-year-old consistently wakes at 4:30am, well before their alarm, and can't get back to sleep even though they feel tired. They want to know whether this is normal with age and how to shift their wake time later.",
  },
  {
    title: "Racing mind at bedtime",
    text: "A 34-year-old lies down and immediately starts replaying the day and worrying about tomorrow, which keeps them up for a couple of hours. They want techniques to quiet their mind and wind down before bed.",
  },
  {
    title: "Jet lag after travel",
    text: "A frequent traveler just flew across six time zones and can't align to the new schedule, waking at odd hours and feeling foggy all day. They want a plan to adjust faster on this trip and on the way home.",
  },
  {
    title: "Too much caffeine and late workouts",
    text: "A 41-year-old drinks coffee into the late afternoon and exercises hard around 9pm, then struggles to wind down. They suspect their habits are hurting their sleep and want to know what to change.",
  },
  {
    title: "Snoring and daytime sleepiness",
    text: "A 52-year-old sleeps a full eight hours but still feels exhausted during the day, and their partner reports loud snoring and pauses in breathing. They want to understand what might be going on and whether to seek help.",
  },
  {
    title: "Weekend schedule whiplash",
    text: "A 26-year-old keeps a strict weekday wake time but stays up hours later and sleeps in on weekends, then dreads Monday mornings. They want to fix the Sunday-night insomnia and their inconsistent schedule.",
  },
];

const CONFIG: SimulationPanelConfig = {
  simulateUserPath: "/api/chat/sleep/simulate-user",
  summarizeScenarioPath: "/api/chat/sleep/summarize-scenario",
  examples: SCENARIO_EXAMPLES,
  improvisedLabel: "Improvised patient",
  scenarioFieldLabel: "Patient scenario",
  examplesModalTitle: "Example patient scenarios",
  examplesModalSub: "Pick a scenario, then use it to fill the Patient scenario field.",
  simulatingUserStatus: (t, total) => `Turn ${t}/${total} · simulating the patient…`,
  assistantReplyingStatus: (t, total) => `Turn ${t}/${total} · sleep therapist replying…`,
  simulateUserError: "The simulated patient step failed.",
  improvisedInfoBlurb: "Improvised patient — no scenario was provided; the patient improvised.",
  drawerSubhead: "Run a simulated patient against your setup",
  scenarioPlaceholder:
    "e.g. A 45-year-old woman with insomnia who wakes at 3am and can't fall back asleep; it started after a stressful job change. Leave blank to let the patient improvise.",
  examplesButtonTitle: "Pick from example patient scenarios",
  helpPipelineLabel: "sleep-therapist",
  helpImproviseProfile: "a generic sleeper profile",
  simulatedActor: "patient",
};

export function SimulationPanel(
  props: Omit<React.ComponentProps<typeof SharedSimulationPanel>, "config">
) {
  return <SharedSimulationPanel {...props} config={CONFIG} />;
}
