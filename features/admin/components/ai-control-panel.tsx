"use client";

import { useState } from "react";

type UserRow = {
  id: string;
  email: string | null;
  name: string | null;
  role: "USER" | "ADMIN";
  aiBlocked: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

export function AiControlPanel({
  initialEnabled,
  initialUsers,
}: {
  initialEnabled: boolean;
  initialUsers: UserRow[];
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState(false);
  const [users, setUsers] = useState(initialUsers);

  const toggleGlobal = async () => {
    setBusy(true);
    try {
      const next = !enabled;
      const res = await fetch("/api/admin/ai-control", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) return;
      setEnabled(next);
    } finally {
      setBusy(false);
    }
  };

  const toggleUser = async (userId: string, next: boolean) => {
    const prev = users;
    setUsers((rows) => rows.map((r) => (r.id === userId ? { ...r, aiBlocked: next } : r)));
    const res = await fetch(`/api/admin/users/${userId}/ai-block`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiBlocked: next }),
    });
    if (!res.ok) setUsers(prev);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950/40 dark:text-[#FEFEFE]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-[#FEFEFE]">AI 초안 생성 전체 제어</h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              비정상 요청 대응 시 전역으로 AI 초안 생성을 차단할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void toggleGlobal()}
            disabled={busy}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              enabled
                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                : "bg-red-600 text-white hover:bg-red-500"
            } disabled:opacity-60`}
          >
            {enabled ? "ON" : "OFF"}
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950/40 dark:text-[#FEFEFE]">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-[#FEFEFE]">사용자별 AI 차단</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-2 py-2">사용자</th>
                <th className="px-2 py-2">권한</th>
                <th className="px-2 py-2">가입일</th>
                <th className="px-2 py-2">차단</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-zinc-100 dark:border-white/10">
                  <td className="px-2 py-2">{u.email ?? u.name ?? u.id}</td>
                  <td className="px-2 py-2">{u.role}</td>
                  <td className="px-2 py-2">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => void toggleUser(u.id, !u.aiBlocked)}
                      className={`rounded px-2 py-1 text-xs ${
                        u.aiBlocked
                          ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300"
                          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                      }`}
                    >
                      {u.aiBlocked ? "차단됨" : "허용"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
