import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";

import { Badge } from "@/shared/ui/badge";

import type { FormElementInstance } from "../../../types/core";

export const TextFieldDesignerComponent = ({
  elementInstance,
}: {
  elementInstance: FormElementInstance<"TextField">;
}) => {
  const {
    label,
    placeholder,
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
      <Input
        readOnly
        disabled
        placeholder={placeholder}
        className="disabled:cursor-auto"
      />
      {helperText && (
        <p className="text-muted-foreground text-xs">{helperText}</p>
      )}
    </div>
  );
};
