import { requireAdminAuth } from "@/lib/auth-utils";

import { PagesView } from "./components/pages-view";
import { getPages } from "./data";

const PagesPage = async () => {
  await requireAdminAuth();

  const pages = await getPages();

  return <PagesView pages={pages} />;
};

export default PagesPage;
