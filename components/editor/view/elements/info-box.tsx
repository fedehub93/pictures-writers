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
          "relative mb-8 bg-violet-100 p-4 py-6 pl-12 rounded-lg [&>p]:mb-4 min-h-14",
          element.align === "left" && "text-left",
          element.align === "center" && "text-center",
          element.align === "right" && "text-right"
        )}
      >6ò6
      ècxxxà
        <div className="absolute top-3 left-2 text-lg p-2ffffffffffffffffffffffffffffffffffffffffffffffdddddddddddddddddddy">
          {element.data.icon}
        </div>

        {children}
      </div>
    );
  }
);
