import { cn } from "@/shared/lib/utils";

interface ContentHeaderProps {
  label: string;
  totalEntries: number;
  section?: string;
}

export const ContentHeader = ({
  label,
  totalEntries,
  section,
}: ContentHeaderProps) => {
  return (
    <div
      className={cn(
        "w-full flex items-center justify-between gap-x-2",
        section ? "min-h-12 py-1" : "h-12",
      )}
    >
      <div className="flex flex-col flex-1">
        {section ? (
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {section}
          </span>
        ) : null}
        <h1 className="text-2xl">{label}</h1>
        <p className="text-sm text-muted-foreground">
          {totalEntries} entry found
        </p>
      </div>
    </div>
  );
};
