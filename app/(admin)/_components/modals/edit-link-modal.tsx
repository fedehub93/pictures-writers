"use client";

import { useEffect } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
import { Button } from "@/components/ui/button";
import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  text: z.string().min(1, {
    message: "Link text is required",
  }),
  target: z.string().min(1, {
    message: "Link target is required",
  }),
  follow: z.boolean().default(false).optional(),
});

export const EditLinkModal = () => {
  const { isOpen, onClose, onCallback, data, type } = useModal();

  const isModalOpen = isOpen && type === "editLink";

  const text = data?.text || "";
  const target = data?.target || "";
  const follow = (data?.follow ? data.follow : false) as boolean;

  const isExternalLink =
    target.includes("http://") || target.includes("https://");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: text || "",
      target: target || "",
      follow,
    },
  });

  useEffect(() => {
    form.setValue("text", text);
    form.setValue("target", target);
    form.setValue("follow", !isExternalLink ? true : follow);
  }, [form, text, target, follow, isOpen, isExternalLink]);

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      onCallback(values);
      form.reset();
      onClose();
    } catch (error) {
      console.log(error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl py-4 px-6 font-normal">
            Edit Link
          </DialogTitle>
          <Separator />
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-8">
            <div className="space-y-8 px-6">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <div className="text-sm">Link Text</div>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="Google"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem>
                    <div className="text-sm">Link Target</div>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="https://google.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="follow"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isExternalLink}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Follow attribute</FormLabel>
                      <FormDescription>
                        You can manage follow attribute for SEO purpose.
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="px-6 py-4">
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isLoading}
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
