import { Label } from "@/shared/ui/label";

import { Badge } from "@/shared/ui/badge";

import type { FormElementInstance } from "../../../types/core";
import { FileUploadButton } from "@/shared/components/file-upload-button";

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

      <FileUploadButton
        endpoint="submissionAttachments"
        size="small"
        onChange={() => {}}
        disabled={true}
      />

      {helperText && (
        <p className="text-muted-foreground text-xs">{helperText}</p>
      )}
    </div>
  );
};
