import axios from "axios";

import { db } from "@/lib/db";

export const triggerWebhookBuild = async () => {
  // Recupera il webhook URL dalle impostazioni
  const settings = await db.settings.findFirst();

  if (settings?.deployWebhookUrl) {
    try {
      // Effettua la chiamata al webhook
      const response = await axios.post(settings.deployWebhookUrl);

      console.log("Deploy triggered:", response.data);
    } catch (error) {
      console.error("Error triggering deploy:", error);
    }
  }
};
