import {
  Node,
  Replace,
  createElementNodeMatcher,
  createElementTransform,
} from "slate-to-react";

import { CustomText } from "@/components/editor";

type NumberedList = Replace<
  Node<"ordered-list">,
  {
    children: CustomText[];
  }
>;

export const isNumbered = createElementNodeMatcher<NumberedList>(
  (node): node is NumberedList => node.type === "ordered-list"
);

export const NumberedList = createElementTransform(
  isNumbered,
  ({ key, element, attributes, children }) => (
    <div key={key} className="max-w-md border border-gray-500 bg-gray-100 p-2 ">
      <div className="mb-4 font-bold">Indice dei contenuti</div>
      <ol
        className="list-decimal listind pl-6 [&>li>a]:font-bold [&>li>a]:no-underline [&>li>a]:mb-0 "
        type="1"
      >
        {children}
      </ol>
    </div>
  )
);
