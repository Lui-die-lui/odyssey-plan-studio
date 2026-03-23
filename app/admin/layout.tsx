import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { authOptions } from "@/features/auth/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id) {
    redirect("/login?callbackUrl=%2Fadmin%2Fdashboard");
  }
  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
        <aside className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-950/40">
          <h1 className="mb-3 px-2 text-sm font-semibold text-zinc-900 dark:text-[#FEFEFE]">ADMIN</h1>
          <AdminSidebar />
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
