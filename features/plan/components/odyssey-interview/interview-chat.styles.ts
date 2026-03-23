/** Shared Tailwind chunks — 대화 턴·옵션 카드 톤 (폼/CTA 지양) */

/** 하단 응답 영역 — 질문 없이 컨트롤만 (얇은 패널) */
export const interviewTurnCardClass =
  "rounded-xl border border-zinc-200/40 bg-white/55 px-2.5 py-2 dark:border-white/[0.07] dark:bg-zinc-900/35";

/** 복수 선택 확정 — 텍스트형 액션, CTA 아님 */
export const interviewTurnSubmitClass =
  "mt-2 w-full rounded-lg py-2 text-center text-sm font-normal text-zinc-500 transition-colors hover:bg-zinc-100/40 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-35 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-200";

export const interviewChoiceButtonClass =
  "w-full rounded-xl border border-transparent bg-zinc-50/30 px-3 py-2 text-left text-sm font-normal leading-snug text-zinc-700 shadow-none transition-[border-color,background-color] duration-200 hover:border-zinc-200/70 hover:bg-zinc-100/45 dark:border-transparent dark:bg-white/[0.02] dark:text-zinc-200 dark:hover:border-white/10 dark:hover:bg-white/[0.05]";

export const interviewChoiceSelectedClass =
  "!border-zinc-400/75 !bg-zinc-100/90 !font-medium !text-zinc-900 hover:!border-zinc-400 " +
  "dark:!border-zinc-500/50 dark:!bg-white/[0.09] dark:!text-zinc-50 dark:hover:!border-zinc-400";

export const interviewBranchingButtonClass =
  "w-full rounded-xl border border-transparent bg-zinc-50/30 px-3 py-2 text-center text-sm font-medium leading-snug text-zinc-800 shadow-none transition-[border-color,background-color] duration-200 hover:border-zinc-200/70 hover:bg-zinc-100/45 dark:border-transparent dark:bg-white/[0.02] dark:text-zinc-100 dark:hover:border-white/10 dark:hover:bg-white/[0.05]";

export const interviewPrimaryBtnClass =
  "inline-flex min-h-9 w-full cursor-pointer items-center justify-center rounded-full bg-zinc-800/90 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-white sm:w-auto sm:min-w-[7.5rem]";

export const interviewSecondaryBtnClass =
  "inline-flex min-h-9 w-full items-center justify-center rounded-full border border-zinc-200/80 bg-white/80 px-4 text-sm font-normal text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-900 sm:w-auto";

export const interviewOtherTriggerLabelClass =
  "text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500";

export const interviewOtherTriggerTextClass =
  "mt-0.5 block text-sm font-normal text-zinc-600 dark:text-zinc-300";

export const interviewDirectInputRowClass =
  "flex items-center gap-2 rounded-xl border border-zinc-200/75 bg-zinc-50/50 px-2.5 py-1 dark:border-white/14 dark:bg-zinc-950/40";

export const interviewDirectInputTextareaClass =
  "min-h-[2.25rem] max-h-24 min-w-0 flex-1 resize-none rounded-lg border-0 bg-transparent px-1.5 py-1 text-[13px] leading-snug text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500";

export const interviewDirectSendBtnClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-white transition-[opacity,background-color] hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-35 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-white";

/** 서술형 펼치기 전 트리거 */
export const interviewTextExpandTriggerClass =
  "w-full rounded-xl border border-dashed border-zinc-200/60 bg-zinc-50/20 py-2.5 text-sm font-normal text-zinc-500 transition-colors hover:border-zinc-300/70 hover:bg-zinc-100/30 hover:text-zinc-700 dark:border-white/[0.1] dark:bg-white/[0.02] dark:text-zinc-400 dark:hover:border-white/18 dark:hover:bg-white/[0.05] dark:hover:text-zinc-200";

export const interviewTextareaClass =
  "w-full resize-none rounded-xl border border-zinc-200/90 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-zinc-900 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:outline-zinc-100";
