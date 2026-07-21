import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { GenericInput } from "@/shared/components/form-component/generic-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Separator } from "@/shared/ui/separator";

import type { FormRootInstance } from "../../../types/core";
import { useDesigner } from "../../../store/designer-provider";

import { PropertiesFormSchemaType, propertiesSchema } from "./schemas";

export const RootPropertiesComponent = ({
  elementInstance,
}: {
  elementInstance: FormRootInstance;
}) => {
  const { id, properties } = elementInstance;
  const { updateNodeProperties } = useDesigner((state) => state);

  const form = useForm<PropertiesFormSchemaType>({
    resolver: zodResolver(propertiesSchema),
    mode: "onChange", // Cambiato da onBlur a onChange per un autosave reattivo
    values: properties,
  });

  const onApplyChanges = (values: PropertiesFormSchemaType) => {
    updateNodeProperties(id, values);
  };

  useEffect(() => {
    const subscription = form.watch(() => {
      setTimeout(() => {
        form.handleSubmit(onApplyChanges)();
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, [form, id]);

  const submissionType = form.watch("submission.onSuccess.type");

  const handleTypeChange = (newType: "toast" | "redirect") => {
    if (newType === "toast") {
      form.setValue(
        "submission.onSuccess",
        {
          type: "toast",
          successMessage: "Modulo inviato con successo!",
        },
        { shouldValidate: true },
      );
    } else {
      form.setValue(
        "submission.onSuccess",
        {
          type: "redirect",
          url: "",
        },
        { shouldValidate: true },
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Azione di Invio (Submit)</h3>

          <FormField
            control={form.control}
            name="submission.onSuccess.type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cosa succede dopo l'invio?</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(val) =>
                    handleTypeChange(val as "toast" | "redirect")
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Scegli un'azione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="toast">
                      Mostra un Messaggio (Toast)
                    </SelectItem>
                    <SelectItem value="redirect">
                      Reindirizza a un'altra pagina
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {submissionType === "toast" && (
            <div className="space-y-4 p-4 border rounded-md bg-muted/20 animate-in fade-in-0 slide-in-from-top-2">
              <GenericInput
                name="submission.onSuccess.successMessage"
                control={form.control}
                label="Messaggio di Successo"
                placeholder="Grazie per aver compilato il form!"
              />
            </div>
          )}

          {submissionType === "redirect" && (
            <div className="space-y-4 p-4 border rounded-md bg-muted/20 animate-in fade-in-0 slide-in-from-top-2">
              <GenericInput
                name="submission.onSuccess.url"
                control={form.control}
                label="URL di Destinazione"
                placeholder="es. /thank-you oppure https://sito.com"
              />
            </div>
          )}
        </div>
      </form>
    </Form>
  );
};
