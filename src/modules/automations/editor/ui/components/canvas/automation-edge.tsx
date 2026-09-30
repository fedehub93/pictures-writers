"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import { XIcon } from "lucide-react";
import { useState } from "react";

/**
 * Connection edge with an explicit delete affordance. React Flow's default
 * delete key (Backspace) is undiscoverable, so a small "×" appears when the
 * edge is hovered or selected; the keyboard shortcut (Backspace/Delete) also
 * works (wired on the canvas).
 */
export function AutomationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  selected,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);
  const { deleteElements } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // deleteElements emits the removal through onEdgesChange, so the controlled
  // canvas state stays in sync (a raw setEdges would only touch the store and
  // the edge would reappear on the next render).
  const removeEdge = () => {
    void deleteElements({ edges: [{ id }] });
  };

  const showButton = hovered || selected;

  return (
    <>
      <g
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
        {/* Invisible wide hit area so hovering the thin line is easy. */}
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={24}
          style={{ cursor: "pointer" }}
        />
      </g>
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: showButton ? "all" : "none",
            opacity: showButton ? 1 : 0,
            transition: "opacity 120ms ease",
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <button
            type="button"
            onClick={removeEdge}
            aria-label="Remove connection"
            title="Remove connection"
            className="flex size-4 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:border-destructive hover:text-destructive"
          >
            <XIcon className="size-2" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
