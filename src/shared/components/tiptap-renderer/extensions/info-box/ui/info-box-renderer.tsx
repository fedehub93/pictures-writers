import { cn } from "@/shared/lib/utils";
import { Node } from "@tiptap/pm/model";

interface InfoBoxRendererProps {
  node: Node;
  children: React.ReactNode;
}

export const InfoBoxRenderer = ({ node, children }: InfoBoxRendererProps) => {
  const { icon } = node.attrs;

  return (
    <div data-type="infobox" className={cn("post__info-box")}>
      <div data-icon={icon} className="post__info-box-icon">
        {icon}
      </div>
      {children}
    </div>
  );
};
