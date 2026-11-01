"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Notice } from "@/components/common/Notice";
import { computePlanFill } from "@/features/field/future-field-core";
import { setFieldFill } from "@/features/field/future-field-store";
import {
  buttonClass,
  fieldClass,
  helpTextClass,
  sectionTitleClass,
} from "@/components/common/ui";

import {
  PLAN_PATHS,
  PLAN_PATH_KINDS,
  PLAN_PATH_LIMITS,
  PLAN_PATH_MARKS,
  PLAN_PATH_MARK_LABELS,
  PLAN_PATH_SCORE_MEANINGS,
  type PlanPathKind,
  type PlanPathMark,
} from "../constants/plan-path.constants";
import {
  PLAN_RATING_SCALE_NOTE,
  PLAN_SCORE_LABELS,
} from "../constants/plan-score.constants";
import { usePlanEditor } from "../hooks/usePlanEditor";
import { clearOdysseyAiPlanDraftFromSession } from "../lib/odyssey-ai-draft-session";
import { clearInterviewSession } from "../lib/odyssey-interview-session";
import {
  clearPlanFormAutosave,
  readPathContentAutosave,
  writePathContentAutosave,
} from "../lib/plan-form-autosave";
import {
  mapPathFormToSavePayload,
  type PlanPathForm,
} from "../lib/plan-path.mapper";
import { saveMyPlan } from "../lib/plan.service";
import type { PlanDistanceScore, PlanPathContent } from "../types/plan.types";
import { PLAN_EDITOR_SCORE_FIELDS } from "./editor";
import { PlanDistanceScale } from "./PlanDistanceScale";
import { PlanPathBadge } from "./PlanPathBadge";
import PlanForm from "./PlanForm";

const PATH_CONTENT_AUTOSAVE_KEY = "paths-content";
const pathTabId = (kind: PlanPathKind) => `plan-path-edit-tab-${kind}`;
const PATH_PANEL_ID = "plan-path-edit-panel";

const contentFingerprint = (contents: Record<PlanPathKind, PlanPathContent>) =>
  JSON.stringify(contents);

function usePathEditors(forms: PlanPathForm[], autosaveScope: string) {
  const formFor = (kind: PlanPathKind) =>
    forms.find((f) => f.content.kind === kind) as PlanPathForm;

  // A fixed list of three kinds, so the hook order never changes.
  const continueEditor = usePlanEditor({
    initialValues: formFor("continue").values,
    autosaveKey: `${autosaveScope}:continue`,
  });
  const alternativeEditor = usePlanEditor({
    initialValues: formFor("alternative").values,
    autosaveKey: `${autosaveScope}:alternative`,
  });
  const unboundEditor = usePlanEditor({
    initialValues: formFor("unbound").values,
    autosaveKey: `${autosaveScope}:unbound`,
  });

  return {
    continue: continueEditor,
    alternative: alternativeEditor,
    unbound: unboundEditor,
  };
}

function LinesField({
  id,
  label,
  help,
  value,
  onChange,
}: {
  id: string;
  label: string;
  help: string;
  value: string[];
  onChange: (lines: string[]) => void;
}) {
  // Blank lines stay while typing and are dropped from what gets saved.
  const [text, setText] = useState(value.join("\n"));
  return (
    <div>
      <label htmlFor={id} className={sectionTitleClass}>
        {label}
      </label>
      <p className={`${helpTextClass} mt-0.5`}>{help}</p>
      <textarea
        id={id}
        rows={3}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(
            e.target.value
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
              .slice(0, PLAN_PATH_LIMITS.listItems),
          );
        }}
        className={`${fieldClass} mt-2 resize-none [field-sizing:content]`}
      />
    </div>
  );
}

function PathHeaderFields({
  content,
  onChange,
}: {
  content: PlanPathContent;
  onChange: (patch: Partial<PlanPathContent>) => void;
}) {
  const { kind } = content;
  return (
    <div className="mt-5 flex flex-col gap-5">
      <div>
        <label htmlFor={`path-overview-${kind}`} className={sectionTitleClass}>
          어떤 삶인가요?
        </label>
        <textarea
          id={`path-overview-${kind}`}
          rows={2}
          maxLength={PLAN_PATH_LIMITS.text}
          value={content.overview}
          onChange={(e) => onChange({ overview: e.target.value })}
          placeholder="일상과 시간을 어떻게 보낼지 짧게 적어 보세요"
          className={`${fieldClass} mt-2 resize-none [field-sizing:content]`}
        />
      </div>
      <div>
        <label htmlFor={`path-appeal-${kind}`} className={sectionTitleClass}>
          이 경로가 끌리는 이유
        </label>
        <textarea
          id={`path-appeal-${kind}`}
          rows={2}
          maxLength={PLAN_PATH_LIMITS.text}
          value={content.appeal}
          onChange={(e) => onChange({ appeal: e.target.value })}
          className={`${fieldClass} mt-2 resize-none [field-sizing:content]`}
        />
      </div>
    </div>
  );
}

