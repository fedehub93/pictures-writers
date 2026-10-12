"use client";

import { useMemo, useState } from "react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";
import { hasPermission } from "@/shared/lib/permissions";
import { usePermissionKeys } from "@/shared/providers/authorization-provider";
import { Button } from "@/shared/ui/button";

import {
  addInstance,
  createInstanceKey,
  hideInstance,
  moveInstance,
} from "../../lib/edit-layout";
import {
  DEFAULT_DASHBOARD_INSTANCES,
  WIDGET_DEFINITIONS,
} from "../../registry";
import { computeDashboardLayout } from "../../server/layout";
import type { DashboardWidgetInstance } from "../../types";

import { WidgetGrid } from "../components/widget-grid";

export const DashboardView = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const permissionKeys = usePermissionKeys();
  const { data } = useSuspenseQuery(trpc.dashboard.getLayout.queryOptions());

  const canRead = useMemo(
    () => (permission: string) => hasPermission(permissionKeys, permission),
    [permissionKeys],
  );

  const layout = useMemo(
    () =>
      computeDashboardLayout({
        defaults: DEFAULT_DASHBOARD_INSTANCES,
        saved: data.widgets,
        definitions: WIDGET_DEFINITIONS,
        canRead,
      }),
    [data.widgets, canRead],
  );

  const permittedDefinitions = useMemo(
    () =>
      WIDGET_DEFINITIONS.filter(
        (definition) =>
          !definition.permission || canRead(definition.permission),
      ),
    [canRead],
  );

  // `draft` holds the pending changes; `editing` hides or shows the edit
  // chrome. Leaving with "Fine" keeps the draft, "Annulla" discards it.
  const [draft, setDraft] = useState<DashboardWidgetInstance[] | null>(null);
  const [editing, setEditing] = useState(false);

  const saveLayout = useMutation(
    trpc.dashboard.saveLayout.mutationOptions({
      onSuccess: (result) => {
        queryClient.setQueryData(trpc.dashboard.getLayout.queryKey(), {
          widgets: result.widgets,
        });
        setDraft(null);
        setEditing(false);
        toast.success("Dashboard aggiornata.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const enterEditMode = () => {
    setDraft((current) => current ?? layout);
    setEditing(true);
  };

  const leaveEditMode = () => setEditing(false);

  const cancelEditing = () => {
    setDraft(null);
    setEditing(false);
  };

  const save = () => {
    if (!draft) return;
    saveLayout.mutate({ widgets: draft });
  };

  const updateDraft = (
    change: (current: DashboardWidgetInstance[]) => DashboardWidgetInstance[],
  ) => setDraft((current) => (current ? change(current) : current));

  const onHide = (key: string) =>
    updateDraft((current) => hideInstance(current, key));

  const onMove = (from: number, to: number) =>
    updateDraft((current) => moveInstance(current, from, to));

  const onAdd = (definitionId: string) =>
    updateDraft((current) =>
      addInstance(current, definitionId, createInstanceKey(definitionId)),
    );

  const instances = editing && draft ? draft : layout;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 md:pt-4">
      <div className="flex flex-col items-center justify-between gap-y-4 sm:flex-row">
        <h1 className="text-3xl">Dashboard</h1>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={cancelEditing}
                disabled={saveLayout.isPending}
              >
                Annulla
              </Button>
              <Button
                type="button"
                onClick={save}
                disabled={saveLayout.isPending}
              >
                {saveLayout.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Salva
              </Button>
            </>
          ) : draft ? (
            <span className="text-sm text-muted-foreground">
              Modifiche non salvate
            </span>
          ) : null}
          <Button
            type="button"
            variant={editing ? "outline" : "default"}
            onClick={editing ? leaveEditMode : enterEditMode}
          >
            {editing ? null : <Pencil />}
            {editing ? "Fine" : "Modifica"}
          </Button>
        </div>
      </div>

      <WidgetGrid
        instances={instances}
        editing={editing}
        permittedDefinitions={permittedDefinitions}
        onMove={onMove}
        onHide={onHide}
        onAdd={onAdd}
      />
    </div>
  );
};
