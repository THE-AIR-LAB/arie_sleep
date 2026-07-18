import { Position } from "@xyflow/react";

export type NodeRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type EdgeAnchors = {
  sourceX: number;
  sourceY: number;
  sourcePosition: Position;
  targetX: number;
  targetY: number;
  targetPosition: Position;
};

/** Named branch handles keep a fixed source side; everything else floats. */
const PINNED_SOURCE_SIDE: Record<
  string,
  { position: Position; yRatio?: number }
> = {
  true: { position: Position.Right, yRatio: 0.4 },
  false: { position: Position.Bottom },
  body: { position: Position.Right },
  done: { position: Position.Bottom },
  success: { position: Position.Bottom },
  error: { position: Position.Left },
};

function sidePoint(
  rect: NodeRect,
  position: Position,
  yRatio = 0.5
): { x: number; y: number; position: Position } {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height * yRatio;
  switch (position) {
    case Position.Left:
      return { x: rect.x, y: cy, position: Position.Left };
    case Position.Right:
      return { x: rect.x + rect.width, y: cy, position: Position.Right };
    case Position.Top:
      return { x: cx, y: rect.y, position: Position.Top };
    case Position.Bottom:
    default:
      return { x: cx, y: rect.y + rect.height, position: Position.Bottom };
  }
}

/**
 * Pick the nearest pair of node sides (left/right/top/bottom) so the edge takes
 * the short orthogonal path when nodes sit side-by-side or stacked.
 */
export function anchorBetweenRects(
  sourceRect: NodeRect,
  targetRect: NodeRect
): EdgeAnchors {
  const sourceCenterX = sourceRect.x + sourceRect.width / 2;
  const sourceCenterY = sourceRect.y + sourceRect.height / 2;
  const targetCenterX = targetRect.x + targetRect.width / 2;
  const targetCenterY = targetRect.y + targetRect.height / 2;
  const dx = targetCenterX - sourceCenterX;
  const dy = targetCenterY - sourceCenterY;

  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx >= 0) {
      return {
        sourceX: sourceRect.x + sourceRect.width,
        sourceY: sourceCenterY,
        sourcePosition: Position.Right,
        targetX: targetRect.x,
        targetY: targetCenterY,
        targetPosition: Position.Left,
      };
    }

    return {
      sourceX: sourceRect.x,
      sourceY: sourceCenterY,
      sourcePosition: Position.Left,
      targetX: targetRect.x + targetRect.width,
      targetY: targetCenterY,
      targetPosition: Position.Right,
    };
  }

  if (dy >= 0) {
    return {
      sourceX: sourceCenterX,
      sourceY: sourceRect.y + sourceRect.height,
      sourcePosition: Position.Bottom,
      targetX: targetCenterX,
      targetY: targetRect.y,
      targetPosition: Position.Top,
    };
  }

  return {
    sourceX: sourceCenterX,
    sourceY: sourceRect.y,
    sourcePosition: Position.Top,
    targetX: targetCenterX,
    targetY: targetRect.y + targetRect.height,
    targetPosition: Position.Bottom,
  };
}

/**
 * Shortest-path anchors, with optional pinned source side for branch handles
 * (IF true/false, loop body/done, etc.).
 */
export function anchorsForEdge(
  sourceRect: NodeRect,
  targetRect: NodeRect,
  sourceHandle?: string | null
): EdgeAnchors {
  const anchors = anchorBetweenRects(sourceRect, targetRect);
  const pin = sourceHandle ? PINNED_SOURCE_SIDE[sourceHandle] : null;
  if (!pin) {
    return anchors;
  }

  const source = sidePoint(sourceRect, pin.position, pin.yRatio);
  return {
    ...anchors,
    sourceX: source.x,
    sourceY: source.y,
    sourcePosition: source.position,
  };
}
