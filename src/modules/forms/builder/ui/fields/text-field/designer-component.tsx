import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";

import { type FormElementInstance } from "../../../types";

export const DesignerComponent = ({
  elementInstance,
}: {
  elementInstance: FormElementInstance<"TextField">;
}) => {
  const { label, placeHolder, helperText } = elementInstance.properties;

  return (
    <div className="flex flex-col gap-2 w-full">
      <Label>{label}</Label>
      <Input readOnly disabled placeholder={placeHolder} />
      {helperText && (
        <p className="text-muted-foreground text-xs">{helperText}</p>
      )}
    </div>
  );
};
