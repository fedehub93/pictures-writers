import type { FormRootInstance } from "../../builder/types/core";

import { SubmissionNodeRenderer } from "./submission-node-renderer";

interface FormSubmissionViewerProps {
  rootInstance: FormRootInstance;
  submittedData: Record<string, any>;
}

export function FormSubmissionViewer({
  rootInstance,
  submittedData,
}: FormSubmissionViewerProps) {
  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <div className="w-full h-12 flex items-center justify-between gap-x-2">
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl">Submission Details</h1>
        </div>
      </div>

      {rootInstance.children.map((child) => (
        <SubmissionNodeRenderer
          key={child.id}
          elementInstance={child}
          submittedData={submittedData}
        />
      ))}
    </div>
  );
}
