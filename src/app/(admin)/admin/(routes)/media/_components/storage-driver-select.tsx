"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import {
  STORAGE_DRIVERS,
  STORAGE_DRIVER_LABELS,
  type StorageDriverName,
} from "@/modules/media/lib/storage-driver";
import { apiErrorMessage } from "@/shared/lib/api-error";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

interface StorageDriverSelectProps {
  active: StorageDriverName;
  uploadThingAvailable: boolean;
}

/**
 * Where the next upload is written. Saving is immediate: the resolver reads
 * the setting on every upload, so there is no restart and no redeploy. Media
 * already stored keeps being served by the driver recorded on its own row.
 */
export const StorageDriverSelect = ({
  active,
  uploadThingAvailable,
}: StorageDriverSelectProps) => {
  const router = useRouter();
  const [value, setValue] = useState<StorageDriverName>(active);
  const [isSaving, setIsSaving] = useState(false);

  const onChange = async (next: StorageDriverName) => {
    if (next === value || isSaving) return;

    const previous = value;
    setValue(next);
    setIsSaving(true);

    try {
      await axios.patch("/api/settings", { storageDriver: next });
      toast.success(
        `New uploads will be stored on ${STORAGE_DRIVER_LABELS[next].toLowerCase()}.`,
      );
      router.refresh();
    } catch (error) {
      setValue(previous);
      toast.error(
        apiErrorMessage(error, "The storage driver could not be saved."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-w-56 max-w-72 flex-col gap-y-1">
      <span className="text-xs text-muted-foreground">New uploads</span>
      <Select
        value={value}
        onValueChange={(next) => void onChange(next as StorageDriverName)}
        disabled={isSaving}
      >
        <SelectTrigger className="w-56" aria-label="Storage for new uploads">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STORAGE_DRIVERS.map((driver) => (
            <SelectItem
              key={driver}
              value={driver}
              disabled={driver === "uploadthing" && !uploadThingAvailable}
            >
              {STORAGE_DRIVER_LABELS[driver]}
              {driver === "uploadthing" && !uploadThingAvailable
                ? " (not configured)"
                : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {uploadThingAvailable
          ? "Existing media keep being served from where they were stored."
          : "UploadThing is unavailable: no UPLOADTHING_TOKEN is configured."}
      </p>
    </div>
  );
};
