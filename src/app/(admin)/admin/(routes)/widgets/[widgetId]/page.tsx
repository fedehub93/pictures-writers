import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { requireAdminAuth } from "@/lib/auth-utils";

import { WidgetForm } from "./_components/widget-form";

const WidgetIdPage = async (props: {
  params: Promise<{ widgetId: string }>;
}) => {
  await requireAdminAuth();

  const params = await props.params;

  const widget = await db.widget.findUnique({
    where: {
      id: params.widgetId,
    },
  });

  if (!widget || !widget.id) {
    redirect("/admin/widgets");
  }

  return (
    <WidgetForm
      initialData={widget}
      apiUrl={`/api/admin/widgets/${widget.id}`}
    />
  );
};

export default WidgetIdPage;
