import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ContentHeaderProps {
  label: string;
  contentType: "posts" | "categories" | "tags" | "media";
}

export const ContentHeader = ({ label, contentType }: ContentHeaderProps) => {
  return (
    <div className="w-full h-12 flex items-center justify-between gap-x-2">
      <div className="flex flex-col flex-1">
        <h1 className="text-2xl">{label}</h1>
        <p className="text-sm text-muted-foreground">entry found</p>
      </div>
      <div>
        <Button>
          <Link
            href={`/admin/${contentType}/create`}
            className="flex items-center gap-x-2"
          >
            <Plus />
            Create new entry
          </Link>
        </Button>
      </div>
    </div>
  );
};
