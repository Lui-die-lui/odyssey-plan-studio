"use client";

import { useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { buttonClass, fieldClass } from "@/components/common/ui";

import type { PlanGoalLineForm } from "../types/plan.types";
import type { PlanOdysseyYearIndex } from "../constants/plan.constants";
import { AI_SUGGESTION_LABEL } from "../lib/plan-ai-guidance";
import type { StringListItemError } from "../lib/plan.validation";

const rowInputClass =
  "w-full resize-none rounded-md bg-transparent px-1.5 py-1.5 text-[15px] leading-relaxed text-ink outline-none [field-sizing:content] placeholder:text-ink-3";

function GripHandle(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="flex min-h-11 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-ink-3 hover:text-ink active:cursor-grabbing"
      {...props}
    >
      <span className="grid grid-cols-2 gap-0.5" aria-hidden>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="size-1 rounded-full bg-current" />
        ))}
      </span>
    </button>
  );
}

type SortableGoalRowProps = {
  goal: PlanGoalLineForm;
  index: number;
  isAiLine: boolean;
  /** The plan came from AI, so every line shows whose words it is. */
  showOrigin: boolean;
  onChangeText: (text: string) => void;
  onRemove: () => void;
  maxLen: number;
  error?: string;
};

function SortableGoalRow({
  goal,
  index,
  isAiLine,
  showOrigin,
  onChangeText,
  onRemove,
  maxLen,
  error,
}: SortableGoalRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: goal.id });
  const textBeforeEdit = useRef(goal.text);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        "relative rounded-lg border-l-2 bg-raised py-1 pl-1 pr-1.5 transition-colors duration-200 focus-within:bg-raised " +
        (showOrigin
          ? isAiLine
            ? "border-l-line-strong"
            : "border-l-accent"
          : "border-l-line") +
        (isDragging ? " opacity-90" : "")
      }
    >
      <div className="flex items-start gap-1">
        <GripHandle
          {...attributes}
          {...listeners}
          aria-label={`${index + 1}번째 줄 순서 변경`}
        />
        <textarea
          value={goal.text}
          rows={1}
          maxLength={maxLen}
          aria-label={`${index + 1}번째 줄 편집`}
          onFocus={() => {
            textBeforeEdit.current = goal.text;
          }}
          onChange={(e) => onChangeText(e.target.value)}
          onBlur={() => {
            if (!goal.text.trim()) onChangeText(textBeforeEdit.current);
          }}
          className={rowInputClass}
        />
        <button
          type="button"
          onClick={onRemove}
          className="min-h-11 shrink-0 cursor-pointer rounded-md px-2 text-sm text-ink-3 transition-colors hover:text-danger"
          aria-label={`${index + 1}번째 줄 삭제`}
        >
          삭제
        </button>
      </div>
      {showOrigin ? (
        <p className="pb-1 pl-10 text-xs text-ink-3">
          {isAiLine ? (
            AI_SUGGESTION_LABEL
          ) : (
            <span className="font-medium text-accent">내가 쓴 문장</span>
          )}
        </p>
      ) : null}
      {error ? <p className="pb-1 pl-10 text-sm text-danger">{error}</p> : null}
    </div>
  );
}

export type PlanYearGoalsFieldProps = {
  activeYear: PlanOdysseyYearIndex;
  goals: PlanGoalLineForm[];
  maxGoals: number;
  maxGoalLength: number;
  goalLinesErrors?: StringListItemError[];
  goalsListError?: string;
  /** Generated lines; when present, each row shows if it is still the AI's wording. */
  aiSourceTexts?: string[];
  onGoalTextChange: (index: number, text: string) => void;
  onCommitGoal: (text: string) => void;
  onRemoveGoal: (index: number) => void;
  onReorderGoals: (next: PlanGoalLineForm[]) => void;
};

const PlanYearGoalsField = ({
  activeYear,
  goals,
  maxGoals,
  maxGoalLength,
  goalLinesErrors,
  goalsListError,
  aiSourceTexts,
  onGoalTextChange,
  onCommitGoal,
  onRemoveGoal,
  onReorderGoals,
}: PlanYearGoalsFieldProps) => {
  const [newGoalDraft, setNewGoalDraft] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = goals.findIndex((g) => g.id === active.id);
    const newIndex = goals.findIndex((g) => g.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorderGoals(arrayMove(goals, oldIndex, newIndex));
  };

  const tryCommitNew = () => {
    const t = newGoalDraft.trim();
    if (!t) return;
    if (t.length > maxGoalLength) return;
    if (goals.length >= maxGoals) return;
    onCommitGoal(newGoalDraft);
    setNewGoalDraft("");
  };

  const canAddMore = goals.length < maxGoals;
  const newGoalId = `plan-new-goal-y${activeYear}`;

  return (
    <div className="flex flex-col gap-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={goals.map((g) => g.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {goals.map((goal, gIdx) => (
              <SortableGoalRow
                key={goal.id}
                goal={goal}
                index={gIdx}
                showOrigin={aiSourceTexts != null}
                isAiLine={aiSourceTexts?.includes(goal.text.trim()) ?? false}
                maxLen={maxGoalLength}
                error={goalLinesErrors?.find((e) => e.index === gIdx)?.message}
                onChangeText={(text) => onGoalTextChange(gIdx, text)}
                onRemove={() => onRemoveGoal(gIdx)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {goalsListError ? <p className="text-sm text-danger">{goalsListError}</p> : null}

      {canAddMore ? (
        <div>
          <label htmlFor={newGoalId} className="sr-only">
            새 목표나 행동 추가
          </label>
          <textarea
            id={newGoalId}
            value={newGoalDraft}
            onChange={(e) => setNewGoalDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                tryCommitNew();
              }
            }}
            rows={2}
            maxLength={maxGoalLength}
            placeholder={
              goals.length
                ? "목표나 행동을 더 적어 보세요"
                : "이 해에 달라져 있을 모습이나 해볼 일을 적어 보세요"
            }
            className={`${fieldClass} resize-none [field-sizing:content]`}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xs text-ink-3">
              {goals.length}/{maxGoals}줄 · Enter로 추가
            </p>
            <button
              type="button"
              onClick={tryCommitNew}
              disabled={!newGoalDraft.trim()}
              className={buttonClass("secondary")}
            >
              추가
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-ink-3">
          {maxGoals}줄을 모두 채웠어요. 추가하려면 한 줄을 지워 주세요.
        </p>
      )}
    </div>
  );
};

export default PlanYearGoalsField;
