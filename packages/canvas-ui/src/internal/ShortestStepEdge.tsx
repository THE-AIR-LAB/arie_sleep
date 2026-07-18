"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useInternalNode,
  type EdgeProps,
} from "@xyflow/react";
import { anchorsForEdge } from "./edge-anchors";

const EDGE_LABEL_COLOR = "#EEE8E8";
const EDGE_LABEL_BG_DEFAULT = "#736766";
const EDGE_LABEL_BG_TRUE = "#007E27";
const EDGE_LABEL_BG_FALSE = "#D9582B";

function branchLabelBackground(label: unknown): string {
  const key = typeof label === "string" ? label.trim().toLowerCase() : "";
  if (key === "true") return EDGE_LABEL_BG_TRUE;
  if (key === "false") return EDGE_LABEL_BG_FALSE;
  return EDGE_LABEL_BG_DEFAULT;
}

/**
 * Curved edge that attaches to the nearest node sides so side-by-side nodes
 * connect left↔right instead of detouring through the default top/bottom.
 * Branch labels (true/false) sit at the bezier mid-point.
 */
export function ShortestStepEdge({
  id,
  source,
  target,
  sourceHandle,
  markerEnd,
  style,
  label,
  interactionWidth,
}: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const sourceRect = {
    x: sourceNode.internals.positionAbsolute.x,
    y: sourceNode.internals.positionAbsolute.y,
    width: sourceNode.measured?.width ?? 160,
    height: sourceNode.measured?.height ?? 80,
  };
  const targetRect = {
    x: targetNode.internals.positionAbsolute.x,
    y: targetNode.internals.positionAbsolute.y,
    width: targetNode.measured?.width ?? 160,
    height: targetNode.measured?.height ?? 80,
  };

  const anchors = anchorsForEdge(sourceRect, targetRect, sourceHandle);
  // labelX/Y = cubic-bezier t=0.5 center (always mid-curve).
  const [path, labelX, labelY] = getBezierPath(anchors);
  const labelBg = branchLabelBackground(label);
  const labelKey =
    typeof label === "string" ? label.trim().toLowerCase() : "";

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={style}
        interactionWidth={interactionWidth}
      />
      {label != null && label !== "" && (
        <EdgeLabelRenderer>
          <div
            className={[
              "rf-edge-branch-label",
              "nodrag",
              "nopan",
              labelKey === "true" ? "rf-edge-branch-label--true" : "",
              labelKey === "false" ? "rf-edge-branch-label--false" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
              background: labelBg,
              color: EDGE_LABEL_COLOR,
              padding: "2px 6px",
              borderRadius: 2,
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.2,
              zIndex: 10,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
