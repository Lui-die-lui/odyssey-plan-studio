"use client";

type SocialLoginButtonsProps = {
  className?: string;
  onGoogleClick?: () => void;
  onKakaoClick?: () => void;
};

const SocialLoginButtons = ({
  className,
  onGoogleClick,
  onKakaoClick,
}: SocialLoginButtonsProps) => {
  const handleGoogleClick = () => {
    // Placeholder: wire up social auth flows later.
    console.log("Google login clicked");
    onGoogleClick?.();
  };

  const handleKakaoClick = () => {
    // Placeholder: wire up social auth flows later.
    console.log("Kakao login clicked");
    onKakaoClick?.();
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