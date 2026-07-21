/** Shared UI for the law / sleep / analyst demo studios. */

export { Ic, type IconName } from "./ra-icons";
export {
  BrandMark,
  Logo,
  Avatar,
  FlowThumb,
  KnowledgeThumb,
  anchor,
  edgePath,
} from "./ra-shared";
export type { FlowNode, FlowEdge, NodeType } from "./flow-types";
export { useVoiceRecorder, useTTS, isLiveSpeechSupported } from "./useVoice";
export {
  FeedbackControls,
  type FeedbackEntry,
  type FeedbackSignal,
} from "./FeedbackControls";
export { UploadContent } from "./UploadPanel";
export { ExpertChatContent, type ExpertMessage } from "./ExpertChatPanel";
export { ObservabilityContent, CompilationInfoModal } from "./ObservabilityPanel";
export {
  RightDrawer,
  DRAWER_LABEL,
  type DrawerId,
} from "./RightDrawer";
export {
  SimulationPanel,
  type SimulationPanelConfig,
  type SimRun,
  type SimRunControls,
  type SimulationController,
} from "./SimulationPanel";
