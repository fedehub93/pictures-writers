interface CharsCounterProps {
  value: string;
}

export const CharsCounter = ({ value }: CharsCounterProps) => {
  return (
    <div className="flex items-center justify-between w-full pt-2">
      <div className="text-sm text-muted-foreground">
        {value.length} characters
      </div>
    </div>
  );
};
