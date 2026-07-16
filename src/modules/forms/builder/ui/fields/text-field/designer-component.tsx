import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";

import { Badge } from "@/shared/ui/badge";

import type { FormElementInstance } from "../../../types";

export const DesignerComponent = ({
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
        <Label>{label}</Label>
        {required && <Badge>Required</Badge>}
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
