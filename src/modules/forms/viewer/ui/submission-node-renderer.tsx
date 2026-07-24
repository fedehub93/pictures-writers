import type { FormNodeDynamicInstance } from "../../builder/types/core";

import { FieldDataViewer } from "./field-data-viewer";

interface SubmissionNodeRendererProps {
  elementInstance: FormNodeDynamicInstance;
  submittedData: Record<string, any>;
}

export function SubmissionNodeRenderer({
  elementInstance,
  submittedData,
}: SubmissionNodeRendererProps) {
  if (elementInstance.isContainer) {
    if (elementInstance.type === "Grid") {
      const { columns = 2, gap = 4, label } = elementInstance.properties;

      return (
        <div className="w-full">
          {!elementInstance.isContainer && label && (
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              {label}
            </h4>
          )}
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gap: `${gap * 0.25}rem`,
            }}
          >
            {elementInstance.children.map((child) => (
              <div key={child.id} className="col-span-1">
                <SubmissionNodeRenderer
                  elementInstance={child}
                  submittedData={submittedData}
                />
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  }

  if (
    elementInstance.type === "Paragraph" ||
    elementInstance.type === "Button"
  ) {
    return null;
  }

  const fieldInstance = elementInstance;
  const fieldName = fieldInstance.properties.name;

  const value = submittedData[fieldName];

  return <FieldDataViewer instance={fieldInstance} value={value} />;
}
