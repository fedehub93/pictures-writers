"use client";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";
import { useSuspenseSingleSend } from "../../hooks/use-single-sends";
import { WriteForm } from "../components/write-form";

export const SingleSendIdView = ({
  singleSendId,
}: {
  singleSendId: string;
}) => {
  const { data: singleSend } = useSuspenseSingleSend(singleSendId);

  return (
    <div className="py-2 px-6 mx-auto h-full flex flex-col overflow-auto">
      <WriteForm singleSend={singleSend} />
    </div>
  );
};

export const SingleSendViewLoading = () => {
  return (
    <LoadingState
      title="Loading Single Send"
      description="This may take a few seconds"
    />
  );
};

export const SingleSendViewError = () => {
  return (
    <ErrorState title="Error Single Send" description="Something went wrong" />
  );
};
