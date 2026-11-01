"use client";

import { useEffect, type CSSProperties } from "react";

import {
  PLAN_LEGACY_LABEL,
  PLAN_PATHS,
  PLAN_PATH_MARK_LABELS,
  PLAN_PATH_SCORE_MEANINGS,
} from "@/features/plan/constants/plan-path.constants";
import {
  PLAN_RATING_SCALE_NOTE,
  PLAN_SCORE_KEYS,
  PLAN_SCORE_LABELS,
  PLAN_UNRATED_LABEL,
} from "@/features/plan/constants/plan-score.constants";
import {
  PLAN_PREPARATION_KIND_LABELS,
  PLAN_PREPARATION_NOTE,
  PLAN_PREPARATION_PRIORITY_LABELS,
  PLAN_PREPARATION_SHARED_TITLE,
  PLAN_PREPARATION_TITLE,
  PLAN_PREPARATION_UNVERIFIED_LABEL,
  findPreparationCatalogEntry,
} from "@/features/plan/constants/plan-preparation.constants";
import { describeEvidenceQuestions } from "@/features/plan/lib/plan-ai-guidance";
import type {
  PlanPathDto,
  PlanPreparation,
  SavedPlanResponse,
} from "@/features/plan/types/plan.types";

import { PdfYearDetailCard } from "./PlanSummaryPdfDocument";

/** A4 landscape printable width, matching the single plan document. */
const PDF_W = Math.round(((297 - 24) / 25.4) * 96);

const wrap: CSSProperties = { wordBreak: "keep-all", overflowWrap: "break-word" };

