"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import type { PagesGetMany } from "@/modules/pages/types";

import { PageDetailsForm } from "./details-form";
import { PageSeoForm } from "./seo-form";

interface PageSettingsProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: PagesGetMany["items"][number];
}

export const PageSettings = ({
  onSuccess,
  onCancel,
  initialValues,
}: PageSettingsProps) => {
  return (
    <Tabs defaultValue="overview">
      <TabsList className="mb-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="seo">SEO</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <PageDetailsForm
          onSuccess={onSuccess}
          onCancel={onCancel}
          initialValues={{
            ...initialValues,
            id: initialValues?.id ?? "",
            rootId: initialValues?.rootId ?? "",
            slug: initialValues?.slug ?? "",
            title: initialValues?.title ?? "",
          }}
        />
      </TabsContent>
      <TabsContent value="seo">
        <PageSeoForm
          onSuccess={onSuccess}
          onCancel={onCancel}
          initialValues={{
            ...initialValues?.seo,
            id: initialValues?.id ?? "",
            rootId: initialValues?.rootId ?? "",
            noIndex: initialValues?.seo ? initialValues.seo?.noIndex : false,
            noFollow: initialValues?.seo ? initialValues.seo?.noFollow : false,
          }}
        />
      </TabsContent>
    </Tabs>
  );
};
