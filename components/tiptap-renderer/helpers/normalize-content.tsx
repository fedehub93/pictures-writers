import {
  AdBlock,
  AdPositionReference,
  AdPositionPlacement,
  AdItem,
} from "@prisma/client";

export type JSONContent = {
  type?: string;
  attrs?: Record<string, any>;
  content?: JSONContent[];
  marks?: { type: string; attrs?: Record<string, any> }[];
  text?: string;
  [key: string]: any;
};

export type HTMLContent = string;
export type TiptapContent = HTMLContent | JSONContent | JSONContent[] | null;

interface NormalizationOptions {
  adBlocks: (AdBlock & { items: any[] })[];
  totalWordCount?: number;
}

/**
 * Normalizza il contenuto Tiptap aggiungendo nodi pubblicitari
 */
export function normalizeContent(
  content: TiptapContent,
  { adBlocks, totalWordCount }: NormalizationOptions
): TiptapContent {
  if (!content) return null;

  if (typeof content === "string") {
    console.warn(
      "normalizeContent received HTMLContent — skipping normalization."
    );
    return null;
  }

  // --- Caso 1: contenuto è un singolo nodo "doc"
  if (
    !Array.isArray(content) &&
    content.type === "doc" &&
    Array.isArray(content.content)
  ) {
    return {
      ...content,
      content: normalizeNodes(content.content, adBlocks, totalWordCount),
    };
  }

  // --- Caso 2: contenuto è un array o nodo singolo non-doc
  const normalizedContent = normalizeNodes(
    Array.isArray(content) ? content : [content],
    adBlocks,
    totalWordCount
  );

  // Wrappo sempre in un nodo doc, per sicurezza
  return {
    type: "doc",
    content: normalizedContent,
  };
}

/**
 * Ricorsione dei nodi Tiptap, con inserimento degli ads
 */
function normalizeNodes(
  nodes: JSONContent[],
  adBlocks: (AdBlock & { items: AdItem[] })[],
  totalWordCount?: number
): JSONContent[] {
  let headingCount = 0;
  let headingTwoCount = 0;
  let headingThreeCount = 0;
  let headingFourCount = 0;
  let paragraphCount = 0;
  let imageCount = 0;

  const traverse = (nodeList: JSONContent[]): JSONContent[] => {
    const newNodes: JSONContent[] = [];

    for (const node of nodeList) {
      if (node.type === "heading" && node.attrs?.level === 1) headingCount++;
      if (node.type === "heading" && node.attrs?.level === 2) headingTwoCount++;
      if (node.type === "heading" && node.attrs?.level === 3)
        headingThreeCount++;
      if (node.type === "heading" && node.attrs?.level === 4)
        headingFourCount++;

      if (node.type === "paragraph") paragraphCount++;
      if (node.type === "image") imageCount++;

      // Inserisci PRIMA
      const beforeAds = getAdsToInsert(
        adBlocks,
        node.type,
        node.attrs,
        headingCount,
        headingTwoCount,
        headingThreeCount,
        headingFourCount,
        paragraphCount,
        imageCount,
        AdPositionPlacement.BEFORE,
        totalWordCount
      );
      if (beforeAds.length) newNodes.push(...beforeAds);

      // Nodo ricorsivo
      const newNode = { ...node };
      if (node.content) {
        newNode.content = traverse(node.content);
      }
      newNodes.push(newNode);

      // Inserisci DOPO
      const afterAds = getAdsToInsert(
        adBlocks,
        node.type,
        node.attrs,
        headingCount,
        headingTwoCount,
        headingThreeCount,
        headingFourCount,
        paragraphCount,
        imageCount,
        AdPositionPlacement.AFTER,
        totalWordCount
      );
      if (afterAds.length) newNodes.push(...afterAds);
    }

    return newNodes;
  };

  return traverse(nodes);
}

// --- Helpers ---

function getAdsToInsert(
  adBlocks: (AdBlock & { items: AdItem[] })[],
  nodeType: string | undefined,
  nodeAttrs: Record<string, any> | undefined,
  headingCount: number,
  headingTwoCount: number,
  headingThreeCount: number,
  headingFourCount: number,
  paragraphCount: number,
  imageCount: number,
  placement: AdPositionPlacement,
  totalWordCount?: number
): JSONContent[] {
  if (!nodeType) return [];

  const adsToInsert: JSONContent[] = [];

  for (const block of adBlocks) {
    if (block.minWords && totalWordCount && totalWordCount < block.minWords)
      continue;

    const match =
      (block.reference === AdPositionReference.HEADING &&
        block &&
        nodeType === "heading" &&
        nodeAttrs?.level === 1 &&
        headingCount === block.referenceCount) ||
      (block.reference === AdPositionReference.HEADING_2 &&
        block &&
        nodeType === "heading" &&
        nodeAttrs?.level === 2 &&
        headingTwoCount === block.referenceCount) ||
      (block.reference === AdPositionReference.HEADING_3 &&
        block &&
        nodeType === "heading" &&
        nodeAttrs?.level === 3 &&
        headingThreeCount === block.referenceCount) ||
      (block.reference === AdPositionReference.HEADING_4 &&
        block &&
        nodeType === "heading" &&
        nodeAttrs?.level === 4 &&
        headingFourCount === block.referenceCount) ||
      (block.reference === AdPositionReference.PARAGRAPH &&
        nodeType === "paragraph" &&
        paragraphCount === block.referenceCount) ||
      (block.reference === AdPositionReference.IMAGE &&
        nodeType === "image" &&
        imageCount === block.referenceCount);

    if (match && block.placement === placement) {
      adsToInsert.push(buildAdPlaceholder(block));
    }
  }

  return adsToInsert;
}

function buildAdPlaceholder(block: AdBlock & { items: AdItem[] }): JSONContent {
  return {
    type: "adBlock",
    attrs: {
      blockId: block.id,
      layout: block.layoutType,
      title: block.items[0].title,
      description: block.items[0].description,
      src: block.items[0].imageUrl,
      url: block.items[0].url,
    },
  };
}
