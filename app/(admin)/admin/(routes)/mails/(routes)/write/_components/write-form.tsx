"use client";

import * as z from "zod";
import { EmailTemplate } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { CustomElement, useForm } from "react-hook-form";
import { Descendant } from "slate";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Editor from "@/components/editor";
import { useState } from "react";
import { CustomEditorHelper } from "@/components/editor/utils/custom-editor";

interface WriteFormProps {
  templates: EmailTemplate[];
}

const formSchema = z.object({
  emails: z.string().min(1, {
    message: "Email is required",
  }),
  subject: z.string().optional(),
  emailTemplateId: z.string().optional(),
});

export const WriteForm = ({ templates }: WriteFormProps) => {
  const [body, setBody] = useState<Descendant[]>([
    { type: "paragraph", children: [{ text: "" }] },
  ]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emails: "",
      subject: "",
      emailTemplateId: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = (values: z.infer<typeof formSchema>) => {};

  const onChangeBody = (value: Descendant[]) => {
    console.log(CustomEditorHelper.serializeHTML(value));
  };

  const onValueChangeBody = (value: Descendant[]) => {
    console.log("onvaluechangebody");
  };

  return (
    <>
      <Form {...form}>
        <form className="flex flex-col gap-y-4 py-4">
          <FormField
            control={form.control}
            name="emails"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input disabled={isSubmitting} placeholder="To" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-wrap gap-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem className="min-w-40 flex-auto">
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="Subject"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emailTemplateId"
              render={({ field }) => (
                <FormItem className="flex-auto">
                  <Select onValueChange={field.onChange} defaultValue="">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an email template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.name} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
      <div className="h-full">
        <Editor
          onChange={onChangeBody}
          onValueChange={onValueChangeBody}
          value={body}
        >
          <Editor.Toolbar showEmbedButton={false} />
          <Editor.Input onHandleIsFocused={() => {}} />
        </Editor>
      </div>
    </>
  );
};
