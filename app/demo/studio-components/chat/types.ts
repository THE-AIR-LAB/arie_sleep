import type React from "react";
import type { Turn } from "../../../components/trace/TraceView";
import type { SimRunControls } from "../SimulationPanel";
import type { CanvasDoc } from "../../../components/canvas/Canvas";

export interface Message {
  role: "user" | "ai";
  text: string;
  /** Observability turn this reply belongs to — lets you click the bubble to
   *  jump to its trace. Only set for replies produced this session. */
  turnId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  /** Last-activity timestamp (ISO); shown as relative time in the simulation run list. */
  updatedAt?: string;
  /** Actual number of turns (assistant replies) — shown in the simulation run list. */
  turnCount?: number;
  /** For simulation runs: the scenario that drove the run. */
  scenario?: string | null;
  /** True when the signed-in user has left feedback on at least one message. */
  hasFeedback?: boolean;
}

export interface SuggestionChip {
  icon: string;
  label: string;
}

export interface ActionChip {
  icon: string;
  label: string;
  prefill?: string;
}

/** Props the shared StudioApp passes to the studio's Model Setup panel. */
export interface SetupBarProps {
  onDockedChange?: (docked: boolean) => void;
  turns: Turn[];
  slot: HTMLElement | null;
  onTopDockChange?: (h: number) => void;
  policyFocus?: { id: string; n: number };
  stateFocus?: { id: string; n: number };
  policyCanvasSelect?: { canvasId: string; n: number };
  /**
   * Initial Model Setup section when the bar mounts (sample-project bootstrap).
   * Defaults to "policy".
   */
  initialSection?: "policy" | "state" | "knowledge" | null;
}

/** Props the shared StudioApp passes to the studio's Simulation panel. */
export interface SimulationPanelProps {
  controller: {
    begin: (scenario: string, turns: number) => void;
    send: (message: string) => Promise<string | undefined>;
    renameCurrent?: (title: string) => void;
  };
  onRunControls?: (controls: SimRunControls | null) => void;
  runs: Conversation[];
  activeRunId?: string | null;
  onSelectRun?: (id: string) => void;
  onDeleteRun?: (id: string) => void;
  slot: HTMLElement | null;
}

/**
 * Everything that differs between the law / sleep / analyst studios. The
 * shared `StudioApp` + extracted presentational components read only from
 * this config (plus their own local props) — no studio-specific literals.
 */
export type StudioChatConfig = {
  /** Shown in the sidebar title, thread header, and bubble role labels. */
  productName: string;
  /** e.g. "/demo/law/studio" — used for the brand-logo link (splash, loading, empty state). */
  studioPath: string;
  /** How the assistant mark is rendered in the header / bubbles / empty state.
   *  "logo" → a square photo/color mark (law, analyst); "avatar" → a circular photo Avatar (sleep). */
  assistantMark: "logo" | "avatar";
  /** Image URL for the assistant mark (e.g. "/lawyer.png"). Used by both mark modes. */
  avatarSrc?: string;
  /** Mono fallback initials for the Avatar mark, e.g. "SA" for sleep. Only used when assistantMark === "avatar". */
  avatarMono?: string;
  /** Href for the empty-state brand mark. Usually the same as `studioPath`. */
  emptyStateHref: string;
  /** Empty-state headline. Defaults to "Start a conversation". */
  emptyStateTitle?: string;
  /** Empty-state intro copy (paragraph under the title). */
  emptyStateBody: React.ReactNode;
  /** "Primary agent: …" line embedded in the Overall Workflow canvas seed. */
  emptyStatePrimaryAgent: string;
  /**
   * Builds the bottom "Workflow" drawer seed. Defaults to the shared
   * Overall Workflow overview (one canvas of stage boxes). Studios can override
   * to render one canvas per workflow stage instead (see the sleep therapist).
   */
  buildWorkflowSeed?: (primaryAgent: string) => CanvasDoc;
  /** Optional domain-specific help copy shown in the bottom workflow drawer. Reserved for future use. */
  workflowHelpText?: string;
  /** What to call the human on the other end of the chat in comments/telemetry (not user-facing). */
  subjectNoun?: string;
  /** API topic slug — drives `/api/chat/{topic}/base`, `/api/conversations?topic=`, `/api/admin/setup/{topic}`. */
  apiTopic: string;
  /** Fallback suggestion chips shown in the empty state. */
  suggestions: SuggestionChip[];
  /** Action chips shown above the composer. */
  actionChips: ActionChip[];
  /** Derives the active workflow stage (for the live workflow highlight) from a completed turn. Domain-specific. */
  deriveWorkflowStage: (turn: Turn | null | undefined) => string | null;
  /** The studio's Model Setup panel (state schema / prompts / policy canvas editor). */
  SetupBar: React.ComponentType<SetupBarProps>;
  /** Turn ids (+ which state keys) that extracted at least one piece of state this turn. */
  turnExtractedStateKeys: (turns: Turn[] | undefined) => Map<string, string[]>;
  /** The studio's Simulation panel (pre-wired with its own scenarios/endpoints). */
  SimulationPanel: React.ComponentType<SimulationPanelProps>;
};
