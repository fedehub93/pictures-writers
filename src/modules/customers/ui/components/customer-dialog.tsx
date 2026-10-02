"use client";

import { ResponsiveDialog } from "@/shared/components/responsive-dialog";

import { useOpenCustomer } from "../../hooks/use-open-customer";

import { CustomerForm } from "./customer-form";

export const CustomerDialog = () => {
  const { isOpen, onClose, data } = useOpenCustomer();

  return (
    <ResponsiveDialog
      title={data ? "Edit customer" : "New customer"}
      description="Manage the customer's contact and billing details."
      open={isOpen}
      onOpenChange={onClose}
    >
      <CustomerForm
        onSuccess={onClose}
        onCancel={onClose}
        initialValues={data}
      />
    </ResponsiveDialog>
  );
};
