"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { adminPath, type AdminBasePath } from "@/lib/admin-paths";

// Default to "/admin" so components rendered outside a provider (e.g. in
// unit tests without a wrapping layout) keep matching the on-disk admin
// paths — the production subdomain explicitly sets basePath="" via the
// dashboard layout.
const AdminBasePathContext = createContext<AdminBasePath>("/admin");

export function AdminPathProvider({
  basePath,
  children,
}: {
  basePath: AdminBasePath;
  children: ReactNode;
}) {
  return (
    <AdminBasePathContext.Provider value={basePath}>
      {children}
    </AdminBasePathContext.Provider>
  );
}

export function useAdminPath(): (path: string) => string {
  const basePath = useContext(AdminBasePathContext);
  return useMemo(() => (path: string) => adminPath(basePath, path), [basePath]);
}
