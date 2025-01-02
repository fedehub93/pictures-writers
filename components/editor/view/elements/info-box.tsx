import {
  Node,
  Replace,
  createElementNodeMatcher,
  createElementTransform,
} from "slate-to-react";

import { CustomText } from "@/components/editor";
import { cn } from "@/lib/utils";

type InfoBox = Replace<
  Node<"info-box">,
  {
    data: {
      icon: string;
    };
    children: CustomText[];
  }
>;

export const isInfoBox = createElementNodeMatcher<InfoBox>(
  (node): node is InfoBox => node.type === "info-box"
);

export const InfoBoxElement = createElementTransform(
  isInfoBox,
  ({ key, element, attributes, children }) => {
    return (
      <div
        key={key}
        className={cn(
          "post__info-box",
          element.align === "left" && "text-left",
          element.align === "center" && "text-center",
          element.align === "right" && "text-right"
        )}
      >
        <div className="post__info-box-icon">{element.data.icon}</div>

        {children}
      </div>
    );
  }
);
