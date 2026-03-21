"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import LoginRequiredModal from "@/features/auth/components/LoginRequiredModal";

type PlanAuthModalContextValue = {
  /** Opens the shared login modal; after OAuth, NextAuth redirects to `callbackUrl`. */
  openLoginRequiredModal: (callbackUrl: string) => void;
};

const PlanAuthModalContext = createContext<PlanAuthModalContextValue | null>(
  null,
);

export function usePlanAuthModal(): PlanAuthModalContextValue {
  const ctx = useContext(PlanAuthModalContext);
  if (!ctx) {
    throw new Error(
      "usePlanAuthModal must be used within PlanAuthModalProvider",
    );
  }
  return ctx;
}

export function PlanAuthModalProvider({ children }: { children: ReactNode }) {
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

  const openLoginRequiredModal = useCallback((url: string) => {
    setCallbackUrl(url);
  }, []);

  const value = useMemo(
    () => ({ openLoginRequiredModal }),
    [openLoginRequiredModal],
  );

  return (
    <PlanAuthModalContext.Provider value={value}>
      <LoginRequiredModal
        open={callbackUrl !== null}
        onClose={() => setCallbackUrl(null)}
        callbackUrl={callbackUrl ?? "/"}
      />
      {children}
    </PlanAuthModalContext.Provider>
  );
}
