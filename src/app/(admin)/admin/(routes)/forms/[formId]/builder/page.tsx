import { Suspense } from "react";
import { HydrateClient } from "@/trpc/server";
import { ErrorBoundary } from "react-error-boundary";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { prefetchFormById } from "@/modules/forms/server/prefetch";

import {
  FormBuilderView,
  FormBuilderViewError,
  FormBuilderViewLoading,
} from "@/modules/forms/ui/views/form-builder-view";

const FormBuilderPage = async ({
  params,
}: {
  params: Promise<{ formId: string }>;
}) => {
  await requireAdminAuth();

  const { formId } = await params;

  prefetchFormById(formId);

  return (
    <HydrateClient>
      <Suspense fallback={<FormBuilderViewLoading />}>
        <ErrorBoundary fallback={<FormBuilderViewError />}>
          <FormBuilderView id={formId} />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default FormBuilderPage;
