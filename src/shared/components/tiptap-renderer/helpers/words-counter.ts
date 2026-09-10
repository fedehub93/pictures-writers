// utils/wordCount.ts
type TiptapNode = {
  type?: string;
  text?: string;
  content?: TiptapNode[];
  attrs?: Record<string, any>;
};

export function countWordsFromText(text: string): number {
  return text
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean).length;
}

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

  return countWordsFromText(text);
}
