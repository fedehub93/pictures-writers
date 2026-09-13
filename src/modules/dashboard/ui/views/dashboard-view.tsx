"use client";

import { DatePickerWithRange } from "@/shared/components/date-range";
import { usePermission } from "@/shared/providers/authorization-provider";

import { EbooksWidget } from "@/app/(admin)/admin/(routes)/dashboard/_components/ebooks-widget";
import { SubscriptionsWidget } from "../components/subscriptions-widget";

export const DashboardView = () => {
  const canReadDashboard = usePermission("dashboard.read");
  const canReadContacts = usePermission("contacts.read");

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 md:pt-4">
      <div className="flex flex-col sm:flex-row gap-y-4 items-center justify-between">
        <h1 className="text-3xl">Dashboard</h1>
        <div className="flex items-center gap-x-2">
          Range: <DatePickerWithRange />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-2">
        {canReadContacts && <SubscriptionsWidget />}
        {canReadDashboard && <EbooksWidget />}
      </div>
    </div>
  );
};
