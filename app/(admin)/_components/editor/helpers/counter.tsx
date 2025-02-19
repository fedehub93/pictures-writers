"use client";

import React, { useState, useEffect } from "react";
import { Descendant, Element, Text } from "slate";

const countWords = (nodes: Descendant[]): number => {
  let count = 0;

  const traverseNodes = (nodes: Descendant[]) => {
    nodes.forEach((node) => {
      if (Text.isText(node)) {
        // Conta le parole del nodo Text
        let text = node.text;
        if (text.length > 0) {
          text = text.replace(/(^\s*)|(\s*$)/gi, ""); // Rimuove spazi iniziali e finali
          text = text.replace(/[ ]{2,}/gi, " "); // Sostituisce più spazi con uno
          text = text.replace(/\n /, "\n"); // Gestisce ritorni a capo seguiti da spazio

          // Conta le parole
          const words = text.match(/\b[-?(\w+)?]+\b/gi) || [];
          count += words.length;
        }
      } else if (Element.isElement(node)) {
        // Se il nodo è un elemento, esplora i suoi figli
        traverseNodes(node.children);
      }
    });
  };

  traverseNodes(nodes);
  return count;
};

const countChars = (nodes: Descendant[]): number => {
  let count = 0;

  const traverseNodes = (nodes: Descendant[]) => {
    nodes.forEach((node) => {
      if (Text.isText(node)) {
        // Conta i caratteri del nodo Text
        count += node.text.length;
      } else if (Element.isElement(node)) {
        // Se il nodo è un elemento, esplora i suoi figli
        traverseNodes(node.children);
      }
    });
  };

  traverseNodes(nodes);
  return count;
};

interface CounterProps {
  value: Descendant[];
}

export const Counter = ({ value }: CounterProps) => {
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    setCharCount(countChars(value));
    setWordCount(countWords(value));
  }, [value]);

  return (
    <div className="flex items-center justify-between w-full pt-4">
      <div className="text-sm text-muted-foreground">
        {charCount} characters
      </div>
      <div className="text-sm text-muted-foreground">{wordCount} words</div>
    </div>
  );
};
