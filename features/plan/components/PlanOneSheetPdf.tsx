"use client";

import { Fragment, useEffect, type CSSProperties } from "react";

import { PLAN_ODYSSEY_YEAR_INDICES } from "@/features/plan/constants/plan.constants";
import { buildOneSheet, type OneSheetColumn } from "@/features/plan/lib/plan-one-sheet";
import type { SavedPlanResponse } from "@/features/plan/types/plan.types";

/** A4 landscape printable width with 8mm margins, at 96 CSS px per inch. */
const PDF_W = Math.round(((297 - 16) / 25.4) * 96);
const YEAR_COLUMN = 52;
/** Slightly under the printable height, so the sheet fills the page at full scale. */
const PDF_MIN_H = 716;

/** 10pt, the smallest size here: the renderer stops at 0.9, so nothing prints under 9pt. */
const BODY = 13.3;

const wrap: CSSProperties = { wordBreak: "keep-all", overflowWrap: "anywhere" };
const LINE = "#dedcd5";
const INK = "#1a1a18";
const MUTED = "#5f5e58";

const s: Record<string, CSSProperties> = {
  root: {
    width: PDF_W,
    minHeight: PDF_MIN_H,
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    fontFamily: '"Noto Sans KR", "Segoe UI", sans-serif',
    fontSize: BODY,
    lineHeight: 1.3,
    color: INK,
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 },
  title: { margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.25, ...wrap },
  meta: { margin: 0, fontSize: BODY, color: MUTED, whiteSpace: "nowrap" },
  note: { margin: "1px 0 5px", fontSize: BODY, color: MUTED },
  body: { flex: 1, display: "flex", flexDirection: "column" },
  grid: { flex: 1, display: "grid", borderTop: `1px solid ${LINE}` },
  cell: {
    padding: "3px 7px",
    borderBottom: `1px solid ${LINE}`,
    borderLeft: `1px solid ${LINE}`,
    minWidth: 0,
    boxSizing: "border-box",
  },
  yearCell: {
    padding: "3px 4px 3px 0",
    borderBottom: `1px solid ${LINE}`,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  badge: { display: "flex", alignItems: "center", gap: 5, fontWeight: 600, color: MUTED },
  letter: {
    display: "inline-flex",
    width: 17,
    height: 17,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 3,
    color: "#fff",
    fontWeight: 700,
  },
  pathTitle: { margin: "1px 0 0", fontSize: 14, fontWeight: 700, lineHeight: 1.25, ...wrap },
  tagline: { margin: 0, color: MUTED, ...wrap },
  goal: { margin: 0, fontWeight: 600, ...wrap },
  action: { margin: 0, color: "#3f3f3a", ...wrap },
  label: { margin: "3px 0 0", fontWeight: 700, color: MUTED },
  name: { fontWeight: 700 },
  line: { margin: 0, ...wrap },
  status: { color: MUTED },
  rating: { margin: "2px 0 0", color: MUTED, ...wrap },
};

function Preparation({ column }: { column: OneSheetColumn }) {
  return (
    <>
      <p style={{ ...s.label, marginTop: 0 }}>추천 공부</p>
      {column.studies.length ? (
        column.studies.map((study) => (
          <p key={study.title} style={s.line}>
            <span style={s.name}>{study.title}</span> → {study.purpose}
          </p>
        ))
      ) : (
        <p style={s.line}>먼저 작은 실험으로 필요한 공부를 찾아보세요</p>
      )}

      <p style={s.label}>추천 자격증·교육</p>
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
          <p style={s.label}>먼저 해볼 일</p>
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

/** One A4 landscape map of the futures: same years in a row, preparation below. */
export function PlanOneSheetPdf({ plan, generatedAt }: PlanOneSheetPdfProps) {
  const at = generatedAt ?? new Date();
  const sheet = buildOneSheet(plan);
  const { columns } = sheet;
  const showPreparation = columns.some((c) => c.key !== "legacy");

  useEffect(() => {
    void (async () => {
      try {
        await document.fonts.ready;
      } finally {
        document.documentElement.setAttribute("data-pdf-ready", "true");
      }
    })();
  }, []);

  const gridTemplateColumns = `${YEAR_COLUMN}px repeat(${columns.length}, minmax(0, 1fr))`;
  const gridTemplateRows = `auto repeat(${PLAN_ODYSSEY_YEAR_INDICES.length}, 1fr)${showPreparation ? " auto" : ""}`;

  return (
    <div data-pdf-root style={s.root}>
      <div data-pdf-summary style={s.body}>
        <div style={s.body}>
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
            <div style={s.yearCell} />
            {columns.map((column) => (
              <div
                key={column.key}
                style={{ ...s.cell, borderTop: `2px solid ${column.color}` }}
              >
                <p style={{ ...s.badge, margin: 0 }}>
                  {column.letter ? (
                    <span style={{ ...s.letter, backgroundColor: column.color }}>
                      {column.letter}
                    </span>
                  ) : null}
                  {column.name}
                </p>
                <p style={s.pathTitle}>{column.title}</p>
                {column.tagline ? <p style={s.tagline}>{column.tagline}</p> : null}
              </div>
            ))}

            {PLAN_ODYSSEY_YEAR_INDICES.map((year, rowIndex) => (
              <Fragment key={year}>
                <div style={s.yearCell}>{year}년차</div>
                {columns.map((column) => {
                  const cell = column.years[rowIndex];
                  return (
                    <div key={column.key} style={s.cell}>
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
                <div style={{ ...s.yearCell, whiteSpace: "normal", borderBottom: "none" }}>준비</div>
                {columns.map((column) => (
                  <div key={column.key} style={{ ...s.cell, borderBottom: "none" }}>
                    <Preparation column={column} />
                  </div>
                ))}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
