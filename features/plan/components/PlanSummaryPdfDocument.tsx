"use client";

import { useEffect, useMemo, type CSSProperties } from "react";

import { PLAN_ODYSSEY_YEAR_INDICES } from "@/features/plan/constants/plan.constants";
import type { PlanSummaryCategoryKey } from "@/features/plan/lib/plan-summary-stats";
import {
  computeCategoryAverages,
  formatDistanceOneDecimal,
  highestAndLowestCategory,
  overallAverageDistance,
  yearAverageDistance,
  yearWithHighestAverage,
} from "@/features/plan/lib/plan-summary-stats";
import type { PlanYearDto, SavedPlanResponse } from "@/features/plan/types/plan.types";

const CATEGORY_LABELS: Record<
  PlanSummaryCategoryKey,
  { en: string; ko: string }
> = {
  resources: { en: "RESOURCES", ko: "현실 여건과 자원" },
  interest: { en: "INTEREST", ko: "하고 싶은 마음" },
  confidence: { en: "CONFIDENCE", ko: "해낼 수 있다는 감각" },
  coherence: { en: "COHERENCE", ko: "나 다운 방향과의 일치감" },
};

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as PlanSummaryCategoryKey[];

/**
 * A4 landscape printable width: (297mm − 12mm×2 margin) at 96 CSS px/inch,
 * so the captured layout matches jsPDF’s usable width and fills the page.
 */
const PDF_W = Math.round(((297 - 24) / 25.4) * 96);

const textWrap: CSSProperties = {
  wordBreak: "keep-all" as const,
  overflowWrap: "break-word" as const,
};

