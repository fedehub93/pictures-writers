import { Seo } from "@prisma/client";

import { TitleForm } from "@/app/(admin)/general-fields/title-form";
import { DescriptionForm } from "@/app/(admin)/general-fields/description-form";

import { NoIndexForm } from "./no-index-form";
import { NoFollowForm } from "./no-follow-form";
import { InputSeoForm } from "./input-seo-form";
import { SeoContentTypeApi, SeoField } from "./types";

interface SeoProps {
  initialData: Seo | null;
  contentType: SeoContentTypeApi;
  contentRootId: string;
  contentId: string;
}

export const SeoEditView = ({
  initialData,
  contentType,
  contentRootId,
  contentId,
}: SeoProps) => {
  if (!initialData) {
    return <div>No seo data for this item.</div>;
  }

  return (
    <div className="flex flex-col gap-y-4">
      <InputSeoForm
        initialData={initialData}
        fieldName={SeoField.Title}
        label="SEO Title"
        placeholder="e.g. How to write a screenplay"
        apiUrl={`/api/${contentType}/${contentRootId}/versions/${contentId}/seo`}
      />
      <InputSeoForm
        initialData={initialData}
        fieldName={SeoField.Description}
        label="SEO Description"
        placeholder="e.g. This article shows you how to write a screenplay from scratch. Learn More."
        apiUrl={`/api/${contentType}/${contentRootId}/versions/${contentId}/seo`}
      />
      <InputSeoForm
        initialData={initialData}
        fieldName={SeoField.CanonicalUrl}
        label="Canonical URL"
        placeholder="https://pictureswriters.com/canonical-url"
        apiUrl={`/api/${contentType}/${contentRootId}/versions/${contentId}/seo`}
      />

      <InputSeoForm
        initialData={initialData}
        fieldName={SeoField.OgTwitterTitle}
        label="OpenGraph/Twitter Title"
        placeholder="e.g. How to write a screenplay"
        apiUrl={`/api/${contentType}/${contentRootId}/versions/${contentId}/seo`}
      />
      <InputSeoForm
        initialData={initialData}
        fieldName={SeoField.OgTwitterDescription}
        label="OpenGraph/Twitter Description"
        placeholder="e.g. This article shows you how to write a screenplay from scratch. Learn More."
        apiUrl={`/api/${contentType}/${contentRootId}/versions/${contentId}/seo`}
      />
      <NoIndexForm
        initialData={initialData}
        apiUrl={`/api/${contentType}/${contentRootId}/versions/${contentId}/seo`}
      />
      <NoFollowForm
        initialData={initialData}
        apiUrl={`/api/${contentType}/${contentRootId}/versions/${contentId}/seo`}
      />
    </div>
  );
};
