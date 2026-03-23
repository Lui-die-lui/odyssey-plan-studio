type AdminKpis = {
  todaySignups: number;
  weekSignups: number;
  monthSignups: number;
  todayAiRequests: number;
  weekAiRequests: number;
  monthAiRequests: number;
};

export function KpiCards({ data }: { data: AdminKpis }) {
  const rows: Array<{ title: string; value: number }> = [
    { title: "오늘 가입자 수", value: data.todaySignups },
    { title: "이번 주 가입자 수", value: data.weekSignups },
    { title: "이번 달 가입자 수", value: data.monthSignups },
    { title: "오늘 AI 요청 수", value: data.todayAiRequests },
    { title: "이번 주 AI 요청 수", value: data.weekAiRequests },
    { title: "이번 달 AI 요청 수", value: data.monthAiRequests },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((r) => (
        <article key={r.title} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950/40">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{r.title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-[#FEFEFE]">
            {r.value.toLocaleString()}
          </p>
        </article>
      ))}
    </section>
  );
}