function PathFooterFields({
  content,
  onChange,
}: {
  content: PlanPathContent;
  onChange: (patch: Partial<PlanPathContent>) => void;
}) {
  const { kind, experiments, marks, scores } = content;

  const patchExperiment = (index: number, patch: Partial<PlanPathContent["experiments"][number]>) => {
    onChange({
      experiments: experiments.map((experiment, i) =>
        i === index ? { ...experiment, ...patch } : experiment,
      ),
    });
  };

  const toggleMark = (mark: PlanPathMark) => {
    onChange({
      marks: marks.includes(mark) ? marks.filter((m) => m !== mark) : [...marks, mark],
    });
  };

  return (
    <div className="flex flex-col gap-6 border-t border-line pt-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <LinesField
          key={`requirements-${kind}`}
          id={`path-requirements-${kind}`}
          label="필요한 자원과 조건"
          help="한 줄에 하나씩 적어 주세요."
          value={content.requirements}
          onChange={(requirements) => onChange({ requirements })}
        />
        <LinesField
          key={`questions-${kind}`}
          id={`path-questions-${kind}`}
          label="아직 확인하지 못한 질문"
          help="한 줄에 하나씩 적어 주세요."
          value={content.openQuestions}
          onChange={(openQuestions) => onChange({ openQuestions })}
        />
      </div>

      <section aria-labelledby={`path-experiments-${kind}`}>
        <h2 id={`path-experiments-${kind}`} className={sectionTitleClass}>
          작은 실험
        </h2>
        <p className={`${helpTextClass} mt-0.5`}>
          큰 결정을 내리기 전에 이 삶의 일부를 경험해 보는 행동이에요.
        </p>
        <ul className="mt-3 flex flex-col gap-3">
          {experiments.map((experiment, index) => (
            <li key={index} className="rounded-lg border border-line bg-raised p-3">
              <label className="text-xs text-ink-3" htmlFor={`exp-action-${kind}-${index}`}>
                할 일
              </label>
              <textarea
                id={`exp-action-${kind}-${index}`}
                rows={1}
                maxLength={PLAN_PATH_LIMITS.listItemLength}
                value={experiment.action}
                onChange={(e) => patchExperiment(index, { action: e.target.value })}
                className={`${fieldClass} mt-1 resize-none [field-sizing:content]`}
              />
              <label className="mt-2 block text-xs text-ink-3" htmlFor={`exp-learning-${kind}-${index}`}>
                무엇을 확인할까요?
              </label>
              <textarea
                id={`exp-learning-${kind}-${index}`}
                rows={1}
                maxLength={PLAN_PATH_LIMITS.listItemLength}
                value={experiment.learning}
                onChange={(e) => patchExperiment(index, { learning: e.target.value })}
                className={`${fieldClass} mt-1 resize-none [field-sizing:content]`}
              />
              <div className="mt-1 flex items-center justify-between gap-2">
                <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink-2">
                  <input
                    type="checkbox"
                    checked={experiment.nextUp}
                    onChange={(e) => patchExperiment(index, { nextUp: e.target.checked })}
                    className="size-4 accent-[var(--accent)]"
                  />
                  먼저 해볼래요
                </label>
                <button
                  type="button"
                  onClick={() => onChange({ experiments: experiments.filter((_, i) => i !== index) })}
                  className="min-h-11 cursor-pointer rounded-md px-2 text-sm text-ink-3 transition-colors hover:text-danger"
                  aria-label={`${index + 1}번째 실험 삭제`}
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
        {experiments.length < PLAN_PATH_LIMITS.experiments ? (
          <button
            type="button"
            onClick={() =>
              onChange({
                experiments: [...experiments, { action: "", learning: "", nextUp: false }],
              })
            }
            className={buttonClass("secondary", "mt-3")}
          >
            실험 추가
          </button>
        ) : null}
      </section>

      <section aria-labelledby={`path-rating-${kind}`}>
        <h2 id={`path-rating-${kind}`} className={sectionTitleClass}>
          이 경로 전체를 지금 어떻게 느끼나요?
        </h2>
        <p className={`${helpTextClass} mt-0.5`}>
          AI는 점수를 만들지 않아요. 비워 두면 미평가로 저장됩니다. {PLAN_RATING_SCALE_NOTE}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
          {PLAN_EDITOR_SCORE_FIELDS.map(({ key, scaleLeft, scaleRight }) => {
            const headingId = `path-score-${kind}-${key}`;
            return (
              <div key={key}>
                <div id={headingId}>
                  <span className="text-sm font-medium text-ink">{PLAN_SCORE_LABELS[key].ko}</span>
                  <span className="mt-0.5 block text-xs text-ink-3">
                    {PLAN_PATH_SCORE_MEANINGS[key]}
                  </span>
                </div>
                <PlanDistanceScale
                  value={scores[key]}
                  onChange={(v: PlanDistanceScore | null) =>
                    onChange({ scores: { ...scores, [key]: v } })
                  }
                  leftLabel={scaleLeft}
                  rightLabel={scaleRight}
                  ariaLabelledBy={headingId}
                />
              </div>
            );
          })}
        </div>
      </section>

      <fieldset>
        <legend className={sectionTitleClass}>내 표시</legend>
        <p className={`${helpTextClass} mt-0.5`}>
          하나만 고르지 않아도 돼요. 여러 경로에 같은 표시를 해도 좋습니다.
        </p>
        <div className="mt-2 flex flex-col sm:flex-row sm:gap-6">
          {PLAN_PATH_MARKS.map((mark) => (
            <label key={mark} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink-2">
              <input
                type="checkbox"
                checked={marks.includes(mark)}
                onChange={() => toggleMark(mark)}
                className="size-4 accent-[var(--accent)]"
              />
              {PLAN_PATH_MARK_LABELS[mark]}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

export type PlanPathsEditorProps = {
  initialForms: PlanPathForm[];
  /** Separates unsaved copies of a new draft from those of a saved plan. */
  autosaveScope: string;
  planTitle?: string;
  header: ReactNode;
  isDraft: boolean;
};

/**
 * Edits all three paths in one save. Each path reuses the existing year form;
 * only the active path is rendered, and the others keep their state in hooks.
 */
export function PlanPathsEditor({
  initialForms,
  autosaveScope,
  planTitle,
  header,
  isDraft,
}: PlanPathsEditorProps) {
  const router = useRouter();
  const editors = usePathEditors(initialForms, autosaveScope);
  const contentKey = `${autosaveScope}:${PATH_CONTENT_AUTOSAVE_KEY}`;

  const initialContents = useMemo(
    () =>
      Object.fromEntries(initialForms.map((f) => [f.content.kind, f.content])) as Record<
        PlanPathKind,
        PlanPathContent
      >,
    [initialForms],
  );
  const [contents, setContents] = useState(
    () => (readPathContentAutosave(contentKey) as typeof initialContents | null) ?? initialContents,
  );
  const [activeKind, setActiveKind] = useState<PlanPathKind>("continue");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const tabRefs = useRef(new Map<PlanPathKind, HTMLButtonElement>());

  const contentDirty = contentFingerprint(contents) !== contentFingerprint(initialContents);
  const isDirty = contentDirty || PLAN_PATH_KINDS.some((kind) => editors[kind].isDirty);

  useEffect(() => {
    if (contentDirty) writePathContentAutosave(contentKey, contents);
    else clearPlanFormAutosave(contentKey);
  }, [contentDirty, contentKey, contents]);

  const allYears = PLAN_PATH_KINDS.flatMap((kind) => editors[kind].values.years);
  const fill = computePlanFill(allYears);
  useEffect(() => {
    setFieldFill(fill);
  }, [fill]);

  const restored = PLAN_PATH_KINDS.some((kind) => editors[kind].restored);
  const editor = editors[activeKind];
  const content = contents[activeKind];

  const experimentsComplete = PLAN_PATH_KINDS.every((kind) =>
    contents[kind].experiments.every((e) => e.action.trim() && e.learning.trim()),
  );
  const hasGoal = PLAN_PATH_KINDS.some((kind) =>
    editors[kind].values.years.some((y) => y.goals.some((g) => g.text.trim())),
  );
  const linesValid = PLAN_PATH_KINDS.every((kind) =>
    editors[kind].validation.errors.years.every(
      (y) => !y.goalLines?.length && !y.keywordLines?.length && !y.note && !y.goals && !y.keywords,
    ),
  );
  const canSave = hasGoal && linesValid && experimentsComplete;

  const patchContent = (patch: Partial<PlanPathContent>) => {
    setContents((prev) => ({ ...prev, [activeKind]: { ...prev[activeKind], ...patch } }));
  };

  const handleSubmit = async () => {
    setSaveError(null);
    setIsSubmitting(true);
    try {
      await saveMyPlan({
        title: planTitle,
        paths: PLAN_PATH_KINDS.map((kind) =>
          mapPathFormToSavePayload({ content: contents[kind], values: editors[kind].values }),
        ),
      });
      for (const kind of PLAN_PATH_KINDS) editors[kind].clearAutosave();
      clearPlanFormAutosave(contentKey);
      clearOdysseyAiPlanDraftFromSession();
      clearInterviewSession();
      router.push("/my-plan?saved=1");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "저장하지 못했어요.");
      setIsSubmitting(false);
    }
  };

  const onTabKeyDown = (e: KeyboardEvent, index: number) => {
    const target = {
      ArrowRight: PLAN_PATH_KINDS[Math.min(index + 1, PLAN_PATH_KINDS.length - 1)],
      ArrowLeft: PLAN_PATH_KINDS[Math.max(index - 1, 0)],
      Home: PLAN_PATH_KINDS[0],
      End: PLAN_PATH_KINDS[PLAN_PATH_KINDS.length - 1],
    }[e.key];
    if (!target) return;
    e.preventDefault();
    setActiveKind(target);
    tabRefs.current.get(target)?.focus();
  };

  const statusText = !hasGoal
    ? "목표를 한 줄 이상 적으면 저장할 수 있어요"
    : !experimentsComplete
      ? "실험의 할 일과 확인할 것을 모두 적어 주세요"
      : isDirty
        ? "저장하지 않은 변경이 있어요"
        : isDraft
          ? "아직 저장되지 않은 초안이에요"
          : "변경 사항 없음";

  return (
    <>
      {header}

      {restored ? (
        <Notice className="mb-6">저장하지 않았던 내용을 복구했어요.</Notice>
      ) : null}

      <div
        role="tablist"
        aria-label="편집할 경로 선택"
        className="mb-5 grid grid-cols-3 gap-1 rounded-lg border border-line bg-surface p-1"
      >
        {PLAN_PATH_KINDS.map((kind, index) => {
          const selected = kind === activeKind;
          return (
            <button
              key={kind}
              ref={(el) => {
                if (el) tabRefs.current.set(kind, el);
                else tabRefs.current.delete(kind);
              }}
              type="button"
              role="tab"
              id={pathTabId(kind)}
              aria-selected={selected}
              aria-controls={PATH_PANEL_ID}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveKind(kind)}
              onKeyDown={(e) => onTabKeyDown(e, index)}
              className={
                "min-h-11 cursor-pointer rounded-md px-2 text-sm font-medium transition-colors duration-150 " +
                (selected ? "bg-raised text-ink" : "text-ink-3 hover:text-ink")
              }
            >
              {PLAN_PATHS[kind].letter}
              <span className="ml-1 hidden sm:inline">{PLAN_PATHS[kind].name}</span>
            </button>
          );
        })}
      </div>

      <div
        id={PATH_PANEL_ID}
        role="tabpanel"
        aria-labelledby={pathTabId(activeKind)}
        className="flex flex-1 flex-col"
      >
        <PlanPathBadge kind={activeKind} />
        <p className={`${helpTextClass} mt-1`}>{PLAN_PATHS[activeKind].question}</p>

        <PlanForm
          key={activeKind}
          values={editor.values}
          errors={{ ...editor.validation.errors, form: undefined }}
          isValid={canSave}
          isSubmitting={isSubmitting}
          submitLabel="저장하기"
          statusText={statusText}
          hasChanges={isDirty || isDraft}
          titleLabel="경로 제목"
          titlePlaceholder={PLAN_PATHS[activeKind].name}
          hideYearRatings
          slotTop={<PathHeaderFields key={activeKind} content={content} onChange={patchContent} />}
          slotBottom={<PathFooterFields content={content} onChange={patchContent} />}
          saveError={saveError ? <Notice tone="error">{saveError}</Notice> : undefined}
          onTitleChange={editor.setTitle}
          onScoreChange={editor.setScore}
          onConfirmUnverifiedScores={editor.confirmUnverifiedScores}
          onYearNoteChange={editor.setYearNote}
          onGoalChange={editor.setGoalLine}
          onCommitGoal={editor.commitGoal}
          onRemoveGoal={editor.removeGoalLine}
          onReorderGoals={editor.reorderGoals}
          onCommitKeyword={editor.commitKeyword}
          onRemoveKeyword={editor.removeKeywordLine}
          onSubmit={() => void handleSubmit()}
        />
      </div>
    </>
  );
}
