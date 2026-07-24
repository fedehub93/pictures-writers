import { Label } from "@/shared/ui/label";

import { Badge } from "@/shared/ui/badge";

import { Checkbox } from "@/shared/ui/checkbox";

import type { FormElementInstance } from "../../../types/core";
import { TipTapRenderer } from "../../../tiptap/tiptap-renderer";

export const CheckboxFieldDesignerComponent = ({
  elementInstance,
}: {
  elementInstance: FormElementInstance<"CheckboxField">;
}) => {
  const {
    label,
    description,
    helperText,
    validation: { required },
  } = elementInstance.properties;

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        <Label className="py-1">{label}</Label>
        {required && (
          <Badge className="h-5 font-normal text-[10px]">Required</Badge>
        )}
      </div>

      <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
        <Checkbox
          checked={false}
          disabled={true}
          className="size-5 accent-primary"
        />

        <div className="space-y-1 self-center leading-none text-sm">
          <TipTapRenderer content={description} />
        </div>
      </div>

      {helperText && (
        <p className="text-muted-foreground text-xs">{helperText}</p>
      )}
    </div>
  );
};
