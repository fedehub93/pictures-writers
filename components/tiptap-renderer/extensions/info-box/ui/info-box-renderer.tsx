import { cn } from "@/lib/utils";
import { Node } from "@tiptap/pm/model";

interface InfoBoxRendererProps {
  node: Node;
  children: React.ReactNode;
}

export const InfoBoxRenderer = ({ node, children }: InfoBoxRendererProps) => {
  const { icon } = node.attrs;

  return (
    <div className={cn("post__info-box")}>
      <div className="post__info-box-icon">{icon}</div>
      {children}
    </div>
  );
};
