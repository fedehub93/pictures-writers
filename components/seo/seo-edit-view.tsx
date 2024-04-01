import { Seo } from "@prisma/client";
import { TitleForm } from "../general-fields/title-form";
import { DescriptionForm } from "../general-fields/description-form";
import { CanonicalUrlForm } from "./canonical-url-form";
import { NoIndexForm } from "./no-index-form";
import { NoFollowForm } from "./no-follow-form";

interface SeoProps {
  initialData: Seo | null;
  contentType: "posts" | "categories" | "tags";
  contentId: string;
}

export const SeoEditView = ({
  initialData,
  contentType,
  contentId,
}: SeoProps) => {
  if (!initialData) {
    return <div>No seo data for this item.</div>;
  }

  return (
    <>
      <TitleForm
        initialData={initialData}
        label="SEO Title"
        placeholder="e.g. How to write a screenplay"
        apiUrl={`/api/${contentType}/${contentId}/seo`}
      />
      <DescriptionForm
        initialData={initialData}
        label="SEO Description"
        placeholder="e.g. This article shows you how to write a screenplay from scratch. Learn More."
        apiUrl={`/api/${contentType}/${contentId}/seo`}
      />
      <CanonicalUrlForm
        initialData={initialData}
        placeholder="https://pictureswriters.com/canonical-url"
        apiUrl={`/api/${contentType}/${contentId}/seo`}
      />
      <NoIndexForm
        initialData={initialData}
        apiUrl={`/api/${contentType}/${contentId}/seo`}
      />
      <NoFollowForm
        initialData={initialData}
        apiUrl={`/api/${contentType}/${contentId}/seo`}
      />
    </>
  );
};
