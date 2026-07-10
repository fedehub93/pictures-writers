import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";

import { DropData, type FormElementInstance } from "../../../types";
import { useSortable } from "@dnd-kit/react/sortable";
import { Button } from "@/shared/ui/button";
import { GripIcon, XIcon } from "lucide-react";

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
