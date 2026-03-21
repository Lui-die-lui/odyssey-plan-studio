import type { Metadata } from "next";
import { Black_Han_Sans, Noto_Sans_KR } from "next/font/google";

/** Matches landing hero `.font-landing-odyssey` (Black Han Sans). */
const brandOdyssey = Black_Han_Sans({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-brand-odyssey",
});

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
      className={`${noto.className} ${brandOdyssey.variable} flex min-h-screen w-full flex-col items-center justify-center bg-white text-zinc-900`}
    >
      {children}
    </div>
  );
}
