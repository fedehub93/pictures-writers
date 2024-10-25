"use client";

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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import MultipleSelector from "@/components/multi-select";
import { useModal } from "@/app/(admin)/_hooks/use-modal-store";

const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const formSchema = z.object({
  interactions: z.array(optionSchema).optional(),
});

export const ImportAudienceContacts = () => {
  const { isOpen, onClose, onCallback, data, type } = useModal();

  const isModalOpen = isOpen && type === "importAudienceContacts";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      interactions: data?.interactions,
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      onCallback(values);
      form.reset();
    } catch (error) {
      console.log(error);
    } finally {
      onClose();
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden h-72">
        <DialogHeader>
          <DialogTitle className="text-xl py-4 px-6 font-normal">
            Import contacts
          </DialogTitle>
          <Separator />
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-8">
            <div className="space-y-8 px-6">
              <FormField
                control={form.control}
                name="interactions"
                render={({ field }) => (
                  <FormItem>
                    <div className="text-sm">Interactions</div>
                    <FormControl>
                      <MultipleSelector
                        {...field}
                        options={data.interactions.map(
                          (interaction: string) => ({
                            label: interaction,
                            value: interaction,
                          })
                        )}
                        placeholder="Select interactions..."
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
                Import
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
