import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";

const noto = Noto_Sans_KR({
  weight: ["400", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PlanSummaryPdfLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${noto.className} flex min-h-screen w-full flex-col items-center justify-center bg-white text-zinc-900`}
    >
      {children}
    </div>
  );
}
