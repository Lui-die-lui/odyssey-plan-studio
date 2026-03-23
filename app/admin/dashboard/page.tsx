import { KpiCards } from "@/features/admin/components/kpi-cards";
import { TrendSection } from "@/features/admin/components/trend-section";
import { getAdminKpis } from "@/features/admin/lib/stats";
import { getTrendSeries } from "@/features/admin/lib/trends";

export default async function AdminDashboardPage() {
  const [kpis, day, week, month] = await Promise.all([
    getAdminKpis(),
    getTrendSeries("day"),
    getTrendSeries("week"),
    getTrendSeries("month"),
  ]);

  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-950/40">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-[#FEFEFE]">운영 대시보드</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          가입자 및 AI 요청 현황을 일/주/월 단위로 확인합니다.
        </p>
      </header>

      <KpiCards data={kpis} />
      <TrendSection day={day} week={week} month={month} />
    </div>
  );
}
