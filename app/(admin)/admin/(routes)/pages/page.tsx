import { requireAdminAuth } from "@/lib/auth-utils";

import { PagesView } from "./components/pages-view";
import { getPagesGroupedByRootId } from "./data";

const PagesPage = async () => {
  await requireAdminAuth();

  const pages = await getPagesGroupedByRootId();

  return <PagesView pages={pages} />;
};

export default PagesPage;
