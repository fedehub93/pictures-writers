import { RenderElementProps } from "slate-react";

interface NumberedListProps extends RenderElementProps {}

export const NumberedList = ({ children, attributes }: NumberedListProps) => {
  return (
    <ol {...attributes} className="list-decimal px-4 mb-4 text-base">
      {children}
    </ol>
  );
};
