import { Monitor, Smartphone, Tablet } from "lucide-react";
import { Viewport } from "@puckeditor/core";

import { Breakpoint, BREAKPOINTS } from "./breakpoints";

// Assicurati di importare il type corretto se esposto da Puck

export const viewports: Viewport[] = [
  {
    width: BREAKPOINTS.mobile.puckCanvasWidth,
    height: "auto",
    label: BREAKPOINTS.mobile.label,
    icon: <Smartphone className="size-4" />,
  },
  {
    width: BREAKPOINTS.tablet.puckCanvasWidth,
    height: "auto",
    label: BREAKPOINTS.tablet.label,
    icon: <Tablet className="size-4" />,
  },
  {
    width: BREAKPOINTS.desktop.puckCanvasWidth,
    height: "auto",
    label: BREAKPOINTS.desktop.label,
    icon: <Monitor className="size-4" />,
  },
];

export const getViewportKey = (width: number | string): Breakpoint => {
  const numericWidth = typeof width === 'string' ? parseInt(width, 10) : width;
  
  // Ora la logica è dinamica e legata alla configurazione centrale
  if (numericWidth <= BREAKPOINTS.mobile.puckCanvasWidth) return "mobile";
  if (numericWidth <= BREAKPOINTS.tablet.puckCanvasWidth) return "tablet";
  
  return "desktop";
};
