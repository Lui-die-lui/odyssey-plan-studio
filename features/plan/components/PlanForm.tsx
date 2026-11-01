"use client";

import React, { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { Notice } from "@/components/common/Notice";
import { computePlanFill } from "@/features/field/future-field-core";
import { setFieldFill } from "@/features/field/future-field-store";
import {
  buttonClass,
  fieldClass,
  helpTextClass,
  sectionTitleClass,
} from "@/components/common/ui";

import type {
  PlanDistanceScore,
  PlanFormValues,
  PlanGoalLineForm,
} from "../types/plan.types";
import type { PlanOdysseyYearIndex } from "../constants/plan.constants";
import type {
  PlanFormValidationErrors,
  StringListItemError,
} from "../lib/plan.validation";
import {
  PLAN_MAX_GOALS_PER_YEAR,
  PLAN_MAX_KEYWORDS_PER_YEAR,
  PLAN_MAX_LENGTH,
  PLAN_ODYSSEY_YEAR_INDICES,
} from "../constants/plan.constants";
import {
  PLAN_RATING_SCALE_NOTE,
  PLAN_SCORE_KEYS,
  PLAN_UNVERIFIED_SCORES_NOTE,
  type PlanScoreKey,
} from "../constants/plan-score.constants";
import { PlanDistanceScale } from "./PlanDistanceScale";
import { PlanYearGuidanceDetails } from "./PlanYearGuidanceDetails";
import PlanYearGoalsField from "./PlanYearGoalsField";
import { YearTimeline, yearPanelId, yearTabId } from "./YearTimeline";
import { PlanEditorActions, PLAN_EDITOR_SCORE_FIELDS } from "./editor";

const TIMELINE_ID = "plan-editor-years";

const sectionClass = "border-t border-line py-6 first:border-t-0 first:pt-0";

function PlanYearKeywordPanel({
  activeYear,
  keywords,
  maxKeywords,
  maxKeywordLen,
  keywordLineErrors,
  keywordsListError,
  onCommitKeyword,
  onRemoveKeyword,
}: {
  activeYear: PlanOdysseyYearIndex;
  keywords: string[];
  maxKeywords: number;
  maxKeywordLen: number;
  keywordLineErrors?: StringListItemError[];
  keywordsListError?: string;
  onCommitKeyword: (year: PlanOdysseyYearIndex, text: string) => void;
  onRemoveKeyword: (year: PlanOdysseyYearIndex, index: number) => void;
}) {
  const [draft, setDraft] = useState("");
  const canAddMore = keywords.length < maxKeywords;
  const inputId = `plan-keyword-y${activeYear}`;

  const tryCommit = () => {
    const t = draft.trim();
    if (!t || !canAddMore) return;
    if (t.length > maxKeywordLen) return;
    onCommitKeyword(activeYear, draft);
    setDraft("");
  };

  return (
    <div>
      <label htmlFor={inputId} className={sectionTitleClass}>
        키워드
      </label>
      <p className={`${helpTextClass} mt-0.5`}>
        선택 입력 · 최대 {maxKeywords}개, {maxKeywordLen}자 이내
      </p>

      {keywords.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {keywords.map((kw, kIdx) => (
            <li
              key={`chip-${activeYear}-${kIdx}-${kw}`}
              className="inline-flex max-w-full items-center rounded-md border border-line bg-raised pl-2.5 text-sm text-ink-2"
            >
              <span className="truncate">{kw}</span>
              <button
                type="button"
                onClick={() => onRemoveKeyword(activeYear, kIdx)}
                className="min-h-9 cursor-pointer px-2 text-xs text-ink-3 transition-colors hover:text-danger"
                aria-label={`${kw} 삭제`}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 flex gap-2">
        <input
          id={inputId}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              tryCommit();
            }
          }}
          maxLength={maxKeywordLen}
          disabled={!canAddMore}
          placeholder="키워드를 입력하세요"
          className={`${fieldClass} min-w-0 flex-1 disabled:opacity-50`}
        />
        <button
          type="button"
          onClick={tryCommit}
          disabled={!canAddMore || !draft.trim() || draft.trim().length > maxKeywordLen}
          className={buttonClass("secondary")}
        >
          추가
        </button>
      </div>

      {keywordLineErrors?.map((e) => (
        <p key={e.index} className="mt-2 text-sm text-danger">
          키워드 {e.index + 1}: {e.message}
        </p>
      ))}
      {keywordsListError ? (
        <p className="mt-2 text-sm text-danger">{keywordsListError}</p>
      ) : null}
    </div>
  );
}

export type PlanFormProps = {
  values: PlanFormValues;
  errors: PlanFormValidationErrors;
  isValid: boolean;
  isSubmitting?: boolean;
  submitLabel: string;
  submittingLabel?: string;
  /** Plain statement of the save state. */
  statusText: string;
  /** False when there is nothing new to save. */
  hasChanges: boolean;
  onReset?: () => void;
  saveError?: ReactNode;
  titleLabel?: string;
  titlePlaceholder?: string;
  /** Three-path plans rate the whole path instead of each year. */
  hideYearRatings?: boolean;
  /** Path details shown before and after the years. */
  slotTop?: ReactNode;
  slotBottom?: ReactNode;

  onTitleChange: (title: string) => void;
  onScoreChange: (
    yearIndex: PlanOdysseyYearIndex,
    key: PlanScoreKey,
    value: PlanDistanceScore | null,
  ) => void;
  onConfirmUnverifiedScores: (yearIndex: PlanOdysseyYearIndex) => void;
  onYearNoteChange: (yearIndex: PlanOdysseyYearIndex, note: string) => void;
  onGoalChange: (
    yearIndex: PlanOdysseyYearIndex,
    index: number,
    text: string,
  ) => void;
  onCommitGoal: (yearIndex: PlanOdysseyYearIndex, text: string) => void;
  onRemoveGoal: (yearIndex: PlanOdysseyYearIndex, index: number) => void;
  onReorderGoals: (
    yearIndex: PlanOdysseyYearIndex,
    goals: PlanGoalLineForm[],
  ) => void;
  onCommitKeyword: (yearIndex: PlanOdysseyYearIndex, text: string) => void;
  onRemoveKeyword: (yearIndex: PlanOdysseyYearIndex, index: number) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

/** One continuous document per year: only the active year exists, so nothing hidden takes focus. */
const PlanForm = ({
  values,
  errors,
  isValid,
  isSubmitting,
  submitLabel,
  submittingLabel,
  statusText,
  hasChanges,
  onReset,
  saveError,
  titleLabel = "플랜 제목",
  titlePlaceholder = "예: 일을 유지하며 새 방향을 시험해 보는 5년",
  hideYearRatings = false,
  slotTop,
  slotBottom,
  onTitleChange,
  onScoreChange,
  onConfirmUnverifiedScores,
  onYearNoteChange,
  onGoalChange,
  onCommitGoal,
  onRemoveGoal,
  onReorderGoals,
  onCommitKeyword,
  onRemoveKeyword,
  onSubmit,
}: PlanFormProps) => {
  const reduceMotion = useReducedMotion();
  const [activeYear, setActiveYear] = useState<PlanOdysseyYearIndex>(1);
  const [direction, setDirection] = useState(1);

  const reportsFill = !hideYearRatings;
  useEffect(() => {
    if (reportsFill) setFieldFill(computePlanFill(values.years));
  }, [reportsFill, values.years]);

  const changeYear = (year: PlanOdysseyYearIndex) => {
    setDirection(year >= activeYear ? 1 : -1);
    setActiveYear(year);
  };

  const yearBlock = values.years.find((y) => y.yearIndex === activeYear);

  const yearErrorIndex = PLAN_ODYSSEY_YEAR_INDICES.indexOf(activeYear);
  const yearErrors = errors.years[yearErrorIndex];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(e);
  };

  if (!yearBlock) return null;

  const nextYear = PLAN_ODYSSEY_YEAR_INDICES[yearErrorIndex + 1];
  const previousYear = PLAN_ODYSSEY_YEAR_INDICES[yearErrorIndex - 1];
  const ratedCount = PLAN_SCORE_KEYS.filter((k) => yearBlock.scores[k] !== null).length;

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-1 flex-col">
      <div className="mb-6">
        <label className="text-sm font-medium text-ink-2" htmlFor="plan-title">
          {titleLabel} <span className="font-normal text-ink-3">(선택)</span>
        </label>
        <input
          id="plan-title"
          type="text"
          value={values.title ?? ""}
          onChange={(e) => onTitleChange(e.target.value)}
          className={`${fieldClass} mt-1.5`}
          placeholder={titlePlaceholder}
          autoComplete="off"
        />
        {errors.title ? <p className="mt-2 text-sm text-danger">{errors.title}</p> : null}
        {slotTop}
      </div>

      <div className="sticky top-0 z-20 -mx-4 border-b border-line bg-canvas px-4 sm:-mx-5 sm:px-5">
        <YearTimeline
          idPrefix={TIMELINE_ID}
          label="편집할 연차 선택"
          activeYear={activeYear}
          onChange={changeYear}
          isYearFilled={(year) =>
            (values.years.find((y) => y.yearIndex === year)?.goals.length ?? 0) > 0
          }
          renderYearDetail={(year) => {
            const count = values.years.find((y) => y.yearIndex === year)?.goals.length ?? 0;
            return (
              <span className="text-xs tabular-nums text-ink-3">
                {count > 0 ? `${count}줄` : "비어 있음"}
              </span>
            );
          }}
        />
      </div>

      <motion.div
        key={activeYear}
        id={yearPanelId(TIMELINE_ID)}
        role="tabpanel"
        aria-labelledby={yearTabId(TIMELINE_ID, activeYear)}
        initial={reduceMotion ? false : { opacity: 0, x: 14 * direction }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="pt-6"
      >
        <section className={sectionClass} aria-labelledby="plan-goals-heading">
          <h2 id="plan-goals-heading" className={sectionTitleClass}>
            {activeYear}년차 목표와 행동
          </h2>
          <p className={`${helpTextClass} mb-3 mt-0.5`}>
            문장을 눌러 바로 고칠 수 있고, 왼쪽 손잡이로 순서를 바꿀 수 있어요.
          </p>
          <PlanYearGoalsField
            key={activeYear}
            activeYear={activeYear}
            goals={yearBlock.goals}
            maxGoals={PLAN_MAX_GOALS_PER_YEAR}
            maxGoalLength={PLAN_MAX_LENGTH.goal}
            goalLinesErrors={yearErrors?.goalLines}
            goalsListError={yearErrors?.goals}
            aiSourceTexts={yearBlock.aiGuidance?.sourceGoalTexts}
            onGoalTextChange={(index, text) => onGoalChange(activeYear, index, text)}
            onCommitGoal={(text) => onCommitGoal(activeYear, text)}
            onRemoveGoal={(index) => onRemoveGoal(activeYear, index)}
            onReorderGoals={(next) => onReorderGoals(activeYear, next)}
          />
          {yearBlock.aiGuidance ? (
            <PlanYearGuidanceDetails
              className="mt-4"
              guidance={yearBlock.aiGuidance}
              goalTexts={yearBlock.goals.map((goal) => goal.text)}
            />
          ) : null}
        </section>

        {hideYearRatings ? null : (
        <section className={sectionClass} aria-labelledby="plan-rating-heading">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="plan-rating-heading" className={sectionTitleClass}>
              {activeYear}년차 자기평가
            </h2>
            <span className="text-xs tabular-nums text-ink-3">{ratedCount}/4 평가</span>
          </div>
          <p className={`${helpTextClass} mt-0.5`}>
            AI는 점수를 만들지 않아요. 직접 매기고, 비워 두면 미평가로 저장됩니다.{" "}
            {PLAN_RATING_SCALE_NOTE}
          </p>

          {yearBlock.unverifiedScoreKeys.length > 0 ? (
            <Notice
              className="mt-4"
              action={
                <button
                  type="button"
                  onClick={() => onConfirmUnverifiedScores(activeYear)}
                  className={buttonClass("secondary")}
                >
                  내 평가가 맞아요
                </button>
              }
            >
              {PLAN_UNVERIFIED_SCORES_NOTE}
            </Notice>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
            {PLAN_EDITOR_SCORE_FIELDS.map(
              ({ key, labelEn, hintKo, highMeaning, scaleLeft, scaleRight }) => {
                const headingId = `plan-score-y${activeYear}-${key}-heading`;
                return (
                  <div key={key}>
                    <div id={headingId}>
                      <span className="text-sm font-medium text-ink">{hintKo}</span>
                      <span className="ml-1.5 text-xs text-ink-3">{labelEn}</span>
                      <span className="mt-0.5 block text-xs text-ink-3">{highMeaning}</span>
                    </div>
                    <PlanDistanceScale
                      value={yearBlock.scores[key]}
                      onChange={(v) => onScoreChange(activeYear, key, v)}
                      leftLabel={scaleLeft}
                      rightLabel={scaleRight}
                      ariaLabelledBy={headingId}
                    />
                    {yearErrors?.scores?.[key] ? (
                      <p className="text-xs text-danger">{yearErrors.scores[key]}</p>
                    ) : null}
                  </div>
                );
              },
            )}
          </div>
        </section>
        )}

        <section className={`${sectionClass} grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8`}>
          <PlanYearKeywordPanel
            key={activeYear}
            activeYear={activeYear}
            keywords={yearBlock.keywords}
            maxKeywords={PLAN_MAX_KEYWORDS_PER_YEAR}
            maxKeywordLen={PLAN_MAX_LENGTH.keyword}
            keywordLineErrors={yearErrors?.keywordLines}
            keywordsListError={yearErrors?.keywords}
            onCommitKeyword={onCommitKeyword}
            onRemoveKeyword={onRemoveKeyword}
          />
          <div>
            <label className={sectionTitleClass} htmlFor={`plan-note-y${activeYear}`}>
              메모
            </label>
            <p className={`${helpTextClass} mt-0.5`}>선택 입력</p>
            <textarea
              id={`plan-note-y${activeYear}`}
              value={yearBlock.note}
              onChange={(e) => onYearNoteChange(activeYear, e.target.value)}
              rows={3}
              className={`${fieldClass} mt-3 min-h-[5.5rem] resize-none [field-sizing:content]`}
              placeholder="이 해에 대한 짧은 메모를 남겨보세요"
            />
            {yearErrors?.note ? (
              <p className="mt-2 text-sm text-danger">{yearErrors.note}</p>
            ) : null}
          </div>
        </section>

        <div className="flex justify-between gap-2 border-t border-line pt-4">
          {previousYear ? (
            <button type="button" onClick={() => changeYear(previousYear)} className={buttonClass("quiet")}>
              {previousYear}년차로
            </button>
          ) : (
            <span />
          )}
          {nextYear ? (
            <button type="button" onClick={() => changeYear(nextYear)} className={buttonClass("secondary")}>
              {nextYear}년차 작성하기
            </button>
          ) : null}
        </div>
      </motion.div>

      {slotBottom ? <div className="mt-6">{slotBottom}</div> : null}

      <PlanEditorActions
        isSubmitting={Boolean(isSubmitting)}
        canSubmit={isValid && hasChanges}
        submitLabel={submitLabel}
        submittingLabel={submittingLabel}
        statusText={errors.form ?? statusText}
        onReset={onReset}
        error={saveError}
      />
    </form>
  );
};

export default PlanForm;
