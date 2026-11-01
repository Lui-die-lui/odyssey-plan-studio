"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { buttonClass } from "@/components/common/ui";
import ExistingPlanConfirmModal from "@/features/plan/components/ExistingPlanConfirmModal";
import { loginHref } from "@/features/auth/lib/login-href";
import { computePlanFill } from "@/features/field/future-field-core";
import { setFieldFill } from "@/features/field/future-field-store";
import { LandingPlanPreview } from "@/features/landing/components/LandingPlanPreview";
import { getNewPlanPath } from "@/features/plan/constants/plan.constants";
import { useMyPlan } from "@/features/plan/hooks/useMyPlan";

const STEPS = [
  {
    title: "질문에 답하기",
    description: "지금의 삶과 시간, 지켜야 할 조건을 답합니다. 모르는 질문은 넘어갈 수 있어요.",
  },
  {
    title: "세 경로 비교하고 고치기",
    description: "경로마다 5년의 흐름을 확인하고 내 문장으로 고칩니다.",
  },
  {
    title: "느낌을 평가하고 저장하기",
    description: "경로마다 지금의 느낌을 직접 평가해 저장하고, PDF로 내보냅니다. 한 경로만 고르지 않아도 돼요.",
  },
];

/** A hint of what the field becomes, before the user has made any choice. */
const LANDING_PREVIEW_FILL = 0.12;

const LandingPage = () => {
  const router = useRouter();
  const { status } = useSession();
  const { plan: existingPlan, loading: planLoading } = useMyPlan({
    autoLoad: status === "authenticated",
  });
  const [replacePlanModalOpen, setReplacePlanModalOpen] = useState(false);

  useEffect(() => {
    setFieldFill(existingPlan ? computePlanFill(existingPlan.years) : LANDING_PREVIEW_FILL);
  }, [existingPlan]);

  const ctaLoading =
    status === "loading" || (status === "authenticated" && planLoading);

  const renderActions = () => {
    if (ctaLoading) {
      return (
        <button type="button" disabled className={buttonClass("primary", "min-w-40")}>
          플랜 시작하기
        </button>
      );
    }
    if (status === "authenticated" && existingPlan) {
      return (
        <>
          <Link href="/my-plan" className={buttonClass("primary", "min-w-40")}>
            내 플랜 보기
          </Link>
          <button
            type="button"
            onClick={() => setReplacePlanModalOpen(true)}
            className={buttonClass("secondary")}
          >
            새 플랜 만들기
          </button>
        </>
      );
    }
    if (status === "authenticated") {
      return (
        <Link href={getNewPlanPath(false)} className={buttonClass("primary", "min-w-40")}>
          플랜 시작하기
        </Link>
      );
    }
    return (
      <Link href={loginHref("/plan/new")} className={buttonClass("primary", "min-w-40")}>
        플랜 시작하기
      </Link>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ExistingPlanConfirmModal
        open={replacePlanModalOpen}
        onCancel={() => setReplacePlanModalOpen(false)}
        onConfirm={() => {
          setReplacePlanModalOpen(false);
          router.push(getNewPlanPath(true));
        }}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:pt-20">
        <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
          <div className="field-calm rounded-xl">
            <h1 className="text-[2rem] font-semibold leading-[1.2] tracking-tight text-ink sm:text-[2.75rem]">
              하나의 정답 대신,
              <br />
              세 가지 5년을 그려 보세요
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-2">
              지금 이어가는 삶, 다른 길의 삶, 제약을 잠시 내려놓은 삶. 세 경로를 나란히 비교하고,
              큰 결정 전에 작은 실험으로 시험해 보세요.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-2">{renderActions()}</div>
          </div>

          <LandingPlanPreview />
        </section>

        <section
          aria-labelledby="landing-steps"
          className="field-calm mt-16 rounded-xl border-t border-line pt-8 lg:mt-24"
        >
          <h2 id="landing-steps" className="text-sm font-medium text-ink-3">
            이렇게 진행돼요
          </h2>
          <ol className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-10">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <p className="text-sm tabular-nums text-ink-3">{index + 1}</p>
                <h3 className="mt-1 text-base font-semibold text-ink">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-2">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
