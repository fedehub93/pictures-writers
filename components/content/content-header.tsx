interface ContentHeaderProps {
  label: string;
  totalEntries: number;
}

export const ContentHeader = ({ label, totalEntries }: ContentHeaderProps) => {
  return (
    <div className="w-full h-12 flex items-center justify-between gap-x-2">
      <div className="flex flex-col flex-1">
        <h1 className="text-2xl">{label}</h1>
        <p className="text-sm text-muted-foreground">
          {totalEntries} entry found
        </p>
      </div>
    </div>
  );
};
