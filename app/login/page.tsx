import { SocialLoginButtons } from "@/features/auth/components/SocialLoginButtons";

export default function LoginPage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-md flex-col gap-6 bg-white px-6 py-12 text-black dark:bg-black dark:text-zinc-50">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Social Login</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Sign in using one of the social providers below.
          </p>
        </header>

        <SocialLoginButtons />
      </main>
    </div>
  );
}
