import {
  PLAN_PREPARATION_KINDS,
  PLAN_PREPARATION_PRIORITIES,
  findPreparationCatalogEntry,
  type PlanPreparationKind,
  type PlanPreparationPriority,
} from "../constants/plan-preparation.constants";
import { collectActiveOdysseyAnswers } from "../interview/odyssey-interview.logic";
import type { OdysseyInterviewAnswers } from "../interview/odyssey-interview.types";
import type { PlanPathKind } from "../constants/plan-path.constants";
import type { PlanPreparation } from "../types/plan.types";

/** What the user actually said, used to check suggestions against their situation. */
export type OdysseyPreparationContext = {
  /** All free text and choice IDs, to test a credential's relevance. */
  answerText: string;
  /** Free text about existing experience, to catch credentials already held. */
  heldText: string;
  lowOnTime: boolean;
  outsideKorea: boolean;
  unsurePaths: PlanPathKind[];
};

const TEXT_MAX = 400;
const UNLISTED_CREDENTIAL = /자격증|산업기사|기능사|기능장|면허|[가-힣]+기사\s*(시험|자격|취득)/;
const REQUIRED_CLAIM = /필수|의무|반드시\s*(취득|보유|필요)/;
const LINK = /https?:\/\/|www\./i;

export function buildPreparationContext(
  answers: OdysseyInterviewAnswers,
): OdysseyPreparationContext {
  const active = collectActiveOdysseyAnswers(answers);
  const choiceIds = Object.values(active).flatMap((a) => a.choiceIds);
  const unsure: [string, PlanPathKind][] = [
    ["q_path_a_unknown", "continue"],
    ["q_path_b_unknown", "alternative"],
    ["q_path_c_unknown", "unbound"],
  ];

  return {
    answerText: Object.values(active)
      .map((a) => a.text ?? "")
      .join(" "),
    heldText: active.q_assets?.text ?? "",
    lowOnTime: choiceIds.includes("q_time_low"),
    outsideKorea: choiceIds.includes("q_limits_abroad"),
    unsurePaths: unsure.filter(([id]) => choiceIds.includes(id)).map(([, kind]) => kind),
  };
}

type Validated<T> = { ok: true; value: T } | { ok: false; reason: string };
const fail = (reason: string) => ({ ok: false as const, reason });

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const isText = (v: unknown, required = true): v is string =>
  typeof v === "string" && v.length <= TEXT_MAX && (!required || v.trim().length > 0);

export function validatePreparation(
  raw: unknown,
  options: {
    prefix: string;
    isKnownId: (id: string) => boolean;
    context?: OdysseyPreparationContext;
    /** Text of the plan this item belongs to. */
    planText: string;
    pathKind?: PlanPathKind;
  },
): Validated<PlanPreparation> {
  const { prefix, isKnownId, planText, pathKind } = options;
  const { context } = options;
  const code = (name: string) => `${prefix}preparation_${name}`;

  if (!isRecord(raw)) return fail(code("shape"));
  const { catalogId, title, kind, priority, reason, checkpoint, conditions, alternative } = raw;
  // A stored draft keeps the validated shape, so accept it when reading one back.
  const evidence = raw.evidence ?? {
    questionIds: raw.evidenceQuestionIds,
    explanation: raw.basis,
  };

  if (!PLAN_PREPARATION_KINDS.includes(kind as PlanPreparationKind)) return fail(code("kind"));
  if (!PLAN_PREPARATION_PRIORITIES.includes(priority as PlanPreparationPriority)) {
    return fail(code("priority"));
  }
  if (
    !isText(title) ||
    !isText(reason) ||
    !isText(checkpoint) ||
    !isText(conditions, false) ||
    !isText(alternative, false)
  ) {
    return fail(code("text"));
  }
  if (
    !isRecord(evidence) ||
    !isText(evidence.explanation) ||
    !Array.isArray(evidence.questionIds) ||
    evidence.questionIds.length < 1 ||
    !evidence.questionIds.every((id) => typeof id === "string" && isKnownId(id))
  ) {
    return fail(code("evidence"));
  }

  const texts = [title, reason, checkpoint, conditions, alternative];
  if (texts.some((text) => LINK.test(text))) return fail(code("link"));

  const hasCatalogId = typeof catalogId === "string" && catalogId.length > 0;
  const entry = hasCatalogId ? findPreparationCatalogEntry(catalogId) : undefined;
  if (hasCatalogId && !entry) return fail(code("unknown_catalog"));

  if (!entry) {
    if (kind === "credential" || UNLISTED_CREDENTIAL.test(title)) {
      return fail(code("unlisted_credential"));
    }
    if (texts.some((text) => REQUIRED_CLAIM.test(text))) return fail(code("unsourced_required"));
  } else {
    if (kind !== "credential") return fail(code("kind"));
    if (entry.requirement !== "required" && texts.some((text) => REQUIRED_CLAIM.test(text))) {
      return fail(code("unsourced_required"));
    }
    // Needs the user's answers, so it runs at generation and not on a stored draft.
    if (context) {
      if (context.outsideKorea) return fail(code("region"));
      if (context.heldText.includes(entry.name)) return fail(code("already_held"));
      const haystack = `${planText} ${context.answerText}`;
      if (!entry.keywords.some((keyword) => haystack.includes(keyword))) {
        return fail(code("unrelated"));
      }
      if (priority === "start_first") {
        if (context.lowOnTime) return fail(code("exceeds_time"));
        if (pathKind && context.unsurePaths.includes(pathKind)) return fail(code("too_early"));
      }
    }
  }

  return {
    ok: true,
    value: {
      catalogId: entry?.id ?? null,
      // The catalog name wins, so the model cannot rename a verified credential.
      title: entry?.name ?? title,
      kind: kind as PlanPreparationKind,
      priority: priority as PlanPreparationPriority,
      reason,
      basis: evidence.explanation,
      evidenceQuestionIds: evidence.questionIds as string[],
      checkpoint,
      conditions,
      alternative,
    },
  };
}
