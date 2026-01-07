"use client";

import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import {
  AdLayoutType,
  AdPositionPlacement,
  AdPositionReference,
} from "@/prisma/generated/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { adBlockFormSchema, AdBlockFormValues } from "@/schemas/ads";

import { GenericInput } from "@/components/form-component/generic-input";
import { GenericRadioGroup } from "@/components/form-component/generic-radio-group";

import { useModal } from "../../_hooks/use-modal-store";

export const CreateAdBlockModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const router = useRouter();

  const isModalOpen = isOpen && type === "createAdBlock";
  const campaignId = data?.campaignId || null;

  const form = useForm<AdBlockFormValues>({
    resolver: zodResolver(adBlockFormSchema),
    defaultValues: {
      label: "",
      layoutType: AdLayoutType.SINGLE,
      isActive: false,
      minWords: 500,
      placement: AdPositionPlacement.BEFORE,
      reference: AdPositionReference.HEADING,
      referenceCount: 1,
      excludedPostIds: [],
      excludedCategoryIds: [],
      excludedTagIds: [],
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: AdBlockFormValues) => {
    try {
      await axios.post(`/api/admin/ads/${campaignId}/blocks`, values);

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
            Create block
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 px-6"
          >
            <GenericInput control={form.control} name="label" label="Name" />
            <GenericRadioGroup
              control={form.control}
              name="layoutType"
              label="Layout"
              options={[
                AdLayoutType.SINGLE,
                AdLayoutType.GRID,
                AdLayoutType.CAROUSEL,
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
