// modules/forms/builder/ui/layouts/grid/form-component.tsx
"use client";

import { FormLayoutInstance } from "../../../types";
import { FormNodeRenderer } from "../../../runner/form-node-renderer";
import { FieldGroup } from "@/shared/ui/field";

export function GridFormComponent({
  elementInstance,
}: {
  elementInstance: FormLayoutInstance<"Grid">;
}) {
  const { properties, children } = elementInstance;

  const columns = properties.columns || 1;
  const gap = properties.gap || 16;

  return (
    <FieldGroup
      className="@container/field-group w-full border-none p-0 m-0"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: `${gap}px`,
      }}
    >
      {children.map((childNode) => (
        <div key={childNode.id} className="w-full">
          <FormNodeRenderer node={childNode} />
        </div>
      ))}
    </FieldGroup>
  );
}
