"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckIcon, XIcon, Loader2Icon, Edit2Icon } from "lucide-react";

import { Input } from "@/shared/ui/input";
import { Form } from "@/shared/ui/form";
import { cn } from "@/shared/lib/utils";
import { Field } from "@/shared/ui/field";

interface EditableFieldProps {
  initialValue: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  textClassName?: string;
  required?: boolean;
  disabled?: boolean;
}

export const EditableField = ({
  initialValue,
  onSave,
  placeholder = "Click to edit...",
  textClassName,
  required = false,
  disabled = false,
}: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const formSchema = z.object({
    value: required
      ? z.string().min(1, "Required")
      : z.string().optional().nullable(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: initialValue,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: FormValues) => {
    try {
      await onSave(data.value || "");
      setIsEditing(false);
    } catch (error) {
      // Gestione dell'errore delegata alla callback onSave
    }
  };

  const onCancel = () => {
    form.reset({ value: initialValue });
    setIsEditing(false);
  };

  // Funzione che gestisce la perdita del focus
  const handleBlur = (e: React.FocusEvent<HTMLFormElement>) => {
    // Se il nuovo elemento su cui si è cliccato si trova *dentro* il form (es. il bottone check o x),
    // non uscire dalla modalità di modifica.
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    // Altrimenti, se si clicca fuori, annulla e torna in visualizzazione
    onCancel();
  };

  if (isEditing) {
    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          onBlur={handleBlur}
          className="inline-block w-full max-w-full animate-in fade-in zoom-in-95 duration-200"
        >
          <Controller
            control={form.control}
            name="value"
            render={({ field }) => (
              <Field>
                <div className="relative flex items-center w-full">
                  <Input
                    {...field}
                    value={field.value || ""}
                    className={cn(
                      "border-0 shadow-none focus-visible:ring-0 rounded-none",
                      "h-auto p-1 -ml-2 pr-16 border-b border-border bg-transparent w-full",
                      textClassName,
                    )}
                    placeholder={placeholder}
                    disabled={disabled || isSubmitting}
                    autoFocus
                  />

                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="submit"
                      disabled={
                        disabled || isSubmitting || (required && !field.value)
                      }
                      className="p-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 outline-none cursor-pointer"
                    >
                      {isSubmitting ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <CheckIcon className="size-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={onCancel}
                      disabled={disabled || isSubmitting}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 outline-none cursor-pointer"
                    >
                      <XIcon className="size-4" />
                    </button>
                  </div>
                </div>
              </Field>
            )}
          />
        </form>
      </Form>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !disabled && setIsEditing(true)}
      onKeyDown={(e) => e.key === "Enter" && !disabled && setIsEditing(true)}
      className={cn(
        "relative inline-block max-w-full group p-1 -ml-2 rounded-md border-b border-transparent transition-all duration-200",
        disabled ? "opacity-70 cursor-not-allowed" : "cursor-text!",
      )}
    >
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Edit2Icon className="size-4 text-muted-foreground" />
      </div>

      <div className={cn("pr-8 wrap-break-words", textClassName)}>
        {initialValue || (
          <span className="text-muted-foreground/70 italic">{placeholder}</span>
        )}
      </div>
    </div>
  );
};
