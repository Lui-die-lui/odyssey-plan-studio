import { AiControlPanel } from "@/features/admin/components/ai-control-panel";
import { getAdminUserAiState, isAiDraftEnabled } from "@/features/admin/lib/ai-control";

type AdminAiUser = Awaited<ReturnType<typeof getAdminUserAiState>>[number];

export default async function AdminAiControlPage() {
  const [enabled, users] = await Promise.all([isAiDraftEnabled(), getAdminUserAiState(80)]);

  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-950/40">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-[#FEFEFE]">AI 제어 패널</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          전역 ON/OFF와 사용자별 AI 차단 상태를 관리합니다.
        </p>
      </header>

      <AiControlPanel
        initialEnabled={enabled}
        initialUsers={users.map((u: AdminAiUser) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
