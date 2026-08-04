import { ReactNode } from "react";

import { CustomField, Field } from "@puckeditor/core";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";

type CustomFieldRenderProps = Parameters<
  NonNullable<CustomField<any>["render"]>
>[0];

export function withAccordionField(
  label: string,
  labelIcon: ReactNode | undefined,
  renderContent: (props: CustomFieldRenderProps) => ReactNode,
  defaultOpen: boolean = false,
): Field {
  const accordionValue = label.toLowerCase().replace(/\s+/g, "-");

  return {
    type: "custom",
    render: (props) => (
      <Accordion
        type="single"
        collapsible
        defaultValue={defaultOpen ? accordionValue : undefined}
        className="w-full border-0"
      >
        <AccordionItem value={accordionValue} className="border-0">
          <AccordionTrigger className="py-0 text-sm font-semibold hover:no-underline">
            <div className="flex items-center gap-x-2">
              {labelIcon && labelIcon}
              {label}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-2">
            {renderContent(props)}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    ),
  };
}
