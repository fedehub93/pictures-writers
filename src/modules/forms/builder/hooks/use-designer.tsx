import { useContext } from "react";
import { DesignerContext } from "../context/designer-context";

export const useDesigner = () => {
  const context = useContext(DesignerContext);

  if (!context) {
    throw new Error("useDesigner must be used within a Designer context!");
  }
  return context;
};
