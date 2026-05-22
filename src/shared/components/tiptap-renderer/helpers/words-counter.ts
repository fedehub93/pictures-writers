// utils/wordCount.ts
type TiptapNode = {
  type?: string;
  text?: string;
  content?: TiptapNode[];
  attrs?: Record<string, any>;
};

export function countWordsFromTiptap(nodeOrDoc: TiptapNode | TiptapNode[]): number {
  const nodes = Array.isArray(nodeOrDoc) ? nodeOrDoc : [nodeOrDoc];
  let text = "";

  function walk(node: TiptapNode) {
    if (!node) return;
    if (typeof node.text === "string") {
      text += node.text + " ";
    }
    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) walk(child);
    }
  }

  for (const n of nodes) walk(n);

  // normalizza e conta
  const words = text
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean);

  return words.length;
}