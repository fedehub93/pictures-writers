import { ReactEditor, RenderElementProps, useSlateStatic } from "slate-react";
import Link from "next/link";

import { EmbeddedAffiliateLinkElement } from "@/components/editor";
import { Button } from "@/components/ui/button";

interface AffiliateLinkProps extends RenderElementProps {
  element: EmbeddedAffiliateLinkElement;
}

export const AffiliateLink = ({
  attributes,
  children,
  element,
}: AffiliateLinkProps) => {
  const editor = useSlateStatic();
  const path = ReactEditor.findPath(editor, element);
  const { url, label } = element;

  return (
    <div {...attributes}>
      <div contentEditable={false}>
        <Link href="#" className="flex justify-center">
          <Button>{label}</Button>
        </Link>
      </div>
      {children}
    </div>
  );
};
