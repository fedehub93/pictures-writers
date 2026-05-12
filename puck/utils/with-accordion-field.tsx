import { ReactNode } from "react";

import { CustomField, Field } from "@puckeditor/core";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Assicurati del percorso corretto

// Estraiamo il tipo delle props che Puck passa alla funzione render di un custom field
type CustomFieldRenderProps = Parameters<
  NonNullable<CustomField<any>["render"]>
>[0];

export function withAccordionField(
  label: string,
  labelIcon: ReactNode | undefined,
  renderContent: (props: CustomFieldRenderProps) => ReactNode,
  defaultOpen: boolean = false, // Puoi decidere se aprirlo di default o no
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
            {/* Qui viene iniettato il contenuto specifico del field! */}
            {renderContent(props)}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    ),
  };
}
