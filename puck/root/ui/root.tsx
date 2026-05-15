import { ReactNode } from "react";

export const RootBlockUi = ({
  children,
  styleVars,
}: {
  children: ReactNode;
  styleVars: Record<string, string>;
}) => {
  return (
    <div className="puck-dim" style={styleVars}>
      {children}
    </div>
  );
};
