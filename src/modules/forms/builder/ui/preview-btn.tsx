import { Dialog, DialogContent, DialogTrigger } from "@/shared/ui/dialog";
import { EyeIcon } from "lucide-react";
import { FormRunner } from "../runner/form-runner";
import { useDesigner } from "../store/designer-provider";

export const PreviewBtn = () => {
  const root = useDesigner((state) => state.root);

  const onSubmit = (values: Record<string, any>) => {
    console.log(values);
  };

  return (
    <Dialog>
      <DialogTrigger>
        <div className="flex gap-2 items-center py-2 text-sm font-medium px-3 rounded hover:bg-accent">
          <EyeIcon className="size-4" />
          Preview
        </div>
      </DialogTrigger>
      <DialogContent className="h-screen w-screen max-h-screen max-w-full flex flex-col grow p-0 gap-0 sm:rounded-none border-t-0 -mt-1">
        <div className="px-4 py-2 border-b">
          <p className="text-sm text-muted-foreground">Form preview</p>
          <p>This is how your form will look like to your users.</p>
        </div>
        <div className="bg-accent flex flex-col grow items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-155 flex flex-col gap-4 grow bg-background h-full w-full rounded p-8 overflow-y-auto">
            <FormRunner root={root} onSubmit={onSubmit} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
