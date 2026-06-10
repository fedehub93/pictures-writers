import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { prefetchTemplateById } from "@/modules/mails/templates/server";

import {
  TemplateIdView,
  TemplateIdViewLoading,
  TemplateIdViewError,
} from "@/modules/mails/templates";

const TemplateIdPage = async ({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) => {
  await requireAdminAuth();

  const { templateId } = await params;

  prefetchTemplateById(templateId);

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<TemplateIdViewError />}>
        <Suspense fallback={<TemplateIdViewLoading />}>
          <TemplateIdView templateId={templateId} />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default TemplateIdPage;
