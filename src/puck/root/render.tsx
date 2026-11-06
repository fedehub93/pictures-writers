import { getDimensionVars } from "@/puck/utils/get-style-vars";

import type { RootProps } from "./types";
import { RootBlockUi } from "./ui/root";

/**
 * Pure render shared by the editor canvas and the public page root.
 *
 * It deliberately imports only the root UI and the shared style-variable
 * utilities so the public render path never pulls in editor field modules.
 */
export const renderRoot = ({ children, dimension }: RootProps) => {
  const styleVars = {
    ...getDimensionVars(dimension),
  };

  return <RootBlockUi styleVars={styleVars}>{children}</RootBlockUi>;
};
