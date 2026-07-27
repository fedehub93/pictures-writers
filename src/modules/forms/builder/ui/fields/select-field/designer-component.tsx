import { Label } from "@/shared/ui/label";
import { Select, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Badge } from "@/shared/ui/badge";

import type { FormElementInstance } from "../../../types/core";

export const SelectFieldDesignerComponent = ({
  elementInstance,
}: {
  elementInstance: FormElementInstance<"SelectField">;
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
      <Select>
        <SelectTrigger disabled className="w-full disabled:cursor-auto">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </Select>
      {helperText && (
        <p className="text-muted-foreground text-xs">{helperText}</p>
      )}
    </div>
  );
};
