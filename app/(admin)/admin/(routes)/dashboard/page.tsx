import { DollarSign } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { SubscriptionsWidget } from "./_components/subscriptions-widget";
import { EbooksWidget } from "./_components/ebooks-widget";
import { DatePickerWithRange } from "@/components/date-range";

const DashboardPage = async () => {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 md:pt-4">
      <div className="flex flex-col sm:flex-row gap-y-4 items-center justify-between">
        <h1 className="text-3xl">Dashboard</h1>
        <div className="flex items-center gap-x-2">
          Range: <DatePickerWithRange />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-2">
        <SubscriptionsWidget />
        <EbooksWidget />
      </div>
    </div>
  );
};

export default DashboardPage;
