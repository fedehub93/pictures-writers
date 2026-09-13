import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { HydrateClient } from "@/trpc/server";

import {
  ScheduleView,
  ScheduleViewError,
  ScheduleViewLoading,
} from "@/modules/scheduler";
import { SchedulerHeader } from "@/modules/scheduler/ui/components/schedule-header";
import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

const SchedulePage = async () => {
  await requirePermission(PERMISSIONS.POSTS_READ);

  return (
    <HydrateClient>
      <SchedulerHeader />
      <Suspense fallback={<ScheduleViewLoading />}>
        <ErrorBoundary fallback={<ScheduleViewError />}>
          <ScheduleView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default SchedulePage;