const sheet: Record<string, CSSProperties> = {
  root: {
    width: PDF_W,
    boxSizing: "border-box",
    padding: "22px 26px 20px",
    fontFamily: '"Noto Sans KR", "Segoe UI", sans-serif',
    fontSize: 11,
    lineHeight: 1.5,
    color: "#18181b",
    overflowX: "hidden",
  },

  header: {
    marginBottom: 16,
  },
  brandRow: {
    margin: 0,
    fontSize: 22,
    lineHeight: 1,
    display: "flex",
    alignItems: "baseline",
    gap: "0.35em",
    letterSpacing: "-0.02em",
    color: "#09090b",
  },
  brandLogo: {
    fontFamily: "var(--font-landing-logo-brand)",
    fontWeight: "normal",
    fontStyle: "normal",
  },
  subTitle: {
    margin: "4px 0 0",
    fontSize: 15,
    fontWeight: 600,
    color: "#71717a",
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
    /** Same gap above and below the divider; keep logo-to-line tight. */
    marginTop: 6,
    paddingTop: 6,
    borderTop: "1px solid #e7e5e4",
    minWidth: 0,
  },
  metaTitleCol: {
    minWidth: 0,
    flex: 1,
    paddingRight: 8,
  },
  planTitle: {
    margin: 0,
    fontSize: 13,
    fontWeight: 600,
    color: "#27272a",
    ...textWrap,
  },
  metaText: {
    margin: 0,
    fontSize: 11,
    color: "#a1a1aa",
    flexShrink: 0,
    textAlign: "right" as const,
    maxWidth: "42%",
    ...textWrap,
  },

  yearGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 10,
    marginTop: 12,
    minWidth: 0,
    alignItems: "stretch",
  },
  /** Matches `YearDetailCard` on My Plan: min height + column flex. */
  yearCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e7e5e4",
    borderRadius: 16,
    padding: "14px 12px 14px",
    minWidth: 0,
    minHeight: 220,
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    overflowX: "hidden",
  },
  yearTop: {
    flexShrink: 0,
    minWidth: 0,
    width: "100%",
  },
  yearLabel: {
    margin: 0,
    fontSize: 15,
    fontWeight: 800,
    color: "#09090b",
    flexShrink: 0,
  },
  /**
   * 네이티브 `list-style: disc` + outside 는 PDF에서 마커–본문 간격이 과하게 벌어짐.
   * `•` + flex 로 간격을 고정한다.
   */
  goalList: {
    margin: "12px 0 0",
    padding: 0,
    marginLeft: 0,
    display: "flex",
    flexDirection: "column",
    gap: 0,
    fontSize: 11,
    lineHeight: 1.45,
    color: "#3f3f46",
    minWidth: 0,
    width: "100%",
    boxSizing: "border-box",
    listStyleType: "none",
  },
  goalListItem: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    listStyleType: "none",
  },
  goalListBullet: {
    flexShrink: 0,
    width: "0.55em",
    fontSize: 11,
    lineHeight: 1.45,
    color: "#52525b",
    textAlign: "center" as const,
    /** 한글 폰트에서 첫 줄과 점을 시각적으로 맞춤 */
    paddingTop: "0.12em",
  },
  goalListText: {
    flex: 1,
    minWidth: 0,
    letterSpacing: "normal",
    ...textWrap,
  },
  emptyText: {
    margin: "12px 0 0",
    fontSize: 11,
    lineHeight: 1.45,
    color: "#71717a",
    minWidth: 0,
    width: "100%",
    ...textWrap,
  },
  /** `mt-auto` block: keywords + note, then footer (same order as PlanSummary). */
  yearBottom: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    width: "100%",
  },
  keywordsNoteWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
    minWidth: 0,
    width: "100%",
  },
  yearNote: {
    margin: 0,
    fontSize: 10,
    lineHeight: 1.45,
    color: "#71717a",
    width: "100%",
    ...textWrap,
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    margin: 0,
    minWidth: 0,
    width: "100%",
  },
  chip: {
    backgroundColor: "#27272a",
    color: "#fafaf9",
    fontSize: 10,
    fontWeight: 600,
    borderRadius: 999,
    padding: "4px 10px",
    lineHeight: 1.35,
    maxWidth: "100%",
    boxSizing: "border-box",
    wordBreak: "keep-all" as const,
    overflowWrap: "break-word" as const,
  },
  footerRow: {
    paddingTop: 16,
    paddingBottom: 6,
    borderTop: "1px solid rgba(0,0,0,0.06)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    fontSize: 10,
    color: "#78716c",
    flexShrink: 0,
    minWidth: 0,
  },
  footerScoreWrap: {
    display: "flex",
    alignItems: "baseline",
    gap: 3,
    flexShrink: 0,
    fontVariantNumeric: "tabular-nums",
  },
  footerScoreValue: {
    fontSize: 13,
    fontWeight: 800,
    color: "#09090b",
  },
  footerScoreUnit: {
    fontSize: 9,
    fontWeight: 600,
    color: "#a1a1aa",
  },

  bottomRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.65fr) minmax(0, 1fr)",
    gap: 12,
    marginTop: 14,
    minWidth: 0,
    alignItems: "stretch",
  },
  panel: {
    backgroundColor: "#ffffff",
    border: "1px solid #e7e5e4",
    borderRadius: 18,
    padding: "16px 18px 16px",
    boxSizing: "border-box",
    minWidth: 0,
    overflowX: "hidden",
  },
  panelTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 800,
    color: "#09090b",
  },
  scoreRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    marginTop: 8,
  },
  bigScore: {
    margin: 0,
    fontSize: 26,
    fontWeight: 800,
    color: "#09090b",
    fontVariantNumeric: "tabular-nums",
  },
  scoreUnit: {
    fontSize: 12,
    color: "#a1a1aa",
    fontWeight: 600,
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
    minWidth: 0,
  },
  statItem: {
    backgroundColor: "#fafaf9",
    borderRadius: 12,
    padding: "10px 10px",
    minWidth: 0,
    overflow: "hidden",
  },
  statLabel: {
    margin: 0,
    fontSize: 9,
    color: "#a1a1aa",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  },
  statValue: {
    margin: "4px 0 0",
    fontSize: 12,
    fontWeight: 700,
    color: "#18181b",
    ...textWrap,
  },
  barTitle: {
    margin: "0 0 8px",
    fontSize: 11,
    fontWeight: 700,
    color: "#71717a",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  },
  barRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
    minWidth: 0,
  },
  barRowLast: {
    marginBottom: 0,
  },
  barYear: {
    width: 28,
    flexShrink: 0,
    fontSize: 11,
    fontWeight: 700,
    color: "#52525b",
  },
  barTrack: {
    flex: 1,
    minWidth: 0,
    height: 9,
    backgroundColor: "#ece7e2",
    borderRadius: 999,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#3f3f46",
    borderRadius: 999,
  },
  barValue: {
    minWidth: 40,
    flexShrink: 0,
    textAlign: "right" as const,
    fontSize: 11,
    fontWeight: 700,
    color: "#3f3f46",
    fontVariantNumeric: "tabular-nums",
    paddingLeft: 4,
  },

  catPanel: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100%",
  },
  catList: {
    display: "flex",
    flexDirection: "column",
    marginTop: 12,
    minWidth: 0,
    paddingBottom: 0,
  },
  catRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    padding: "16px 0",
    borderBottom: "1px solid #f0eeeb",
    minWidth: 0,
  },
  catRowLast: {
    paddingBottom: 0,
  },
  catLeft: {
    minWidth: 0,
    flex: 1,
    paddingRight: 8,
  },
  catEn: {
    margin: 0,
    fontSize: 12,
    fontWeight: 800,
    color: "#18181b",
    ...textWrap,
  },
  catKo: {
    margin: "4px 0 0",
    fontSize: 10,
    color: "#78716c",
    ...textWrap,
  },
  catScoreWrap: {
    margin: 0,
    display: "flex",
    alignItems: "baseline",
    gap: 4,
    flexShrink: 0,
    paddingTop: 4,
    whiteSpace: "nowrap" as const,
    fontVariantNumeric: "tabular-nums",
  },
  catScoreValue: {
    fontSize: 14,
    fontWeight: 800,
    color: "#09090b",
  },
  catScoreUnit: {
    fontSize: 9,
    fontWeight: 600,
    color: "#a1a1aa",
  },
};

