"use client";

import Link from "next/link";

import { ModalShell } from "@/components/common/ModalShell";
import SocialLoginButtons from "@/features/auth/components/SocialLoginButtons";

type LoginRequiredModalProps = {
  open: boolean;
  onClose?: () => void;
  /**
   * Where to send the user after a successful OAuth sign-in.
   */
  callbackUrl?: string;
  title?: string;
  description?: string;
};

const LoginRequiredModal = ({
  open,
  onClose,
  callbackUrl = "/",
  title = "Sign in required",
  description = "Create and view plans after you sign in with Google or Kakao.",
}: LoginRequiredModalProps) => {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      titleId="login-required-title"
      showCloseButton={Boolean(onClose)}
    >
      <h2
        id="login-required-title"
        className="pr-8 text-xl font-semibold tracking-tight text-black dark:text-zinc-50"
      >
        {title}
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {description}
      </p>

      <div className="mt-6">
        <SocialLoginButtons callbackUrl={callbackUrl} />
      </div>

      {/* <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-600 underline underline-offset-4 dark:text-zinc-400"
        >
          Back to home
        </Link>
      </div> */}
    </ModalShell>
  );
};

export default LoginRequiredModal;
