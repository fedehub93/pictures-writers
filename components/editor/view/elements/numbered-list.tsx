import { RenderNode } from "../helpers/render-node";
import { CustomElement } from "../slate-renderer";

interface NumberedListProps {
  node: CustomElement;
}

export const NumberedListElement = ({ node }: NumberedListProps) => {
  return (
    <div className="max-w-md border border-gray-500 bg-gray-100 p-2 ">
      <div className="mb-4 font-bold">Indice dei contenuti</div>
      <ol
        className="list-decimal listind pl-6 [&>li>a]:font-bold [&>li>a]:no-underline [&>li>a]:mb-0 "
        type="1"
      >
        {node.children.map((child: any, i: number) => (
          <RenderNode key={i} node={child} />
        ))}
      </ol>
    </div>
  );
};
