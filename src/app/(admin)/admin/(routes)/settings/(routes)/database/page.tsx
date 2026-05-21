"use client";

import { useRouter } from "next/navigation";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const DatabaseSettingsPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async () => {
    try {
      setIsLoading(true);

      const response = await axios.get("/api/database/backup", { responseType: "blob" });
      // Crea un URL per il file Blob ricevuto
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // Crea un link di download e avvialo
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "backup.json"); // Nome del file da scaricare
      document.body.appendChild(link);
      link.click();

      // Rimuovi il link dopo il download
      document.body.removeChild(link);

      toast.success("Backup completed");
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
      setIsLoading(false);
    }
  };
  return (
    <div className="p-4 w-full rounded-md flex flex-col gap-y-8">
      <div className="flex flex-col flex-1">
        <h3 className="text-lg font-bold space-y-0.5">Database</h3>
        <p className="text-muted-foreground text-sm">
          Update your general settings. Set your site name and url.
        </p>
      </div>
      <Separator />
      <div className="min-w-40 flex-auto flex flex-wrap gap-4">
        <div>Database URL</div>
        <Input disabled={true} value={process.env.DATABASE_URL!} />
      </div>
      <div className="flex items-center gap-x-2 justify-start">
        <Button type="button" disabled={isLoading} onClick={onSubmit}>
          Backup
        </Button>
      </div>
    </div>
  );
};

export default DatabaseSettingsPage;
