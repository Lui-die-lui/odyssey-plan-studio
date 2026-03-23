"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/dashboard", label: "대시보드" },
  { href: "/admin/ai-control", label: "AI 제어" },
  { href: "/admin/users", label: "사용자 관리" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {links.map((link) => {
        const active = pathname?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
