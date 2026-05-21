import { redirect } from "next/navigation";

import { requireAdminAuth } from "@/lib/auth-utils";

import { PageIdView } from "./components/page-id-view";
import { getLastPageByRootId } from "../data";

const PageIdPage = async (props: { params: Promise<{ rootId: string }> }) => {
  await requireAdminAuth();

  const params = await props.params;

  const page = await getLastPageByRootId(params.rootId);

  if (!page || !page.rootId) {
    return redirect("/admin/pages");
  }

  return <PageIdView pageId={page.id} initialData={page} />;
};

export default PageIdPage;
