import React from "react";
import { CustomText } from "../slate-renderer";

export const RenderLeaf = ({ leaf }: { leaf: CustomText }) => {
  let elements = leaf.text.split("\n").map((part, index) => (
    <React.Fragment key={index}>
      {index > 0 && <br />}
      {part}
    </React.Fragment>
  ));

  if (leaf.bold) {
    elements = [<strong key="bold">{elements}</strong>];
  }
  if (leaf.italic) {
    elements = [<em key="italic">{elements}</em>];
  }
  if (leaf.underline) {
    elements = [<u key="underline">{elements}</u>];
  }

  return <>{elements}</>;
};
