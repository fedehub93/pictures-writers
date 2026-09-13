"use client";

import "client-only";

import { createContext, useContext } from "react";

import { hasPermission } from "@/shared/lib/permissions";

const AuthorizationContext = createContext<readonly string[]>([]);

export function AuthorizationProvider({
  permissionKeys,
  children,
}: {
  permissionKeys: readonly string[];
  children: React.ReactNode;
}) {
  return (
    <AuthorizationContext.Provider value={permissionKeys}>
      {children}
    </AuthorizationContext.Provider>
  );
}

export function usePermission(permission: string) {
  return hasPermission(useContext(AuthorizationContext), permission);
}
