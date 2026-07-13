import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";

import { type FormElementInstance } from "../../../types";

export const DesignerComponent = ({
  elementInstance,
}: {
  elementInstance: FormElementInstance<"TextField">;
}) => {
  const { label, placeholder, helperText } = elementInstance.properties;

  return (
    <div className="flex flex-col gap-2 w-full">
      <Label>{label}</Label>
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
