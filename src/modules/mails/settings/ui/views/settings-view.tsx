"use client";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { useSuspenseSettings } from "../../hooks/use-get-settings";
import { EmailSettingsForm } from "../components/settings-form";
import { EmailSubscriptionForm } from "../components/subscriptions-form";
import { EmailTesterForm } from "../components/tester-form";

export const SettingsView = () => {
  const { data } = useSuspenseSettings();
  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <div className="w-full h-12 flex items-center justify-between gap-x-2">
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl">Mail Settings</h1>
        </div>
      </div>
      <EmailSettingsForm settings={data} />
      <EmailSubscriptionForm settings={data} />
      <EmailTesterForm settings={data} />
    </div>
  );
};

export const SettingsViewLoading = () => {
  return (
    <LoadingState
      title="Loading Mail Settings"
      description="This may take a few seconds"
    />
  );
};

export const SettingsViewError = () => {
  return (
    <ErrorState
      title="Error Mail Settings"
      description="Something went wrong"
    />
  );
};