const s: Record<string, CSSProperties> = {
  root: {
    width: PDF_W,
    boxSizing: "border-box",
    padding: "22px 26px 20px",
    fontFamily: '"Noto Sans KR", "Segoe UI", sans-serif',
    fontSize: 12,
    lineHeight: 1.5,
    color: "#18181b",
  },
  brand: { margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" },
  planTitle: { margin: "4px 0 0", fontSize: 14, fontWeight: 600, color: "#27272a", ...wrap },
  meta: { margin: "2px 0 0", fontSize: 10, color: "#71717a" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
    marginTop: 14,
  },
  card: {
    border: "1px solid #dedcd5",
    borderRadius: 10,
    padding: "12px 14px",
    boxSizing: "border-box",
    minWidth: 0,
    breakInside: "avoid",
  },
  badge: { display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#52524c" },
  letter: {
    display: "inline-flex",
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
  },
  title: { margin: "6px 0 0", fontSize: 14, fontWeight: 700, lineHeight: 1.4, ...wrap },
  text: { margin: "4px 0 0", fontSize: 12, lineHeight: 1.5, color: "#3f3f46", ...wrap },
  section: { breakBefore: "page" },
  heading: { margin: 0, fontSize: 16, fontWeight: 800, breakAfter: "avoid", ...wrap },
  label: { margin: "10px 0 0", fontSize: 11, fontWeight: 700, color: "#52525b", breakAfter: "avoid" },
  list: { margin: "2px 0 0", paddingLeft: 16, fontSize: 12, lineHeight: 1.5, color: "#27272a", ...wrap },
  columns: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "0 20px",
  },
  table: { width: "100%", marginTop: 8, borderCollapse: "collapse", fontSize: 12 },
  th: { textAlign: "left", padding: "6px 8px 6px 0", borderBottom: "1px solid #dedcd5", fontWeight: 600 },
  td: { padding: "6px 8px 6px 0", borderBottom: "1px solid #ecebe6", verticalAlign: "top", ...wrap },
};

function Badge({ path }: { path: PlanPathDto }) {
  const { letter, name, color } = PLAN_PATHS[path.kind];
  return (
    <p style={{ ...s.badge, margin: 0 }}>
      <span style={{ ...s.letter, backgroundColor: color }}>{letter}</span>
      {name}
    </p>
  );
}

function Lines({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p style={s.label}>{label}</p>
      <ul style={s.list}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Preparations({ title, items }: { title: string; items: PlanPreparation[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p style={s.label}>{title}</p>
      {items.map((item) => {
        const entry = findPreparationCatalogEntry(item.catalogId);
        return (
          <div key={item.title} style={{ breakInside: "avoid", marginTop: 4 }}>
            <p style={{ ...s.text, fontWeight: 600 }}>
              {item.title} ({PLAN_PREPARATION_KIND_LABELS[item.kind]} ·{" "}
              {PLAN_PREPARATION_PRIORITY_LABELS[item.priority]} ·{" "}
              {entry ? entry.requirementLabel : PLAN_PREPARATION_UNVERIFIED_LABEL})
            </p>
            <p style={s.text}>
              {item.reason} 마치면: {item.checkpoint}
              {item.conditions ? ` 확인할 조건: ${item.conditions}` : ""}
              {item.alternative ? ` 자격 없이 확인: ${item.alternative}` : ""}
            </p>
            {entry ? (
              <p style={{ ...s.text, fontSize: 10, color: "#71717a" }}>
                근거 {entry.basis} · {entry.sourceName} {entry.sourceUrl} · {entry.checkedAt} 확인
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function PathSection({
  path,
  shared,
}: {
  path: PlanPathDto;
  shared: PlanPreparation[];
}) {
  const evidence = describeEvidenceQuestions(path.appealQuestionIds);
  return (
    <section style={s.section}>
      <Badge path={path} />
      <h2 style={{ ...s.heading, marginTop: 4 }}>{path.title}</h2>
      {path.overview ? <p style={s.text}>{path.overview}</p> : null}
      {path.appeal ? (
        <div>
          <p style={s.label}>이 경로가 끌리는 이유</p>
          <p style={s.text}>{path.appeal}</p>
          {evidence.length ? (
            <p style={{ ...s.text, fontSize: 11, color: "#71717a" }}>
              연결된 질문: {evidence.join(" / ")}
            </p>
          ) : null}
        </div>
      ) : null}
      <div style={s.columns}>
        <Lines label="필요한 자원과 조건" items={path.requirements} />
        <Lines label="아직 확인하지 못한 질문" items={path.openQuestions} />
      </div>
      <Preparations title={PLAN_PREPARATION_TITLE} items={path.preparations} />
      {path.preparations.length || shared.length ? (
        <p style={{ ...s.text, fontSize: 10, color: "#71717a" }}>{PLAN_PREPARATION_NOTE}</p>
      ) : null}
      {path.years.map((year) => (
        <PdfYearDetailCard key={year.id} year={year} showRatings={false} />
      ))}
    </section>
  );
}

export type PlanPathsPdfDocumentProps = {
  plan: SavedPlanResponse;
  generatedAt?: Date;
};

/** Overview of the three paths, each path in full, then ratings and experiments. */
export function PlanPathsPdfDocument({ plan, generatedAt }: PlanPathsPdfDocumentProps) {
  const at = generatedAt ?? new Date();
  const { paths } = plan;
  const legacyYears = plan.years.filter((y) => y.goals.length > 0);

  useEffect(() => {
    void (async () => {
      try {
        await document.fonts.ready;
      } finally {
        document.documentElement.setAttribute("data-pdf-ready", "true");
      }
    })();
  }, []);

  return (
    <div data-pdf-root style={s.root}>
      <div data-pdf-summary>
        <h1 style={s.brand}>MY ODYSSEY</h1>
        <p style={s.planTitle}>{plan.title ?? "나의 세 가지 5년"}</p>
        <p style={s.meta}>
          {at.getFullYear()}/{String(at.getMonth() + 1).padStart(2, "0")}/
          {String(at.getDate()).padStart(2, "0")} · 세 경로는 우열이 아니라 함께 살펴보는 가능성입니다.
        </p>
        <div data-pdf-year-grid style={s.grid}>
          {paths.map((path) => (
            <article
              key={path.kind}
              style={{ ...s.card, borderTop: `2px solid ${PLAN_PATHS[path.kind].color}` }}
            >
              <Badge path={path} />
              <h2 style={s.title}>{path.title}</h2>
              <p style={s.text}>{path.overview || "아직 개요가 없습니다."}</p>
              {path.years[0]?.goals[0] ? (
                <>
                  <p style={s.label}>1년차</p>
                  <p style={s.text}>{path.years[0].goals[0].text}</p>
                </>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      {paths.map((path) => (
        <PathSection key={path.kind} path={path} shared={plan.sharedPreparations} />
      ))}

      <section style={s.section}>
        <h2 style={s.heading}>자기평가와 작은 실험</h2>
        <Preparations title={PLAN_PREPARATION_SHARED_TITLE} items={plan.sharedPreparations} />
        <p style={{ ...s.text, fontSize: 11 }}>
          경로 전체에 대한 자기평가입니다. {PLAN_RATING_SCALE_NOTE}
        </p>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>항목</th>
              {paths.map((path) => (
                <th key={path.kind} style={s.th}>
                  {PLAN_PATHS[path.kind].letter}. {path.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLAN_SCORE_KEYS.map((key) => (
              <tr key={key}>
                <td style={s.td}>
                  {PLAN_SCORE_LABELS[key].ko}
                  <span style={{ display: "block", fontSize: 10, color: "#71717a" }}>
                    {PLAN_PATH_SCORE_MEANINGS[key]}
                  </span>
                </td>
                {paths.map((path) => (
                  <td key={path.kind} style={s.td}>
                    {path.scores[key] ?? PLAN_UNRATED_LABEL}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td style={s.td}>내 표시</td>
              {paths.map((path) => (
                <td key={path.kind} style={s.td}>
                  {path.marks.map((mark) => PLAN_PATH_MARK_LABELS[mark]).join(", ") || "—"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {paths.map((path) =>
          path.experiments.length ? (
            <div key={path.kind} style={{ breakInside: "avoid" }}>
              <p style={s.label}>
                {PLAN_PATHS[path.kind].letter}. {path.title}의 작은 실험
              </p>
              <ul style={s.list}>
                {path.experiments.map((experiment, index) => (
                  <li key={index}>
                    {experiment.nextUp ? <strong>[먼저 해볼 실험] </strong> : null}
                    {experiment.action} (확인할 것: {experiment.learning})
                  </li>
                ))}
              </ul>
            </div>
          ) : null,
        )}
      </section>

      {legacyYears.length ? (
        <section style={s.section}>
          <h2 style={s.heading}>{PLAN_LEGACY_LABEL}</h2>
          {legacyYears.map((year) => (
            <PdfYearDetailCard key={year.id} year={year} />
          ))}
        </section>
      ) : null}
    </div>
  );
}
