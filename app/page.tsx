import Link from "next/link";

const LandingPage = () => {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col gap-8 bg-white px-6 py-14 dark:bg-black sm:px-10">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Odyssey Plan
          </h1>
          <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
            Plan your next steps in minutes. Create a new plan, keep track
            of progress, and revisit it anytime.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="flex h-11 items-center justify-center rounded-md bg-black px-5 text-sm font-medium text-white transition-colors hover:bg-black/90 dark:bg-zinc-200 dark:text-black"
          >
            Login
          </Link>

          <Link
            href="/plan/new"
            className="flex h-11 items-center justify-center rounded-md border border-black/10 bg-white px-5 text-sm font-medium text-black transition-colors hover:bg-black/[.03] dark:border-white/10 dark:bg-black dark:text-zinc-50"
          >
            Create New Plan
          </Link>

          <Link
            href="/my-plan"
            className="flex h-11 items-center justify-center rounded-md border border-black/10 bg-white px-5 text-sm font-medium text-black transition-colors hover:bg-black/[.03] dark:border-white/10 dark:bg-black dark:text-zinc-50"
          >
            My Plan
          </Link>
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          This is a simple landing page. Add more sections as the product grows.
        </p>
      </main>
    </div>
  );
};

export default LandingPage;
