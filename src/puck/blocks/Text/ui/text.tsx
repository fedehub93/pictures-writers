import type { TextBlockProps } from "../types";

export const TextBlockUi = ({ text, align, color }: TextBlockProps) => {
  return (
    <p
      style={{
        textAlign: align,
        color: color || undefined,
        whiteSpace: "pre-line",
      }}
    >
      {text}
    </p>
  );
};
