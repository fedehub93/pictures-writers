import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqSectionProps {
  faqs: { question: string; answer: string }[];
}

export const FaqSection = ({ faqs }: FaqSectionProps) => {
  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div className="text-center">
        <div className="text-4xl uppercase font-extralight">FAQ</div>
        <p className="mt-1 text-muted-foreground">
          Risposte alle domande più richieste.
        </p>
      </div>

      <div className="max-w-3xl mt-6">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem value={`item-${index}`} key={faq.question}>
              <AccordionTrigger className="text-lg font-semibold text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};
