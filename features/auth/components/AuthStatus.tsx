"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthStatus() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="text-sm text-zinc-600">Checking auth…</div>;
  }

  if (session) {
    const name = session.user?.name ?? session.user?.email ?? "User";
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm text-zinc-700 dark:text-zinc-300">
          Logged in as <span className="font-medium">{name}</span>
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="rounded-md border border-black/10 bg-white px-3 py-1 text-sm font-medium text-black transition-colors hover:bg-black/[.03] dark:border-white/10 dark:bg-black dark:text-zinc-50"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        You are not logged in.
      </div>
      <button
        type="button"
        onClick={() => signIn("google")}
        className="rounded-md border border-black/10 bg-white px-3 py-1 text-sm font-medium text-black transition-colors hover:bg-black/[.03] dark:border-white/10 dark:bg-black dark:text-zinc-50"
      >
        Login with Google
      </button>
    </div>
  );
}

