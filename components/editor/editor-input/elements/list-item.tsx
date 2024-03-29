import { RenderElementProps } from "slate-react";

interface ListItemProps extends RenderElementProps {}

export const ListItem = ({ children, attributes }: ListItemProps) => {
  return (
    <li {...attributes} className="list-item mb-2">
      {children}
    </li>
  );
};
