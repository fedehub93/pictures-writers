import type { FormDisplayInstance } from "../../../types/core";
import { TipTapRenderer } from "../../../tiptap/tiptap-renderer";

export const ParagraphDesignerComponent = ({
  elementInstance,
}: {
  elementInstance: FormDisplayInstance<"Paragraph">;
}) => {
  const { content } = elementInstance.properties;

  return (
    <div className="flex flex-col gap-2 w-full">
      <TipTapRenderer content={content} />
    </div>
  );
};
