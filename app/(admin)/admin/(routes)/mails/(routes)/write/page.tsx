"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Editor from "@/components/editor";
import { Descendant } from "slate";

const formSchema = z.object({
  emails: z.string().min(1, {
    message: "Email is required",
  }),
  subject: z.string().optional(),
  body: z.custom<Descendant[]>(),
});

const WriteMail = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emails: "",
      subject: "",
      body: [{ type: "paragraph", children: [{ text: "" }] }],
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onChangeBody = (value: Descendant[]) => {
    console.log("onchangebody");
  };

  const onValueChangeBody = (value: Descendant[]) => {
    console.log("onvaluechangebody");
  };

  return (
    <div className="py-2 px-6 mx-auto h-full flex flex-col overflow-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Write Email</h1>
      </div>
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
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
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
        </form>
      </Form>
      <div className="h-full">
        <Editor
          onChange={onChangeBody}
          onValueChange={onValueChangeBody}
          value={[{ type: "paragraph", children: [{ text: "" }] }]}
        >
          <Editor.Toolbar />
          <Editor.Input onHandleIsFocused={() => {}} />
        </Editor>
      </div>
    </div>
  );
};

export default WriteMail;
