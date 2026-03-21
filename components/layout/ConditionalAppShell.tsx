"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";

const PDF_SUMMARY_PATH = /^\/plans\/[^/]+\/summary\/pdf$/;

/**
 * PDF print routes skip the main app chrome so Puppeteer captures only the document.
 */
export function ConditionalAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  if (PDF_SUMMARY_PATH.test(pathname)) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-white text-zinc-900 antialiased">
        {children}
      </div>
    );
  }
  return <AppShell>{children}</AppShell>;
}
