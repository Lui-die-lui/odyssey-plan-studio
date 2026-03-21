"use client";

import { signIn } from "next-auth/react";

type SocialLoginButtonsProps = {
  className?: string;
  callbackUrl?: string;
  onGoogleClick?: () => void;
  onKakaoClick?: () => void;
};

const SocialLoginButtons = ({
  className,
  callbackUrl = "/",
  onGoogleClick,
  onKakaoClick,
}: SocialLoginButtonsProps) => {
  const handleGoogleClick = () => {
    onGoogleClick?.();
    signIn("google", { callbackUrl });
  };

  const handleKakaoClick = () => {
    onKakaoClick?.();
    signIn("kakao", { callbackUrl });
  };

  return (
    <section className={className}>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleGoogleClick}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-black/10 bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-black/[.03] dark:border-white/10 dark:bg-black dark:text-zinc-50"
        >
          <span aria-hidden className="text-base">
            G
          </span>
          Continue with Google
        </button>

        <button
          type="button"
          onClick={handleKakaoClick}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#FEE500] px-4 text-sm font-medium text-black transition-colors hover:brightness-95"
        >
          <span aria-hidden className="text-base">
            K
          </span>
          Continue with Kakao
        </button>
      </div>
    </section>
  );
};

export { SocialLoginButtons };
export default SocialLoginButtons;