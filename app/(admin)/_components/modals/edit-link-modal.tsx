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
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  text: z.string().min(1, {
    message: "Link text is required",
  }),
  target: z.string().min(1, {
    message: "Link target is required",
  }),
});

export const EditLinkModal = () => {
  const { isOpen, onClose, onCallback, data, type } = useModal();

  const isModalOpen = isOpen && type === "editLink";

  const text = data?.text || "";
  const target = data?.target || "";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: text || "",
      target: target || "",
    },
  });

  useEffect(() => {
    form.setValue("text", text);
    form.setValue("target", target);
  }, [form, text, target, isOpen]);

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
