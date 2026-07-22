import type { DrawerId } from "../RightDrawer";

/** Simulation conversations are titled "Simulation · …"; this prefix separates
 *  them from hand-typed chats (they show in the Simulation panel, not the sidebar). */
export const SIM_TITLE_PREFIX = "Simulation · ";

export const TTS_PREF_KEY = "sleep-studio-tts-autoplay";
export {
  MONO_PREF_KEY,
  SPLASH_BG_MONO,
  SPLASH_BG_SEPIA,
  THEME_BOOT_SCRIPT,
} from "./theme-boot";
/** Rounded UI chrome (pills, soft bubbles). Default ON — explicit "0" keeps sharp corners. */
export const ROUND_PREF_KEY = "sleep-studio-round-ui";
/** Chat bubble body type size. Cycles Small → Medium → Large. */
export const BUBBLE_FONT_PREF_KEY = "sleep-studio-bubble-font";
export type BubbleFontSize = "sm" | "md" | "lg";
export const BUBBLE_FONT_SIZES: readonly BubbleFontSize[] = ["sm", "md", "lg"];
export const BUBBLE_FONT_LABELS: Record<BubbleFontSize, string> = {
  sm: "Small",
  md: "Medium",
  lg: "Large",
};
export const BUBBLE_FONT_PX: Record<BubbleFontSize, string> = {
  sm: "12px",
  md: "16.5px", // prior desktop default
  lg: "18px",
};
export function nextBubbleFontSize(current: BubbleFontSize): BubbleFontSize {
  const i = BUBBLE_FONT_SIZES.indexOf(current);
  return BUBBLE_FONT_SIZES[(i + 1) % BUBBLE_FONT_SIZES.length]!;
}
export function readBubbleFontSize(): BubbleFontSize {
  if (typeof window === "undefined") return "md";
  try {
    const v = window.localStorage.getItem(BUBBLE_FONT_PREF_KEY);
    if (v === "sm" || v === "md" || v === "lg") return v;
  } catch {
    // ignore
  }
  return "md";
}
/** Mobile bottom-sheet: which tab to reopen the drawer on. Remembered across
 *  opens/reloads; defaults to Model Setup the very first time. */
export const MOBILE_DRAWER_TAB_KEY = "sleep-studio-mobile-drawer-tab";

/** The function panels shown as drawer tabs on desktop. Opening any one of them
 *  opens the whole set (see openDrawer) so all tabs are visible. */
export const PANEL_TABS: DrawerId[] = [
  "modelsetup",
  "observability",
  "simulation" /*, "expert", "upload" */,
];

/** Panels that expose internal wiring (model/prompt setup, step-by-step traces).
 *  Only admins may see or open these; non-admins get the plain chat surface. */
export const ADMIN_ONLY_DRAWERS: DrawerId[] = ["modelsetup", "observability", "simulation"];

/** Demo studios — shared by the header + mobile Chats switchers. */
export const STUDIO_OPTIONS = [
  { label: "Analyst", href: "/demo/analyst/studio" },
  { label: "Council", href: "/demo/law/studio" },
  { label: "Therapist", href: "/demo/sleep/studio" },
] as const;
