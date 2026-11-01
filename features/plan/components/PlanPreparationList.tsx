"use client";

import {
  PLAN_PREPARATION_CREDENTIAL_TITLE,
  PLAN_PREPARATION_KIND_LABELS,
  PLAN_PREPARATION_LOOKUPS,
  PLAN_PREPARATION_NOTE,
  PLAN_PREPARATION_PRIORITY_LABELS,
  PLAN_PREPARATION_SHARED_TITLE,
  PLAN_PREPARATION_STUDY_TITLE,
  PLAN_PREPARATION_TITLE,
  PLAN_PREPARATION_UNVERIFIED_LABEL,
  findPreparationCatalogEntry,
} from "../constants/plan-preparation.constants";
import type { PlanPreparation } from "../types/plan.types";

function Field({ label, text }: { label: string; text: string }) {
  if (!text.trim()) return null;
  return (
    <p className="text-sm leading-relaxed text-ink-2">
      <span className="text-ink-3">{label}: </span>
      {text}
    </p>
  );
}

function PreparationItem({ item }: { item: PlanPreparation }) {
  const entry = findPreparationCatalogEntry(item.catalogId);
  return (
    <li className="border-l-2 border-line-strong pl-3">
      <p className="text-[15px] font-medium leading-relaxed text-ink">{item.title}</p>
      <p className="text-xs text-ink-3">
        {PLAN_PREPARATION_KIND_LABELS[item.kind]} · {PLAN_PREPARATION_PRIORITY_LABELS[item.priority]}
        {" · "}
        {entry ? entry.requirementLabel : PLAN_PREPARATION_UNVERIFIED_LABEL}
      </p>
      <div className="mt-1 flex flex-col gap-0.5">
        <Field label="왜 필요한가요" text={item.reason} />
        <Field label="내 답변과의 연결" text={item.basis} />
        <Field label="마치면 할 수 있는 것" text={item.checkpoint} />
        <Field label="확인할 조건" text={item.conditions} />
        <Field label="자격 없이 확인하는 방법" text={item.alternative} />
      </div>
      {entry ? (
        <p className="mt-1 text-xs text-ink-3">
          {entry.basis ? `근거 ${entry.basis} · ` : ""}
          <a
            href={entry.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-ink"
          >
            {entry.sourceName}
          </a>{" "}
          · {entry.checkedAt} 확인
        </p>
      ) : null}
    </li>
  );
}

/** Stays collapsed so the path itself is considered before any list of things to study. */
export function PlanPreparationList({
  items,
  shared,
  credentialNote,
}: {
  items: PlanPreparation[];
  shared: PlanPreparation[];
  credentialNote: string;
}) {
  if (!items.length && !shared.length && !credentialNote) return null;

  const studies = items.filter((item) => item.kind !== "credential");
  const credentials = items.filter((item) => item.kind === "credential");

  return (
    <details>
      <summary className="flex min-h-11 items-center text-sm font-medium text-ink-2">
        {PLAN_PREPARATION_TITLE}
      </summary>
      <p className="mb-3 text-sm leading-relaxed text-ink-3">{PLAN_PREPARATION_NOTE}</p>
      <section>
        <h4 className="text-sm font-semibold text-ink">{PLAN_PREPARATION_STUDY_TITLE}</h4>
        {studies.length ? (
          <ul className="mt-2 flex flex-col gap-4">
            {studies.map((item) => (
              <PreparationItem key={item.title} item={item} />
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-ink-3">먼저 작은 실험으로 필요한 공부를 찾아보세요.</p>
        )}
      </section>
      <section className="mt-4">
        <h4 className="text-sm font-semibold text-ink">{PLAN_PREPARATION_CREDENTIAL_TITLE}</h4>
        {credentials.length ? (
          <ul className="mt-2 flex flex-col gap-4">
            {credentials.map((item) => (
              <PreparationItem key={item.title} item={item} />
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-ink-2">
            {credentialNote || "희망 직무가 정해지면 필요한 자격을 확인해 보세요."}
          </p>
        )}
      </section>
      {shared.length ? (
        <section className="mt-4">
          <h4 className="text-sm font-medium text-ink-3">{PLAN_PREPARATION_SHARED_TITLE}</h4>
          <ul className="mt-2 flex flex-col gap-4">
            {shared.map((item) => (
              <PreparationItem key={item.title} item={item} />
            ))}
          </ul>
        </section>
      ) : null}
      <p className="mt-3 text-xs leading-relaxed text-ink-3">
        직접 찾아보기:{" "}
        {PLAN_PREPARATION_LOOKUPS.map((lookup, index) => (
          <span key={lookup.url}>
            {index > 0 ? " · " : ""}
            <a
              href={lookup.url}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-ink"
            >
              {lookup.name}
            </a>
          </span>
        ))}
      </p>
    </details>
  );
}
