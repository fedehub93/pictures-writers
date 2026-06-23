"use client";

import { createContext, useState, type ReactNode } from "react";

import { FormNodeInstance } from "../types";

type DesignerContextType = {
  nodes: FormNodeInstance[];
  addNode: (index: number, node: FormNodeInstance) => void;
};

export const DesignerContext = createContext<DesignerContextType | null>(null);

export const DesignerContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [nodes, setNodes] = useState<FormNodeInstance[]>([]);

  const addNode = (index: number, node: FormNodeInstance) => {
    setNodes((prev) => {
      const newNodes = [...prev];
      newNodes.splice(index, 0, node);
      return newNodes;
    });
  };

  return (
    <DesignerContext.Provider value={{ nodes, addNode }}>
      {children}
    </DesignerContext.Provider>
  );
};
