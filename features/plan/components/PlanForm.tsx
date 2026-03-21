"use client";

import React, { useState } from "react";
import type {
  PlanFormValues,
  PlanGoalLineForm,
  PlanYearScores,
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
import { PlanDistanceScale } from "./PlanDistanceScale";
import PlanYearGoalsField from "./PlanYearGoalsField";
import {
  PlanEditorActions,
  PlanEditorYearTabs,
  PLAN_EDITOR_SCORE_FIELDS,
} from "./editor";
import type { PlanEditorMode } from "./editor";

const cardClass =
  "rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950 sm:p-6";

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

  const tryCommit = () => {
    const t = draft.trim();
    if (!t || !canAddMore) return;
    if (t.length > maxKeywordLen) return;
    onCommitKeyword(activeYear, draft);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {activeYear}년차 키워드
        </h3>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          최대 {maxKeywords}개, {maxKeywordLen}자 이내
        </p>
      </div>

      {keywords.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw, kIdx) => (
            <span
              key={`chip-${activeYear}-${kIdx}-${kw}`}
              className="inline-flex max-w-full items-center gap-0.5 rounded-full border border-zinc-200/90 bg-zinc-900 py-1 pl-3 pr-0.5 text-sm text-white shadow-sm dark:border-white/10 dark:bg-zinc-800"
            >
              <span className="truncate">{kw}</span>
              <button
                type="button"
                onClick={() => onRemoveKeyword(activeYear, kIdx)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base leading-none text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                aria-label={`${kw} 삭제`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-2 rounded-full border border-zinc-200/90 bg-zinc-50/90 py-1 pl-4 pr-1 dark:border-white/10 dark:bg-zinc-900/50">
        <input
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
          className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-50 dark:text-zinc-50 dark:placeholder:text-zinc-500"
        />
        <button
          type="button"
          onClick={tryCommit}
          disabled={
            !canAddMore || !draft.trim() || draft.trim().length > maxKeywordLen
          }
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-lg font-light text-zinc-500 shadow-sm ring-1 ring-zinc-200/80 transition-colors hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-white/10 dark:hover:text-zinc-100"
          aria-label="키워드 추가"
        >
          +
        </button>
      </div>

      {keywordLineErrors?.length ? (
        <div className="text-sm text-red-600">
          {keywordLineErrors.map((e) => (
            <p key={e.index}>
              키워드 {e.index + 1}: {e.message}
            </p>
          ))}
        </div>
      ) : null}
      {keywordsListError ? (
        <p className="text-sm text-red-600">{keywordsListError}</p>
      ) : null}
    </div>
  );
}

export type PlanFormProps = {
  values: PlanFormValues;
  errors: PlanFormValidationErrors;
  isValid: boolean;
  isSubmitting?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  mode?: PlanEditorMode;
  onReset?: () => void;
  resetLabel?: string;
  /** Shown under primary actions (e.g. create flow) */
  actionFootnote?: string;

  onTitleChange: (title: string) => void;
  onScoreChange: (
    yearIndex: PlanOdysseyYearIndex,
    key: keyof PlanYearScores,
    value: number,
  ) => void;
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

const PlanForm = ({
  values,
  errors,
  isValid,
  isSubmitting,
  submitLabel,
  submittingLabel,
  mode = "create",
  onReset,
  resetLabel,
  actionFootnote,
  onTitleChange,
  onScoreChange,
  onYearNoteChange,
  onGoalChange,
  onCommitGoal,
  onRemoveGoal,
  onReorderGoals,
  onCommitKeyword,
  onRemoveKeyword,
  onSubmit,
}: PlanFormProps) => {
  const [activeYear, setActiveYear] = useState<PlanOdysseyYearIndex>(1);

  const yearBlock = values.years.find((y) => y.yearIndex === activeYear);

  const yearErrorIndex = PLAN_ODYSSEY_YEAR_INDICES.indexOf(activeYear);
  const yearErrors = errors.years[yearErrorIndex];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(e);
  };

  if (!yearBlock) return null;

  const primarySubmit =
    submitLabel ??
    (mode === "create" ? "완성하기" : "수정 완료");

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5 sm:gap-6">
      <section className={cardClass}>
        <label
          className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
          htmlFor="plan-title"
        >
          플랜 제목{" "}
          <span className="font-normal normal-case tracking-normal text-zinc-400">
            (선택)
          </span>
        </label>
        <input
          id="plan-title"
          type="text"
          value={values.title ?? ""}
          onChange={(e) => onTitleChange(e.target.value)}
          className="mt-2 h-10 w-full rounded-xl border border-zinc-200/90 bg-zinc-50/50 px-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-50 dark:focus:bg-zinc-900"
          placeholder="예: 나의 오디세이 플랜"
          autoComplete="off"
        />
        {errors.title ? (
          <p className="mt-2 text-sm text-red-600">{errors.title}</p>
        ) : null}
      </section>

      {errors.form ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-950/30 dark:text-red-300"
        >
          {errors.form}
        </div>
      ) : null}

      <section className={cardClass}>
        <PlanEditorYearTabs activeYear={activeYear} onChange={setActiveYear} />
      </section>

      <section className={cardClass} aria-labelledby="plan-goals-heading">
        <div className="mb-4">
          <h2
            id="plan-goals-heading"
            className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
          >
            올해 집중할 플랜을 정리해보세요
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {activeYear}년차 · 최대 {PLAN_MAX_GOALS_PER_YEAR}개 · 점 아이콘을
            잡아 순서를 바꿀 수 있어요
          </p>
        </div>
        <PlanYearGoalsField
          key={activeYear}
          activeYear={activeYear}
          goals={yearBlock.goals}
          maxGoals={PLAN_MAX_GOALS_PER_YEAR}
          maxGoalLength={PLAN_MAX_LENGTH.goal}
          showSectionHeader={false}
          goalLinesErrors={yearErrors?.goalLines}
          goalsListError={yearErrors?.goals}
          onGoalTextChange={(index, text) =>
            onGoalChange(activeYear, index, text)
          }
          onCommitGoal={(text) => onCommitGoal(activeYear, text)}
          onRemoveGoal={(index) => onRemoveGoal(activeYear, index)}
          onReorderGoals={(next) => onReorderGoals(activeYear, next)}
        />
      </section>

      <section
        className={cardClass}
        aria-labelledby="plan-distance-keywords-heading"
      >
        <div className="mb-5">
          <h2
            id="plan-distance-keywords-heading"
            className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
          >
            {activeYear}년차 플랜과 나의 거리
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            네 가지 감각과 키워드로 이 해의 방향을 잡아보세요.
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-2 lg:gap-10 lg:items-start">
          <div className="flex flex-col gap-4">
            {PLAN_EDITOR_SCORE_FIELDS.map(
              ({ key, labelEn, hintKo, scaleLeft, scaleRight }) => {
                const headingId = `plan-score-y${activeYear}-${key}-heading`;
                return (
                  <div key={key} className="flex flex-col gap-2">
                    <div id={headingId}>
                      <span className="text-xs font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-100">
                        {labelEn}
                      </span>
                      <span className="mt-0.5 block text-xs font-normal normal-case text-zinc-500 dark:text-zinc-400">
                        {hintKo}
                      </span>
                    </div>
                    <PlanDistanceScale
                      value={yearBlock.scores[key]}
                      onChange={(v) => onScoreChange(activeYear, key, v)}
                      leftLabel={scaleLeft}
                      rightLabel={scaleRight}
                      ariaLabelledBy={headingId}
                      className="max-w-none"
                    />
                    {yearErrors?.scores?.[key] ? (
                      <p className="text-xs text-red-600">
                        {yearErrors.scores[key]}
                      </p>
                    ) : null}
                  </div>
                );
              },
            )}
          </div>

          <div className="flex flex-col border-t border-zinc-100 pt-6 lg:border-t-0 lg:border-l lg:border-zinc-100 lg:pl-10 lg:pt-0 dark:border-white/10">
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

            <div className="mt-6 border-t border-zinc-100 pt-5 dark:border-white/10">
              <label
                className="text-sm font-medium text-zinc-600 dark:text-zinc-300"
                htmlFor={`plan-note-y${activeYear}`}
              >
                메모 / 요약
                <span className="ml-1 text-xs font-normal text-zinc-400">
                  (선택)
                </span>
              </label>
              <textarea
                id={`plan-note-y${activeYear}`}
                value={yearBlock.note}
                onChange={(e) => onYearNoteChange(activeYear, e.target.value)}
                rows={3}
                className="mt-2 min-h-[4.5rem] w-full resize-none rounded-xl border border-zinc-200/90 bg-zinc-50/40 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-300 focus:bg-white dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-50 dark:focus:bg-zinc-950"
                placeholder="이 해에 대한 짧은 메모를 남겨보세요"
              />
              {yearErrors?.note ? (
                <p className="mt-2 text-sm text-red-600">{yearErrors.note}</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <PlanEditorActions
        mode={mode}
        isSubmitting={Boolean(isSubmitting)}
        isValid={isValid}
        submitLabel={primarySubmit}
        submittingLabel={submittingLabel}
        onReset={onReset}
        resetLabel={resetLabel}
        footnote={actionFootnote}
      />
    </form>
  );
};

export default PlanForm;
