import { Breakpoint } from "./breakpoints";

// Suffix interni per le variabili CSS: desktop -> d, tablet -> t, mobile -> m
export const getSuffix = (bp: Breakpoint) => bp.charAt(0);
