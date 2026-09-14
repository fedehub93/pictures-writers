"use client";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";

import { DataTable } from "./data-table";
import { createColumns } from "./columns";

type Role = inferRouterOutputs<AppRouter>["roles"]["getMany"]["roles"][number];

interface RolesTableProps {
  roles: Role[];
  canManage: boolean;
}

export function RolesTable({ roles, canManage }: RolesTableProps) {
  return <DataTable columns={createColumns({ canManage })} data={roles} />;
}