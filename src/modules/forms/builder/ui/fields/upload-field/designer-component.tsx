import { Label } from "@/shared/ui/label";

import { Badge } from "@/shared/ui/badge";

import type { FormElementInstance } from "../../../types/core";
import { PublicFileUpload } from "@/shared/components/public-file-upload";

export const UploadFieldDesignerComponent = ({
  elementInstance,
}: {
  elementInstance: FormElementInstance<"UploadField">;
}) => {
  const {
    label,

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

      {/* No form id and disabled: the canvas renders the control, never an upload. */}
      <PublicFileUpload size="small" onChange={() => {}} disabled={true} />

      {helperText && (
        <p className="text-muted-foreground text-xs">{helperText}</p>
      )}
    </div>
  );
};
