import { redirect } from "next/navigation";

const GlobalSettings = async () => {
  redirect("/admin/settings/main/");
};

export default GlobalSettings;
