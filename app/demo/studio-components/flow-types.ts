/** Shared graph geometry types used by studio FlowThumb / config overview cards. */

export type NodeType =
  | "start"
  | "iff"
  | "prompt"
  | "transform"
  | "tool"
  | "display"
  | "endn";

export interface FlowNode {
  id: string;
  type: NodeType;
  nt?: string;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FlowEdge {
  from: string | [number, number];
  to: string | [number, number];
  fromSide?: "t" | "b" | "l" | "r";
  toSide?: "t" | "b" | "l" | "r";
  label?: string;
}
