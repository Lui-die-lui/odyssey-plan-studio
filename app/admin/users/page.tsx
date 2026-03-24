import { getAdminUserAiState } from "@/features/admin/lib/ai-control";

type AdminUserRow = Awaited<ReturnType<typeof getAdminUserAiState>>[number];

export default async function AdminUsersPage() {
  const users = await getAdminUserAiState(120);

  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-950/40">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-[#FEFEFE]">사용자 관리</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          최근 가입 사용자와 AI 차단 상태를 확인합니다.
        </p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950/40 dark:text-[#FEFEFE]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-2 py-2">사용자</th>
                <th className="px-2 py-2">권한</th>
                <th className="px-2 py-2">AI 차단</th>
                <th className="px-2 py-2">가입일</th>
                <th className="px-2 py-2">최근 로그인</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: AdminUserRow) => (
                <tr key={u.id} className="border-t border-zinc-100 dark:border-white/10">
                  <td className="px-2 py-2">{u.email ?? u.name ?? u.id}</td>
                  <td className="px-2 py-2">{u.role}</td>
                  <td className="px-2 py-2">{u.aiBlocked ? "차단" : "허용"}</td>
                  <td className="px-2 py-2">{u.createdAt.toLocaleDateString()}</td>
                  <td className="px-2 py-2">{u.lastLoginAt ? u.lastLoginAt.toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
