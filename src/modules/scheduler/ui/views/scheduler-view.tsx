import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { Calendar } from "../components/calendar";

export const SchedulerView = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <Calendar />
      </div>
    </div>
  );
};

export const SchedulerViewLoading = () => {
  return (
    <LoadingState
      title="Loading Calendar"
      description="This may take a few seconds"
    />
  );
};

export const SchedulerViewError = () => {
  return (
    <ErrorState title="Error Calendar" description="Something went wrong" />
  );
};
