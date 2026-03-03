"use client";

import { PenIcon, SettingsIcon } from "lucide-react";
import { Control, useController } from "react-hook-form";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { ProductType } from "@/generated/prisma";
import { ProductFormValues } from "@/schemas/product";
import { ProductAffiliateDialog } from "./affiliate/product-affiliate-dialog";
import { tr } from "date-fns/locale";

interface ProductMetadataProps {
  control: Control<ProductFormValues>;
  isSubmitting: boolean;
  data: any;
  productType: ProductType;
}

export const ProductMetadata = ({
  control,
  isSubmitting,
  data,
  productType,
}: ProductMetadataProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSubmit = (values:any) => {
    console.log(values);
  };
  return (
    <>
      {productType === ProductType.AFFILIATE && (
        <ProductAffiliateDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmit}
          defaultValues={data}
        />
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex gap-x-2 items-center">
            <SettingsIcon className="size-4" />
            Metadata
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Configura i dettagli specifici per questo servizio, come il target,
            i prezzi dei competitor e le caratteristiche incluse.
          </p>
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              setDialogOpen(true);
            }}
          >
            <PenIcon className="size-4" />
            Gestisci metadata
          </Button>
        </CardContent>
      </Card>
    </>
  );
};
