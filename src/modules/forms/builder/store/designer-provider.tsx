// store/designer-provider.tsx
"use client";

import { createContext, useRef, useContext, type ReactNode } from "react";
import { useStore } from "zustand";

import { createDesignerStore, type DesignerStore } from "./use-designer-store";

// 1. Creiamo il Context di React
export const DesignerContext = createContext<ReturnType<
  typeof createDesignerStore
> | null>(null);

interface DesignerProviderProps {
  children: ReactNode;
  initialContent?: any;
}

export const DesignerProvider = ({
  children,
  initialContent,
}: DesignerProviderProps) => {
  // 2. Usiamo useRef per creare l'istanza dello store UNA SOLA VOLTA per ogni montaggio
  // E gli passiamo i dati del database istantaneamente!
  const storeRef = useRef<ReturnType<typeof createDesignerStore>>(null);

  if (!storeRef.current) {
    storeRef.current = createDesignerStore(initialContent);
  }

  return (
    <DesignerContext.Provider value={storeRef.current}>
      {children}
    </DesignerContext.Provider>
  );
};

// 3. IL NUOVO HOOK CUSTOM: Questo sostituisce il vecchio import nei tuoi componenti!
export const useDesigner = <T,>(selector: (store: DesignerStore) => T): T => {
  const store = useContext(DesignerContext);
  if (!store) {
    throw new Error("useDesigner must be used within a DesignerProvider");
  }
  return useStore(store, selector);
};
