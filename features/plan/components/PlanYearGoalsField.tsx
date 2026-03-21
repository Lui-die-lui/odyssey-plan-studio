"use client";

import { useEffect, useRef, useState } from "react";
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

import type { PlanGoalLineForm } from "../types/plan.types";
import type { PlanOdysseyYearIndex } from "../constants/plan.constants";
import type { StringListItemError } from "../lib/plan.validation";

function GripHandle(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="flex w-8 shrink-0 cursor-grab touch-none items-center justify-center self-stretch rounded-md border-0 bg-transparent p-0 text-zinc-300 hover:text-zinc-500 active:cursor-grabbing dark:text-zinc-500 dark:hover:text-zinc-400"
      aria-label="순서 변경"
      {...props}
    >
      <span className="inline-flex gap-0.5" aria-hidden>
        <span className="flex flex-col gap-0.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1 w-1 rounded-full bg-current" />
          ))}
        </span>
        <span className="flex flex-col gap-0.5">
          {[0, 1, 2].map((i) => (
            <span key={`b${i}`} className="h-1 w-1 rounded-full bg-current" />
          ))}
        </span>
      </span>
    </button>
  );
}

type SortableGoalRowProps = {
  goal: PlanGoalLineForm;
  index: number;
  isEditing: boolean;
  onRequestEdit: () => void;
  onChangeText: (text: string) => void;
  onBlurCommit: () => void;
  onRemove: () => void;
  maxLen: number;
};

function SortableGoalRow({
  goal,
  index,
  isEditing,
  onRequestEdit,
  onChangeText,
  onBlurCommit,
  onRemove,
  maxLen,
}: SortableGoalRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : undefined,
  };

  const areaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isEditing) return;
    const el = areaRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, [isEditing]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        "relative flex items-center gap-2 rounded-xl border border-zinc-200/90 bg-white px-2 py-2 dark:border-white/10 dark:bg-zinc-950 " +
        (isDragging ? "opacity-90 shadow-md" : "")
      }
    >
      <GripHandle {...attributes} {...listeners} />
      <div className="min-w-0 flex-1 pr-8">
        {isEditing ? (
          <textarea
            ref={areaRef}
            value={goal.text}
            onChange={(e) => onChangeText(e.target.value)}
            onBlur={onBlurCommit}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                (e.target as HTMLTextAreaElement).blur();
              }
            }}
            rows={2}
            maxLength={maxLen}
            className="min-h-14 w-full resize-none rounded-lg border border-zinc-200/90 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-300 focus:bg-white dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50"
            aria-label={`목표 ${index + 1} 편집`}
          />
        ) : (
          <button
            type="button"
            onClick={onRequestEdit}
            className="w-full rounded-lg px-1 py-1.5 text-left text-sm leading-snug text-zinc-800 transition-colors hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-white/[.06]"
          >
            {goal.text || (
              <span className="text-zinc-400 dark:text-zinc-500">
                클릭하여 입력
              </span>
            )}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute right-2 top-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base leading-none text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-white/[.08] dark:hover:text-zinc-200"
        aria-label={`목표 ${index + 1} 삭제`}
      >
        ×
      </button>
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
  /** When false, parent supplies the section title (card layout). */
  showSectionHeader?: boolean;
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
  showSectionHeader = true,
  onGoalTextChange,
  onCommitGoal,
  onRemoveGoal,
  onReorderGoals,
}: PlanYearGoalsFieldProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [backupText, setBackupText] = useState("");
  const [newGoalDraft, setNewGoalDraft] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const effectiveEditingIndex =
    editingIndex != null && editingIndex < goals.length ? editingIndex : null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = goals.findIndex((g) => g.id === active.id);
    const newIndex = goals.findIndex((g) => g.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorderGoals(arrayMove(goals, oldIndex, newIndex));
    setEditingIndex(null);
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

  return (
    <div className="flex flex-col gap-3">
      {showSectionHeader ? (
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {activeYear}년차 목표
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            (최대 {maxGoals}개) · 드래그하여 순서 변경
          </p>
        </div>
      ) : null}

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
                isEditing={effectiveEditingIndex === gIdx}
                maxLen={maxGoalLength}
                onRequestEdit={() => {
                  setBackupText(goal.text);
                  setEditingIndex(gIdx);
                }}
                onChangeText={(text) => onGoalTextChange(gIdx, text)}
                onBlurCommit={() => {
                  setEditingIndex(null);
                  const trimmed = goal.text.trim();
                  if (!trimmed) {
                    onGoalTextChange(gIdx, backupText);
                  }
                }}
                onRemove={() => {
                  onRemoveGoal(gIdx);
                  setEditingIndex((prev) =>
                    prev === gIdx ? null : prev !== null && prev > gIdx ? prev - 1 : prev,
                  );
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {goalLinesErrors?.length ? (
        <div className="text-sm text-red-600">
          {goalLinesErrors.map((e) => (
            <p key={e.index}>
              Goal line {e.index + 1}: {e.message}
            </p>
          ))}
        </div>
      ) : null}
      {goalsListError ? (
        <p className="text-sm text-red-600">{goalsListError}</p>
      ) : null}

      {canAddMore ? (
        <div className="flex gap-2 rounded-xl border border-dashed border-zinc-200/90 bg-zinc-50/80 px-2 py-2 dark:border-white/10 dark:bg-zinc-900/40">
          <textarea
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
            placeholder={`새로운 플랜 추가 (최대 ${maxGoals}개)`}
            className="min-h-14 min-w-0 flex-1 resize-none rounded-md border-0 bg-transparent px-1 py-1.5 text-sm text-black outline-none placeholder:text-zinc-400 dark:text-zinc-50 dark:placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={tryCommitNew}
            disabled={
              !newGoalDraft.trim() ||
              newGoalDraft.trim().length > maxGoalLength
            }
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-lg font-light text-zinc-500 shadow-sm transition-colors hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            aria-label="목표 추가"
          >
            +
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default PlanYearGoalsField;
