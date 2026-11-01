"use client";

import { Fragment, useEffect, type CSSProperties } from "react";

import { PLAN_ODYSSEY_YEAR_INDICES } from "@/features/plan/constants/plan.constants";
import { buildOneSheet, type OneSheetColumn } from "@/features/plan/lib/plan-one-sheet";
import type { SavedPlanResponse } from "@/features/plan/types/plan.types";

/** A4 landscape printable width with 8mm margins, at 96 CSS px per inch. */
const PDF_W = Math.round(((297 - 16) / 25.4) * 96);
const RAIL_W = 48;
/** Slightly under the printable height, so the sheet fills the page at full scale. */
const PDF_MIN_H = 716;

/** 10pt, the smallest size here: the renderer stops at 0.9, so nothing prints under 9pt. */
const BODY = 13.3;

const wrap: CSSProperties = { wordBreak: "keep-all", overflowWrap: "anywhere" };
const INK = "#1a1a18";
const MUTED = "#5f5e58";
const RAIL = "#d8d6cf";
/** Column colors are 6-digit hex, so these suffixes make them translucent. */
const TINT = "1c";
const EDGE = "55";

const s: Record<string, CSSProperties> = {
  root: {
    width: PDF_W,
    minHeight: PDF_MIN_H,
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    fontFamily: '"Noto Sans KR", "Segoe UI", sans-serif',
    fontSize: BODY,
    lineHeight: 1.28,
    color: INK,
    printColorAdjust: "exact",
  },
  body: { flex: 1, display: "flex", flexDirection: "column" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 },
  title: { margin: 0, fontSize: 20, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.01em", ...wrap },
  meta: { margin: 0, color: MUTED, whiteSpace: "nowrap" },
  note: { margin: "0 0 6px", color: MUTED },
  grid: { flex: 1, display: "grid", columnGap: 8 },
  panel: { borderRadius: 10 },
  rail: { justifySelf: "center", width: 2, backgroundColor: RAIL, margin: "10px 0" },
  yearCell: { display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 3 },
  yearDot: {
    position: "relative",
    padding: "1px 7px",
    borderRadius: 999,
    backgroundColor: INK,
    color: "#fff",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  railLabel: {
    position: "relative",
    fontWeight: 700,
    color: MUTED,
    textAlign: "center",
    paddingTop: 8,
  },
  head: { position: "relative", padding: "6px 10px 5px", minWidth: 0 },
  badge: { margin: 0, display: "flex", alignItems: "center", gap: 6, fontWeight: 600, color: MUTED },
  letter: {
    display: "inline-flex",
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    color: "#fff",
    fontWeight: 800,
  },
  pathTitle: { margin: "1px 0 0", fontSize: 15, fontWeight: 800, lineHeight: 1.22, ...wrap },
  tagline: { margin: 0, color: MUTED, ...wrap },
  card: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    margin: "0 5px 3px",
    padding: "3px 8px",
    minWidth: 0,
    boxSizing: "border-box",
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  goal: { margin: 0, fontWeight: 700, ...wrap },
  action: { margin: 0, color: "#3f3f3a", ...wrap },
  prep: {
    position: "relative",
    margin: "2px 5px 5px",
    padding: "3px 8px",
    minWidth: 0,
    boxSizing: "border-box",
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  label: { margin: "2px 0 0", fontWeight: 700 },
  name: { fontWeight: 700 },
  line: { margin: 0, ...wrap },
  status: { color: MUTED },
  rating: { margin: "1px 0 0", color: MUTED, ...wrap },
};

function Preparation({ column }: { column: OneSheetColumn }) {
  // The orange is too light for text on white, so color marks the label instead.
  const label = { ...s.label, borderLeft: `3px solid ${column.color}`, paddingLeft: 5 };
  return (
    <>
      <p style={{ ...label, marginTop: 0 }}>추천 공부</p>
      {column.studies.length ? (
        column.studies.map((study) => (
          <p key={study.title} style={s.line}>
            <span style={s.name}>{study.title}</span> → {study.purpose}
          </p>
        ))
      ) : (
        <p style={s.line}>1년차를 해보며 필요한 공부를 찾아보세요</p>
      )}

      <p style={label}>추천 자격증·교육</p>
      {column.credential ? (
        <p style={s.line}>
          <span style={s.name}>{column.credential.name}</span> → {column.credential.reason}{" "}
          <span style={s.status}>({column.credential.status})</span>
        </p>
      ) : (
        <p style={s.line}>{column.credentialNote}</p>
      )}

      {column.firstStep ? (
        <>
          <p style={label}>먼저 해볼 일</p>
          <p style={s.line}>{column.firstStep}</p>
        </>
      ) : null}

      {column.rating ? <p style={s.rating}>{column.rating}</p> : null}
    </>
  );
}

export type PlanOneSheetPdfProps = {
  plan: SavedPlanResponse;
  generatedAt?: Date;
};

/** One A4 landscape map of the futures: a year rail beside color cards that stay aligned by year. */
export function PlanOneSheetPdf({ plan, generatedAt }: PlanOneSheetPdfProps) {
  const at = generatedAt ?? new Date();
  const sheet = buildOneSheet(plan);
  const { columns } = sheet;
  const showPreparation = columns.some((c) => c.key !== "legacy");
  const yearCount = PLAN_ODYSSEY_YEAR_INDICES.length;
  const prepRow = yearCount + 2;

  useEffect(() => {
    void (async () => {
      try {
        await document.fonts.ready;
      } finally {
        document.documentElement.setAttribute("data-pdf-ready", "true");
      }
    })();
  }, []);

  const gridTemplateColumns = `${RAIL_W}px repeat(${columns.length}, minmax(0, 1fr))`;
  const gridTemplateRows = `auto repeat(${yearCount}, minmax(auto, 1fr))${showPreparation ? " auto" : ""}`;

  return (
    <div data-pdf-root style={s.root}>
      <div data-pdf-summary style={s.body}>
        <header style={s.header}>
          <h1 style={s.title}>{sheet.title}</h1>
          <p style={s.meta}>
            MY ODYSSEY · {at.getFullYear()}.{String(at.getMonth() + 1).padStart(2, "0")}.
            {String(at.getDate()).padStart(2, "0")}
          </p>
        </header>
        <p style={s.note}>
          {showPreparation
            ? "세 경로는 우열이 아니라 함께 살펴보는 가능성입니다."
            : "저장된 5년 계획의 요약입니다."}
          {sheet.hasLegacyPlan ? " 기존 단일 계획은 웹에서 볼 수 있습니다." : ""}
        </p>

        <div style={{ ...s.grid, gridTemplateColumns, gridTemplateRows }}>
          {/* Panels and the rail sit behind the cards, which share their grid rows. */}
          <div style={{ ...s.rail, gridColumn: 1, gridRow: `2 / ${yearCount + 2}` }} />
          {columns.map((column, columnIndex) => (
            <div
              key={`panel-${column.key}`}
              style={{
                ...s.panel,
                gridColumn: columnIndex + 2,
                gridRow: "1 / -1",
                backgroundColor: `${column.color}${TINT}`,
                border: `1px solid ${column.color}${EDGE}`,
                borderTop: `3px solid ${column.color}`,
              }}
            />
          ))}

          {columns.map((column, columnIndex) => (
            <div key={column.key} style={{ ...s.head, gridColumn: columnIndex + 2, gridRow: 1 }}>
              <p style={s.badge}>
                {column.letter ? (
                  <span style={{ ...s.letter, backgroundColor: column.color }}>{column.letter}</span>
                ) : null}
                {column.name}
              </p>
              <p style={s.pathTitle}>{column.title}</p>
              {column.tagline ? <p style={s.tagline}>{column.tagline}</p> : null}
            </div>
          ))}

          {PLAN_ODYSSEY_YEAR_INDICES.map((year, rowIndex) => (
            <Fragment key={year}>
              <div style={{ ...s.yearCell, gridColumn: 1, gridRow: rowIndex + 2 }}>
                <span style={s.yearDot}>{year}년</span>
              </div>
              {columns.map((column, columnIndex) => {
                const cell = column.years[rowIndex];
                return (
                  <div
                    key={column.key}
                    style={{ ...s.card, gridColumn: columnIndex + 2, gridRow: rowIndex + 2 }}
                  >
                    {cell?.goal ? <p style={s.goal}>{cell.goal}</p> : null}
                    {cell?.action ? <p style={s.action}>{cell.action}</p> : null}
                    {!cell?.goal ? <p style={{ ...s.action, color: MUTED }}>비어 있음</p> : null}
                  </div>
                );
              })}
            </Fragment>
          ))}

          {showPreparation ? (
            <>
              <div style={{ ...s.railLabel, gridColumn: 1, gridRow: prepRow }}>준비</div>
              {columns.map((column, columnIndex) => (
                <div key={column.key} style={{ ...s.prep, gridColumn: columnIndex + 2, gridRow: prepRow }}>
                  <Preparation column={column} />
                </div>
              ))}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
