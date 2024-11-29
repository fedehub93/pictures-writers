"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScriptStrategy } from "@/types";
import { useSettings } from "../../_components/providers/settings-provider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const formSchema = z.object({
  scripts: z.array(
    z.object({
      name: z.string({ message: "Il nome è obbligatorio" }),
      src: z.string().optional(),
      strategy: z.any(),
      content: z.string().optional(),
      enabled: z.boolean(),
    })
  ),
});

type FormSchemaType = z.infer<typeof formSchema>;

const MainSettingsPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { settings } = useSettings();
  const scripts = settings?.scripts || [];

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scripts: [...scripts],
    },
  });

  const { control } = form;
  const { isSubmitting } = form.formState;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "scripts",
  });

  const onAddScript = () => {
    append({
      name: "",
      src: "",
      strategy: ScriptStrategy.afterInteractive,
      content: "",
      enabled: true,
    });
  };

  const onRemoveScript = (index: number) => {
    remove(index);
  };

  const onSubmit = async (data: FormSchemaType) => {
    try {
      setIsLoading(true);

      await axios.patch(`/api/settings`, data);

      toast.success("Settings updated successfully");
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
      setIsLoading(false);
    }
  };
  return (
    <div className="p-4 w-full rounded-md flex flex-col gap-y-8">
      <div className="flex flex-col flex-1">
        <h3 className="text-lg font-bold space-y-0.5">Scripts</h3>
        <p className="text-muted-foreground text-sm">
          Add scripts to the application that will be inserted after body.
        </p>
      </div>
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Accordion type="single" collapsible className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.name} className="flex gap-x-4 ">
                <AccordionItem
                  value={field.id}
                  className="flex-1 space-y-4 border px-4 py-0 rounded-md"
                >
                  <AccordionTrigger>
                    {field.name}
                  </AccordionTrigger>

                  <AccordionContent className="space-y-4 px-2">
                    <div className="flex gap-x-4 w-full">
                      <FormField
                        control={form.control}
                        name={`scripts.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome script" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`scripts.${index}.src`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>URL</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://example.com/script.js"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`scripts.${index}.strategy`}
                        render={({ field }) => (
                          <FormItem className="md:min-w-52">
                            <FormLabel>Strategy</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleziona una strategia" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.values(ScriptStrategy).map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {s}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex items-center gap-x-4 w-full">
                      <FormField
                        control={form.control}
                        name={`scripts.${index}.content`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Inline content..."
                                rows={
                                  !!form.getValues(`scripts.${index}.src`)
                                    ? 1
                                    : 10
                                }
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>Only if no URL.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`scripts.${index}.enabled`}
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Enabled</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <div className="text-right">
                  <Button
                    size="icon"
                    variant="destructive"
                    type="button"
                    onClick={() => onRemoveScript(index)}
                  >
                    <X />
                  </Button>
                </div>
              </div>
            ))}
          </Accordion>
          <div className="flex items-center gap-x-2 justify-start">
            <Button type="button" onClick={onAddScript} variant="outline">
              Add a script
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              Save
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default MainSettingsPage;
