import type { DrawerId } from "../RightDrawer";

/**
 * Named UI + content bootstrap for demo "sample projects".
 * Applied once on mount when the URL has `?sample=<id>` (or `?sample=1`
 * for the current studio's default).
 */
export type StudioUiPreset = {
  id: string;
  sidebarOpen?: boolean;
  sidebarWidth?: number;
  /** Right-drawer tabs to open (Model Setup / Observability / Simulation). */
  openDrawers?: DrawerId[];
  activeDrawer?: DrawerId | null;
  /** Right drawer width in px; `null` keeps the CSS ~50vw default. */
  obsWidth?: number | null;
  canvasOpen?: boolean;
  /** Bottom workflow height as a fraction of the viewport (e.g. 0.3). */
  canvasHeightFrac?: number;
  /** Model Setup section to land on. */
  setupSection?: "policy" | "state" | "knowledge";
  /** Policy canvas id to select (intake / assess / guide / followup). */
  policyCanvasId?: string;
  /** Show bubble chrome (Controls on). */
  hideBubbleControls?: boolean;
  /** Turn on the Feedback highlight toggle once the thread has entries. */
  highlightFeedback?: boolean;
  /** Prefer a regular conversation whose title includes this (case-insensitive). */
  conversationTitleIncludes?: string;
  /** If true, open the latest Simulation · run instead of a regular chat. */
  selectSimulation?: boolean;
};

/** Screenshot-style layout: sidebar + Model Setup/Policy/Intake + workflow + chat. */
const DEMO_LAYOUT: Omit<StudioUiPreset, "id"> = {
  sidebarOpen: true,
  sidebarWidth: 300,
  openDrawers: ["modelsetup", "observability", "simulation"],
  activeDrawer: "modelsetup",
  obsWidth: null,
  canvasOpen: true,
  canvasHeightFrac: 0.3,
  setupSection: "policy",
  policyCanvasId: "intake",
  hideBubbleControls: false,
  highlightFeedback: true,
};

export const SAMPLE_PRESETS: Record<string, StudioUiPreset> = {
  analyst: { id: "analyst", ...DEMO_LAYOUT },
  research: { id: "research", ...DEMO_LAYOUT },
  therapist: { id: "therapist", ...DEMO_LAYOUT },
  sleep: { id: "sleep", ...DEMO_LAYOUT },
  council: { id: "council", ...DEMO_LAYOUT },
  law: { id: "law", ...DEMO_LAYOUT },
};

/** Map studio `apiTopic` → default sample id when `?sample=1`. */
export const SAMPLE_BY_TOPIC: Record<string, string> = {
  analyst: "analyst",
  research: "research",
  sleep: "therapist",
  law: "council",
};

export function resolveSamplePreset(
  raw: string | null | undefined,
  apiTopic: string
): StudioUiPreset | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  if (key === "1" || key === "true" || key === "yes") {
    const id = SAMPLE_BY_TOPIC[apiTopic] ?? apiTopic;
    return SAMPLE_PRESETS[id] ?? { id, ...DEMO_LAYOUT };
  }
  return SAMPLE_PRESETS[key] ?? null;
}

export function pickSampleConversation(
  regular: Array<{ id: string; title: string; hasFeedback?: boolean }>,
  simulations: Array<{ id: string; title: string }>,
  preset: StudioUiPreset
): { id: string; asSimulation: boolean } | null {
  if (preset.selectSimulation && simulations.length > 0) {
    return { id: simulations[0]!.id, asSimulation: true };
  }
  const needle = preset.conversationTitleIncludes?.trim().toLowerCase();
  if (needle) {
    const hit = regular.find((c) => c.title.toLowerCase().includes(needle));
    if (hit) return { id: hit.id, asSimulation: false };
  }
  const withFb = regular.find((c) => c.hasFeedback);
  if (withFb) return { id: withFb.id, asSimulation: false };
  if (regular.length > 0) return { id: regular[0]!.id, asSimulation: false };
  if (simulations.length > 0) return { id: simulations[0]!.id, asSimulation: true };
  return null;
}
