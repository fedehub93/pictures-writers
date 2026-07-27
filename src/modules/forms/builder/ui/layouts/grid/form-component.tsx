// modules/forms/builder/ui/layouts/grid/form-component.tsx
"use client";

import { FieldGroup } from "@/shared/ui/field";

import type { FormLayoutInstance } from "../../../types/core";
import { FormNodeRenderer } from "../../../runner/form-node-renderer";

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
      className="@container/field-group w-full border-none p-0 m-0 grid grid-cols-1 md:grid-cols-[repeat(var(--dynamic-cols),minmax(0,1fr))]"
      style={
        {
          "--dynamic-cols": columns,
          gap: `${gap}px`,
        } as React.CSSProperties
      }
    >
      {children.map((childNode) => (
        <div key={childNode.id} className="w-full">
          <FormNodeRenderer node={childNode} />
        </div>
      ))}
    </FieldGroup>
  );
}
