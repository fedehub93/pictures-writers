import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Progress } from "@/shared/ui/progress";

interface ProgressDialogProps {
  title: string;
  description: string;
  percentage: number;
  progress: {
    current: number;
    total: number;
  };
  isProcessing: boolean;
  error?: string | null;
}

export const ProgressDialog = ({
  title,
  description,
  percentage,
  progress,
  isProcessing,
  error,
}: ProgressDialogProps) => {
  return (
    <Dialog open={isProcessing}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Progress value={percentage} className="h-3 w-full" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{percentage}% completed</span>
            <span>
              {progress.current} / {progress.total} items
            </span>
          </div>
          {error && (
            <div className="text-sm text-destructive mt-2">Error: {error}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
