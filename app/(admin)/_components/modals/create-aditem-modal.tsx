"use client";

import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { AdItemSourceType } from "@/prisma/generated/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { adItemFormSchema, AdItemFormValues } from "@/schemas/ads";

import { GenericInput } from "@/components/form-component/generic-input";
import { GenericRadioGroup } from "@/components/form-component/generic-radio-group";

import { useModal } from "../../_hooks/use-modal-store";

export const CreateAdItemModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const router = useRouter();

  const isModalOpen = isOpen && type === "createAdItem";
  const campaignId = data?.campaignId || null;
  const blockId = data?.blockId || null;

  const form = useForm<AdItemFormValues>({
    resolver: zodResolver(adItemFormSchema),
    defaultValues: {
      title: "",
      sourceType: AdItemSourceType.STATIC,
      description: "",
      imageUrl: "",
      url: "",
      postRootId: "",
      productRootId: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: AdItemFormValues) => {
    try {
      await axios.post(
        `/api/admin/ads/${campaignId}/blocks/${blockId}/items`,
        values
      );

      form.reset();
      router.refresh();
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
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Create item
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 px-6"
          >
            <GenericInput control={form.control} name="title" label="Name" />
            <GenericRadioGroup
              control={form.control}
              name="sourceType"
              label="Source"
              options={[
                AdItemSourceType.STATIC,
                AdItemSourceType.POST,
                AdItemSourceType.PRODUCT,
              ]}
            />
            <DialogFooter className="px-6 py-4">
              <Button disabled={isLoading}>Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
