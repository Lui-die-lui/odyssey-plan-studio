"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import ExistingPlanConfirmModal from "@/features/plan/components/ExistingPlanConfirmModal";
import { loginHref } from "@/features/auth/lib/login-href";
import { LandingConfetti } from "@/features/landing/components/LandingConfetti";
import { getNewPlanPath } from "@/features/plan/constants/plan.constants";
import { useMyPlan } from "@/features/plan/hooks/useMyPlan";

const LandingPage = () => {
  const router = useRouter();
  const { status } = useSession();
  const { plan: existingPlan, loading: planLoading } = useMyPlan({
    autoLoad: status === "authenticated",
  });
  const [replacePlanModalOpen, setReplacePlanModalOpen] = useState(false);

  const ctaDisabled =
    status === "loading" ||
    (status === "authenticated" && planLoading);

  const primaryCtaClass =
    "inline-flex min-h-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-zinc-900 px-10 text-sm font-semibold tracking-[0.1em] text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-45 " +
    "dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-zinc-950/20 dark:hover:bg-white";

  const secondaryCtaClass =
    "inline-flex min-h-12 shrink-0 items-center justify-center rounded-full border border-zinc-300/90 bg-white/60 px-8 text-sm font-medium tracking-tight text-zinc-700 backdrop-blur-sm transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/60";

  const renderPrimaryCta = () => {
    if (ctaDisabled) {
      return (
        <button type="button" disabled className={primaryCtaClass}>
          CREATE
        </button>
      );
    }
    if (status === "authenticated") {
      if (existingPlan) {
        return (
          <button
            type="button"
            onClick={() => setReplacePlanModalOpen(true)}
            className={primaryCtaClass}
          >
            CREATE
          </button>
        );
      }
      return (
        <Link href={getNewPlanPath(false)} className={primaryCtaClass}>
          CREATE
        </Link>
      );
    }
    return (
      <button
        type="button"
        onClick={() => router.push(loginHref("/plan/new"))}
        className={primaryCtaClass}
      >
        CREATE
      </button>
    );
  };

  const showGuestSecondary = status === "unauthenticated" && !ctaDisabled;

  const hasSavedPlan =
    status === "authenticated" && !planLoading && existingPlan != null;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-app-canvas dark:bg-app-canvas-dark">
      <ExistingPlanConfirmModal
        open={replacePlanModalOpen}
        onCancel={() => setReplacePlanModalOpen(false)}
        onConfirm={() => {
          setReplacePlanModalOpen(false);
          router.push(getNewPlanPath(true));
        }}
      />

      <LandingConfetti colorVariant={hasSavedPlan ? "colored" : "neutral"} />
        
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 md:items-start lg:px-8 lg:pb-24 lg:pt-16">
        <div className="flex w-full max-w-xl flex-col items-center text-center md:items-start md:text-left">
          <p className="text-xs font-medium tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
            my 5-year plan
          </p>
          <h1 className="mt-3 text-5xl leading-none tracking-tight text-[#151515] antialiased dark:text-[#FEFEFE] md:text-7xl">
            <span className="font-landing-logo-serif-strong">MY</span>{" "}
            <span className="font-landing-logo-serif">ODYSSEY</span>
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-600 sm:text-base md:mx-0 dark:text-zinc-400">
            내 5년의 방향을 가볍고 선명하게 정리해보세요.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            {renderPrimaryCta()}
            {/* {showGuestSecondary ? (
              <Link href="/login" className={secondaryCtaClass}>
                LOGIN
              </Link>
            ) : null} */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
