import SocialLoginButtons from "@/features/auth/components/SocialLoginButtons";
import { SubpageGlassVeil } from "@/components/layout/SubpageGlassVeil";
import { LandingConfetti } from "@/features/landing/components/LandingConfetti";

export default function LoginPage() {
  return (
    <div className="relative flex flex-col flex-1 items-center justify-center overflow-hidden bg-app-canvas font-sans dark:bg-black">
      <LandingConfetti />
      <SubpageGlassVeil />
      <main className="relative z-10 flex w-full max-w-md flex-col gap-6 bg-white px-6 py-12 text-black dark:bg-black dark:text-zinc-50">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Social Login</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Choose Google or Kakao to sign in.
          </p>
        </header>

        <SocialLoginButtons />
      </main>
    </div>
  );
}
