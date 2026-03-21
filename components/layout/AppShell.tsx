"use client";

import type { ReactNode } from "react";

import { AppNavbar } from "@/components/layout/AppNavbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppNavbar />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
