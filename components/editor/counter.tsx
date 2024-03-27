import React, { useState, useEffect } from "react";
import { Descendant, Element } from "slate";

const countWords = (content: Descendant[]) => {
  let count = 0;
  content.forEach((value) => {
    if (Element.isElement(value) && !Element.isElement(value.children[0])) {
      let s = value.children[0].text;
      if (s.length != 0 && s.match(/\b[-?(\w+)?]+\b/gi)) {
        s = s.replace(/(^\s*)|(\s*$)/gi, "");
        s = s.replace(/[ ]{2,}/gi, " ");
        s = s.replace(/\n /, "\n");
        count += s.split(" ").length;
      }
    }
  });
  return count;
};

const countChars = (content: Descendant[]) => {
  let count = content.length > 1 ? content.length - 1 : 0;
  content.forEach((value) => {
    if (Element.isElement(value) && !Element.isElement(value.children[0])) {
      count += value["children"][0]["text"].length;
    }
  });
  return count;
};

interface CounterProps {
  value: Descendant[];
}

export const Counter = ({ value }: CounterProps) => {
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    setWordCount(countWords(value));
    setCharCount(countChars(value));
  }, [value]);

  return (
    <div className="flex items-center justify-between w-full pt-4">
      <div className="text-sm text-muted-foreground">{wordCount} words</div>
      <div className="text-sm text-muted-foreground">
        {charCount} characters
      </div>
    </div>
  );
};
