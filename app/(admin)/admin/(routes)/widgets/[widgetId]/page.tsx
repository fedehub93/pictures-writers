import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

import { WidgetForm } from "./_components/widget-form";

const WidgetIdPage = async (props: {
  params: Promise<{ widgetId: string }>;
}) => {
  const params = await props.params;
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return (await auth()).redirectToSignIn();
  }

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
