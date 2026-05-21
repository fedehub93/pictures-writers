export type Breakpoint = "mobile" | "tablet" | "desktop";

// Definiamo tutte le regole in un unico posto
export const BREAKPOINTS = {
  mobile: {
    id: "mobile",
    label: "Mobile",
    puckCanvasWidth: 360, // La larghezza dell'iframe nell'editor
    cssMaxWidth: 767, // Fino a quanti pixel vale questa regola in CSS
  },
  tablet: {
    id: "tablet",
    label: "Tablet",
    puckCanvasWidth: 768,
    cssMaxWidth: 1024,
  },
  desktop: {
    id: "desktop",
    label: "Desktop",
    puckCanvasWidth: 1280, // o "100%"
    cssMaxWidth: null, // Desktop è il nostro default (mobile-first o viceversa)
  },
} as const;
