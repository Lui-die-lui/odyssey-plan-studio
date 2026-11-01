"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { Notice } from "@/components/common/Notice";
import { buttonClass, helpTextClass, sectionTitleClass } from "@/components/common/ui";
import { computePlanFill } from "@/features/field/future-field-core";
import { setFieldFill } from "@/features/field/future-field-store";

import {
  PLAN_LEGACY_LABEL,
  PLAN_PATHS,
  PLAN_PATH_MARK_LABELS,
  PLAN_PATH_SCORE_MEANINGS,
} from "../constants/plan-path.constants";
import {
  PLAN_RATING_SCALE_NOTE,
  PLAN_SCORE_KEYS,
  PLAN_SCORE_LABELS,
  PLAN_UNRATED_LABEL,
} from "../constants/plan-score.constants";
import { describeEvidenceQuestions } from "../lib/plan-ai-guidance";
import type { PlanPathDto, SavedPlanResponse } from "../types/plan.types";
import { PlanPathBadge } from "./PlanPathBadge";
import PlanSummary from "./PlanSummary";

const LEGACY_TAB = "legacy";
const pathTabId = (key: string) => `plan-path-tab-${key}`;
const PATH_PANEL_ID = "plan-path-panel";

function TextList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h3 className="text-sm font-medium text-ink-3">{title}</h3>
      <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-5 text-[15px] leading-relaxed text-ink-2">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function PathDetails({ path }: { path: PlanPathDto }) {
  const evidence = describeEvidenceQuestions(path.appealQuestionIds);

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-5 sm:p-7">
      {path.overview ? (
        <p className="text-[15px] leading-relaxed text-ink">{path.overview}</p>
      ) : (
        <p className={helpTextClass}>아직 개요가 없어요. 수정 화면에서 적을 수 있습니다.</p>
      )}

      {path.appeal ? (
        <section>
          <h3 className="text-sm font-medium text-ink-3">이 경로가 끌리는 이유</h3>
          <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{path.appeal}</p>
          {evidence.length ? (
            <details className="mt-1 text-xs text-ink-3">
              <summary className="flex min-h-11 items-center">연결된 질문 보기</summary>
              <ul className="list-disc pl-4">
                {evidence.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <TextList title="필요한 자원과 조건" items={path.requirements} />
        <TextList title="아직 확인하지 못한 질문" items={path.openQuestions} />
      </div>

      {path.experiments.length ? (
        <section>
          <h3 className="text-sm font-medium text-ink-3">작은 실험</h3>
          <ul className="mt-1.5 flex flex-col gap-3">
            {path.experiments.map((experiment, index) => (
              <li key={index} className="border-l-2 border-line-strong pl-3">
                <p className="text-[15px] leading-relaxed text-ink">
                  {experiment.nextUp ? (
                    <span className="mr-1.5 text-xs font-medium text-accent">먼저 해볼 실험</span>
                  ) : null}
                  {experiment.action}
                </p>
                <p className="text-sm leading-relaxed text-ink-3">확인할 것: {experiment.learning}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function PathComparison({ paths }: { paths: PlanPathDto[] }) {
  const nextExperiments = paths.flatMap((path) =>
    path.experiments
      .filter((experiment) => experiment.nextUp)
      .map((experiment) => ({ kind: path.kind, action: experiment.action })),
  );

  return (
    <section aria-labelledby="plan-path-compare" className="border-t border-line pt-6">
      <h2 id="plan-path-compare" className={sectionTitleClass}>
        지금 내가 느끼는 세 경로
      </h2>
      <p className={`${helpTextClass} mt-0.5`}>
        경로 전체에 대한 자기평가입니다. {PLAN_RATING_SCALE_NOTE} 합산하거나 순위를 매기지 않아요.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="py-2 pr-4 font-normal text-ink-3">
                항목
              </th>
              {paths.map((path) => (
                <th key={path.kind} scope="col" className="py-2 pr-4 font-normal">
                  <PlanPathBadge kind={path.kind} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLAN_SCORE_KEYS.map((key) => (
              <tr key={key} className="border-b border-line">
                <th scope="row" className="py-2 pr-4 text-left font-normal text-ink-2">
                  {PLAN_SCORE_LABELS[key].ko}
                  <span className="block text-xs text-ink-3">{PLAN_PATH_SCORE_MEANINGS[key]}</span>
                </th>
                {paths.map((path) => (
                  <td key={path.kind} className="py-2 pr-4 tabular-nums text-ink-2">
                    {path.scores[key] ?? PLAN_UNRATED_LABEL}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row" className="py-2 pr-4 text-left font-normal text-ink-2">
                내 표시
              </th>
              {paths.map((path) => (
                <td key={path.kind} className="py-2 pr-4 text-ink-2">
                  {path.marks.length
                    ? path.marks.map((mark) => PLAN_PATH_MARK_LABELS[mark]).join(", ")
                    : "—"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {nextExperiments.length ? (
        <div className="mt-5">
          <h3 className="text-sm font-medium text-ink-3">먼저 시험해 볼 행동</h3>
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {nextExperiments.map((experiment) => (
              <li key={experiment.kind + experiment.action} className="text-[15px] leading-relaxed text-ink">
                <span className="mr-1.5 font-medium text-ink-3">
                  {PLAN_PATHS[experiment.kind].letter}
                </span>
                {experiment.action}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

/**
 * Three paths at a glance; choosing one opens its details and five-year timeline.
 * An older single plan stays reachable as its own tab, never merged into a path.
 */
export function PlanPathsView({ plan }: { plan: SavedPlanResponse }) {
  const reduceMotion = useReducedMotion();
  const { paths } = plan;
  const hasLegacy = plan.years.some((y) => y.goals.length > 0);
  const tabs = [...paths.map((p) => p.kind as string), ...(hasLegacy ? [LEGACY_TAB] : [])];
  const [active, setActive] = useState(tabs[0]!);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    const years = paths.flatMap((p) => p.years);
    setFieldFill(computePlanFill(years.length ? years : plan.years));
  }, [paths, plan.years]);

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const target = {
      ArrowRight: tabs[Math.min(index + 1, tabs.length - 1)],
      ArrowLeft: tabs[Math.max(index - 1, 0)],
      ArrowDown: tabs[Math.min(index + 1, tabs.length - 1)],
      ArrowUp: tabs[Math.max(index - 1, 0)],
      Home: tabs[0],
      End: tabs[tabs.length - 1],
    }[e.key];
    if (!target) return;
    e.preventDefault();
    setActive(target);
    tabRefs.current.get(target)?.focus();
  };

  const activePath = paths.find((p) => p.kind === active);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div
          role="tablist"
          aria-label="경로 선택"
          className={`grid grid-cols-1 gap-3 ${tabs.length > 3 ? "md:grid-cols-4" : "md:grid-cols-3"}`}
        >
          {tabs.map((key, index) => {
            const path = paths.find((p) => p.kind === key);
            const selected = key === active;
            return (
              <button
                key={key}
                ref={(el) => {
                  if (el) tabRefs.current.set(key, el);
                  else tabRefs.current.delete(key);
                }}
                type="button"
                role="tab"
                id={pathTabId(key)}
                aria-selected={selected}
                aria-controls={PATH_PANEL_ID}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(key)}
                onKeyDown={(e) => onKeyDown(e, index)}
                style={path && selected ? { borderTopColor: PLAN_PATHS[path.kind].color } : undefined}
                className={
                  "flex min-h-20 cursor-pointer flex-col items-start rounded-xl border border-t-2 p-4 text-left transition-colors duration-150 " +
                  (selected
                    ? "border-line-strong bg-raised"
                    : "border-line bg-surface hover:border-line-strong")
                }
              >
                {path ? (
                  <>
                    <PlanPathBadge kind={path.kind} />
                    <span className="mt-2 text-base font-semibold leading-snug tracking-tight text-ink">
                      {path.title}
                    </span>
                    {path.overview ? (
                      <span className="mt-1 hidden text-sm leading-snug text-ink-2 md:block">
                        {path.overview}
                      </span>
                    ) : null}
                    {path.marks.length ? (
                      <span className="mt-2 text-xs text-accent">
                        {path.marks.map((mark) => PLAN_PATH_MARK_LABELS[mark]).join(" · ")}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <>
                    <span className="text-xs font-medium text-ink-2">{PLAN_LEGACY_LABEL}</span>
                    <span className="mt-2 text-sm leading-snug text-ink-2">
                      세 경로와 별개로 보관된 이전 계획이에요.
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        <motion.div
          key={active}
          id={PATH_PANEL_ID}
          role="tabpanel"
          aria-labelledby={pathTabId(active)}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 flex flex-col gap-6"
        >
          {activePath ? (
            <>
              <PathDetails path={activePath} />
              <div>
                <h2 className={`${sectionTitleClass} mb-2`}>{activePath.title}의 5년</h2>
                <PlanSummary
                  plan={{ ...plan, years: activePath.years }}
                  showRatingSummary={false}
                  showYearRatings={false}
                  reportFill={false}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Link href="/plan/edit?target=single" className={buttonClass("secondary")}>
                  이 계획 수정하기
                </Link>
              </div>
              <PlanSummary plan={plan} reportFill={false} />
            </>
          )}
        </motion.div>
      </div>

      {paths.length ? <PathComparison paths={paths} /> : null}
    </div>
  );
}

/** Banner for a plan saved before paths existed: labelled, never assigned to a path. */
export function LegacyPlanNotice() {
  return (
    <Notice
      action={
        <Link href="/plan/new?expand=1" className={buttonClass("secondary")}>
          세 경로로 탐색하기
        </Link>
      }
    >
      {PLAN_LEGACY_LABEL}이에요. 세 가지 경로를 함께 탐색해도 이 계획은 지워지지 않고 그대로
      보관됩니다.
    </Notice>
  );
}
