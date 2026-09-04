import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { HydrateClient } from "@/trpc/server";

import {
  SchedulerView,
  SchedulerViewError,
  SchedulerViewLoading,
} from "@/modules/scheduler";

const SchedulePage = () => {
  return (
    <HydrateClient>
      <div className="flex flex-col gap-y-4 px-6 pt-4">
        <div className="w-full h-12 flex items-center justify-between gap-x-2">
          <div className="flex flex-col flex-1">
            <h1 className="text-2xl">Calendar</h1>
          </div>
        </div>
      </div>
      <Suspense fallback={<SchedulerViewLoading />}>
        <ErrorBoundary fallback={<SchedulerViewError />}>
          <SchedulerView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default SchedulePage;
