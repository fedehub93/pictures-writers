"use client";

import { useEffect } from "react";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";
import { useSidebar } from "@/shared/ui/sidebar";

import { PuckEditor } from "@/puck/custom-config";

import { useSuspensePage } from "../../hooks/use-pages";

import { INITIAL_PUCK_DATA } from "../../constants";

interface PageBuilderViewProps {
  rootId: string;
}

export const PageBuilderView = ({ rootId }: PageBuilderViewProps) => {
  const { data } = useSuspensePage(rootId);
  const { setOpen } = useSidebar();

  useEffect(() => {
    setTimeout(() => {
      setOpen(false);
    }, 50);
  }, []);

  return (
    <PuckEditor
      initialData={{
        puckData: data.puckData ?? INITIAL_PUCK_DATA,
      }}
    />
  );
};

export const PageBuilderViewLoading = () => {
  return (
    <LoadingState
      title="Loading Page"
      description="This may take a few seconds"
    />
  );
};

export const PageBuilderViewError = () => {
  return <ErrorState title="Error Page" description="Something went wrong" />;
};
