"use client";

import { RocketIcon, SaveIcon } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { cn, getFirstCharUppercase } from "@/shared/lib/utils";
import { PERMISSIONS } from "@/shared/lib/permissions";
import { usePermission } from "@/shared/providers/authorization-provider";

import { AutomationStatus } from "@/generated/prisma";

import {
  usePublishAutomation,
  useSuspenseAutomation,
  useUpdateAutomation,
  useUpdateAutomationName,
} from "../../../hooks/use-automations";
import { editorAtom } from "../../store/atoms";

export const EditorSaveButton = ({
  automationId,
}: {
  automationId: string;
}) => {
  const editor = useAtomValue(editorAtom);
  const saveAutomation = useUpdateAutomation();

  const handleSave = () => {
    if (!editor) {
      return;
    }

    const nodes = editor.getNodes();
    const edges = editor.getEdges();

    saveAutomation.mutate({
      id: automationId,
      nodes,
      edges,
    });
  };

  return (
    <Button
      size="sm"
      onClick={handleSave}
      disabled={saveAutomation.isPending}
    >
      <SaveIcon className="size-4" />
      Save
    </Button>
  );
};

export const EditorPublishButton = ({
  automationId,
}: {
  automationId: string;
}) => {
  const editor = useAtomValue(editorAtom);
  const publishAutomation = usePublishAutomation();
  const canWrite = usePermission(PERMISSIONS.AUTOMATIONS_WRITE);
  const { data: automation } = useSuspenseAutomation(automationId);

  if (!canWrite) {
    return null;
  }

  const handlePublish = () => {
    if (!editor) {
      return;
    }

    const nodes = editor.getNodes().map((node) => ({
      id: node.id,
      type: node.type as string,
      position: { x: node.position.x, y: node.position.y },
      data: node.data,
    }));
    const edges = editor.getEdges().map((edge) => ({
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
    }));

    publishAutomation.mutate({
      id: automationId,
      nodes,
      edges,
    });
  };

  const isPublished = automation.status === AutomationStatus.PUBLISHED;

  return (
    <Button
      size="sm"
      variant={isPublished ? "outline" : "secondary"}
      onClick={handlePublish}
      disabled={publishAutomation.isPending}
    >
      <RocketIcon className="size-4" />
      {isPublished ? "Republish" : "Publish"}
    </Button>
  );
};

export const EditorStatusBadge = ({
  automationId,
}: {
  automationId: string;
}) => {
  const { data: automation } = useSuspenseAutomation(automationId);

  return (
    <Badge
      className={cn(
        automation.status === AutomationStatus.DRAFT && "bg-slate-700",
        automation.status === AutomationStatus.PUBLISHED && "bg-emerald-700",
      )}
    >
      {getFirstCharUppercase(automation.status.toLowerCase())}
    </Badge>
  );
};

export const EditorNameInput = ({ automationId }: { automationId: string }) => {
  const { data: automation } = useSuspenseAutomation(automationId);
  const updateAutomation = useUpdateAutomationName();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(automation.name);
  const [previousName, setPreviousName] = useState(automation.name);

  // Keep the draft input in sync when the saved name changes (e.g. a rename
  // performed from the list page). Adjusting state during render is the
  // documented alternative to a synchronizing effect.
  if (previousName !== automation.name) {
    setPreviousName(automation.name);
    setName(automation.name);
  }

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (name === automation.name) {
      setIsEditing(false);
      return;
    }

    try {
      await updateAutomation.mutateAsync({
        id: automationId,
        name,
      });
    } catch {
      setName(automation.name);
    } finally {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setName(automation.name);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        disabled={updateAutomation.isPending}
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="h-7 w-auto min-w-25 px-2"
      />
    );
  }

  return (
    <h2
      onClick={() => {
        setIsEditing(true);
      }}
      className="cursor-pointer hover:text-foreground transition-colors text-sm text-muted-foreground"
    >
      {automation.name}
    </h2>
  );
};

export const EditorHeader = ({ automationId }: { automationId: string }) => {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background">
      <div className="flex flex-row items-center justify-between gap-x-4 w-full">
        <div className="flex items-center gap-x-3">
          <EditorNameInput automationId={automationId} />
          <EditorStatusBadge automationId={automationId} />
        </div>
        <div className="flex items-center gap-x-2">
          <EditorPublishButton automationId={automationId} />
          <EditorSaveButton automationId={automationId} />
        </div>
      </div>
    </header>
  );
};