import { FlaskConicalIcon } from "lucide-react";

import { Button } from "@/shared/ui/button";

import { useExecuteAutomation } from "../../../../hooks/use-automations";

export const ExecuteAutomationButton = ({
  automationId,
}: {
  automationId: string;
}) => {
  const executeWorkflow = useExecuteAutomation();

  const handleExecute = () => {
    executeWorkflow.mutate({ id: automationId });
  };
  return (
    <Button
      size="lg"
      onClick={handleExecute}
      disabled={executeWorkflow.isPending}
    >
      <FlaskConicalIcon className="size-4" />
      Execute workflow
    </Button>
  );
};