/** Local calendar date as `YYYY/MM/DD` (zero-padded). */
function formatGeneratedAt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

function sortedGoals(y: PlanYearDto) {
  return [...y.goals].sort((a, b) => a.position - b.position);
}

function sortedKeywords(y: PlanYearDto) {
  return [...y.keywords].sort((a, b) => a.position - b.position);
}

export type PlanSummaryPdfDocumentProps = {
  plan: SavedPlanResponse;
  /** Defaults to current date when exporting from My Plan. */
  generatedAt?: Date;
};

/**
 * Puppeteer print layout: fixed inline styles; `html[data-pdf-ready]` after fonts load.
 */
export function PlanSummaryPdfDocument({
  plan,
  generatedAt,
}: PlanSummaryPdfDocumentProps) {
  const at = generatedAt ?? new Date();

  useEffect(() => {
    void (async () => {
      try {
        await document.fonts.ready;
      } finally {
        document.documentElement.setAttribute("data-pdf-ready", "true");
      }
    })();
  }, []);

  const { byYear, overall, categoryAvgs, highest, lowest, bestYearIdx } =
    useMemo(() => {
      const by = new Map(plan.years.map((y) => [y.yearIndex, y]));
      const ordered = PLAN_ODYSSEY_YEAR_INDICES.map((idx) => by.get(idx)).filter(
        (y): y is PlanYearDto => y != null,
      );

      const avgs = computeCategoryAverages(ordered);
      const { highest, lowest } = highestAndLowestCategory(avgs);

      return {
        byYear: by,
        overall: overallAverageDistance(ordered),
        categoryAvgs: avgs,
        highest,
        lowest,
        bestYearIdx: yearWithHighestAverage(ordered),
      };
    }, [plan]);

  return (
    <div data-pdf-root style={sheet.root}>
      <header style={sheet.header}>
        <h1 style={sheet.brandRow}>
          <span style={sheet.brandLogo}>MY</span>
          <span style={sheet.brandLogo}>ODYSSEY</span>
        </h1>
        {/* <p style={sheet.subTitle}>5-Year Summary</p> */}

        <div style={sheet.metaRow}>
          <div style={sheet.metaTitleCol}>
            {plan.title ? (
              <p style={sheet.planTitle}>{plan.title}</p>
            ) : (
              <p style={sheet.planTitle}>My 5-Year Plan</p>
            )}
          </div>
          <p style={sheet.metaText}>Generated on {formatGeneratedAt(at)}</p>
        </div>
      </header>

      <section style={sheet.yearGrid} aria-label="연도별 요약">
        {PLAN_ODYSSEY_YEAR_INDICES.map((idx) => {
          const year = byYear.get(idx);
          const avg = year ? yearAverageDistance(year.scores) : null;
          const goals = year ? sortedGoals(year) : [];
          const keywords = year ? sortedKeywords(year) : [];
          const noteText = year?.note?.trim();

          return (
            <article key={idx} style={sheet.yearCard}>
              <div style={sheet.yearTop}>
                <h2 style={sheet.yearLabel}>{idx}Y</h2>

                {goals.length > 0 ? (
                  <ul style={sheet.goalList}>
                    {goals.map((goal, gi) => (
                      <li
                        key={goal.id}
                        style={{
                          ...sheet.goalListItem,
                          marginBottom: gi === goals.length - 1 ? 0 : 6,
                        }}
                      >
                        <span style={sheet.goalListBullet} aria-hidden>
                          •
                        </span>
                        <span style={sheet.goalListText}>{goal.text}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={sheet.emptyText}>목표 없음</p>
                )}
              </div>

              <div style={sheet.yearBottom}>
                {keywords.length > 0 || noteText ? (
                  <div style={sheet.keywordsNoteWrap}>
                    {keywords.length > 0 ? (
                      <div style={sheet.chipRow}>
                        {keywords.map((keyword) => (
                          <span key={keyword.id} style={sheet.chip}>
                            {keyword.text}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {noteText ? (
                      <p style={sheet.yearNote}>{noteText}</p>
                    ) : null}
                  </div>
                ) : null}

                <div style={sheet.footerRow}>
                  <span>평균 거리</span>
                  {avg != null ? (
                    <span style={sheet.footerScoreWrap}>
                      <span style={sheet.footerScoreValue}>
                        {formatDistanceOneDecimal(avg)}
                      </span>
                      <span style={sheet.footerScoreUnit}>/ 5</span>
                    </span>
                  ) : (
                    <span style={sheet.footerScoreValue}>—</span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <div style={sheet.bottomRow}>
        <section style={sheet.panel} aria-label="전체 평균">
          <h3 style={sheet.panelTitle}>전체 평균 거리</h3>

          <div style={sheet.scoreRow}>
            <p style={sheet.bigScore}>{formatDistanceOneDecimal(overall)}</p>
            <span style={sheet.scoreUnit}>/ 5</span>
          </div>

          <div style={sheet.statGrid}>
            <div style={sheet.statItem}>
              <p style={sheet.statLabel}>Highest</p>
              <p style={sheet.statValue}>{CATEGORY_LABELS[highest].en}</p>
            </div>
            <div style={sheet.statItem}>
              <p style={sheet.statLabel}>Lowest</p>
              <p style={sheet.statValue}>{CATEGORY_LABELS[lowest].en}</p>
            </div>
            <div style={sheet.statItem}>
              <p style={sheet.statLabel}>Best Year</p>
              <p style={sheet.statValue}>
                {bestYearIdx != null ? `${bestYearIdx}Y` : "—"}
              </p>
            </div>
          </div>

          <p style={sheet.barTitle}>Yearly Average</p>
          {PLAN_ODYSSEY_YEAR_INDICES.map((idx, bi) => {
            const year = byYear.get(idx);
            const value = year ? yearAverageDistance(year.scores) : 0;
            const width = `${Math.max(0, Math.min(100, (value / 5) * 100))}%`;
            const isLastBar =
              bi === PLAN_ODYSSEY_YEAR_INDICES.length - 1;

            return (
              <div
                key={idx}
                style={{
                  ...sheet.barRow,
                  ...(isLastBar ? sheet.barRowLast : {}),
                }}
              >
                <span style={sheet.barYear}>{idx}Y</span>
                <div style={sheet.barTrack}>
                  <div style={{ ...sheet.barFill, width }} />
                </div>
                <span style={sheet.barValue}>
                  {formatDistanceOneDecimal(value)}
                </span>
              </div>
            );
          })}
        </section>

        <section
          style={{ ...sheet.panel, ...sheet.catPanel }}
          aria-label="항목별 평균"
        >
          <h3 style={sheet.panelTitle}>항목별 평균</h3>

          <div style={sheet.catList}>
            {CATEGORY_KEYS.map((key, i) => (
              <div
                key={key}
                style={{
                  ...sheet.catRow,
                  ...(i === CATEGORY_KEYS.length - 1
                    ? { ...sheet.catRowLast, borderBottom: "none" }
                    : {}),
                }}
              >
                <div style={sheet.catLeft}>
                  <p style={sheet.catEn}>{CATEGORY_LABELS[key].en}</p>
                  <p style={sheet.catKo}>{CATEGORY_LABELS[key].ko}</p>
                </div>

                <p style={sheet.catScoreWrap}>
                  <span style={sheet.catScoreValue}>
                    {formatDistanceOneDecimal(categoryAvgs[key])}
                  </span>
                  <span style={sheet.catScoreUnit}>/ 5</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
