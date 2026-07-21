import { Button } from "@/shared/ui/button";
import type { FormDisplayInstance } from "../../../types/core";

export const ButtonDesignerComponent = ({
  elementInstance,
}: {
  elementInstance: FormDisplayInstance<"Button">;
}) => {
  const { label } = elementInstance.properties;

  return (
    <Button type="submit" className="pointer-events-none self-end">
      {label}
    </Button>
  );
};
