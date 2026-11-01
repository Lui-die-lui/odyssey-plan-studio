"use client";

import type { ReactNode } from "react";

import { usePathname } from "next/navigation";

import { AppNavbar } from "@/components/layout/AppNavbar";
import { FutureField } from "@/components/layout/FutureField";
import { ScrollProgress } from "@/components/layout/ScrollProgress";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {pathname.startsWith("/admin") ? null : <FutureField />}
      <ScrollProgress />
      <div className="relative z-10 flex min-h-full flex-1 flex-col">
        <AppNavbar />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
