import { Node } from "@tiptap/pm/model";

interface TableContentRendererProps {
  node: Node;
  children: React.ReactNode;
}

export const TableContentRenderer = ({
  node,
  children,
}: TableContentRendererProps) => {
  return (
    <nav
      contentEditable={false}
      className="max-w-md border border-primary/40 bg-accent rounded-md shadow-lg p-4"
      aria-label="Indice dei contenuti"
      role="navigation"
    >
      <details open>
        <summary>
          <h2 className="mb-4 font-semibold pointer-events-none text-xl not-prose inline">
            Indice dei contenuti
          </h2>
        </summary>
        {children}
      </details>
    </nav>
  );
};
