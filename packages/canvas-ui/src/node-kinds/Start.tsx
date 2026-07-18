import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CanvasNode, NodeKindDef } from "../types";
import { ClampedNodeText } from "./ClampedNodeText";

function StartNode({ data, selected }: NodeProps<CanvasNode>) {
  return (
    <div
      className={`px-4 py-3 text-sm font-sans bg-[#eef1eb] border-2 border-[#B0BEA5] text-[#3d4a35] rounded-lg shadow-sm w-[280px] ${
        selected ? "ring-2 ring-[#B0BEA5]" : ""
      }`}
    >
      <div className="rf-node-title mb-1 text-left text-[#3d4a35]">
        Start
      </div>
      <ClampedNodeText
        className="leading-relaxed text-left"
        lines={8}
        title={data.label || "Describe the starting point for this canvas..."}
      >
        {data.label || "Describe the starting point for this canvas..."}
      </ClampedNodeText>
      <Handle type="source" position={Position.Bottom} className="!bg-[#B0BEA5]" />
    </div>
  );
}

export const START: NodeKindDef = {
  kind: "start",
  toolbarLabel: "+ Start",
  toolbarClassName:
    "text-xs font-sans uppercase tracking-widest px-2.5 py-1 border border-[#B0BEA5] text-[#3d4a35] bg-[#eef1eb] hover:bg-[#e0e6d9] rounded-full",
  component: StartNode,
  defaultLabel: "Start",
  hideFromToolbar: true,
  singleton: true,
  inspector: {
    labelTitle: "Prompt",
    textareaRows: 10,
  },
};
