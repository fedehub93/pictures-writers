import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { prefetchAutomation } from "@/modules/automations/server/prefetch";

import {
  EditorView,
  EditorViewError,
  EditorViewLoading,
} from "@/modules/automations/editor/ui/views/editor-view";
import { EditorHeader } from "@/modules/automations/editor/ui/views/editor-header";

interface PageProps {
  params: Promise<{
    automationId: string;
  }>;
}

const Page = async ({ params }: PageProps) => {
  await requirePermission(PERMISSIONS.AUTOMATIONS_READ);

  const { automationId } = await params;
  prefetchAutomation(automationId);

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<EditorViewError />}>
        <Suspense fallback={<EditorViewLoading />}>
          <EditorHeader automationId={automationId} />
          <main className="flex-1">
            <EditorView automationId={automationId} />
          </main>
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default Page;
