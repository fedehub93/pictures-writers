import { RenderElementProps } from "slate-react";

interface BulletedListProps extends RenderElementProps {}

export const BulletedList = ({ children, attributes }: BulletedListProps) => {
  return (
    <ul {...attributes} className="list-disc px-4 mb-4">
      {children}
    </ul>
  );
};
