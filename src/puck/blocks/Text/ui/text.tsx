import type { ReactNode } from "react";

export const TextBlockUi = ({
  text,
  styleVars,
}: {
  text?: ReactNode;
  styleVars: Record<string, string>;
}) => {
  return (
    <p className="puck-dim puck-typo whitespace-pre-line" style={styleVars}>
      {text}
    </p>
  );
};
