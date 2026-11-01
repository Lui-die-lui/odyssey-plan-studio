import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { ConditionalAppShell } from "@/components/layout/ConditionalAppShell";
import SessionProvider from "@/providers/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const ogImageUrl =
  "https://firebasestorage.googleapis.com/v0/b/lui-archive.firebasestorage.app/o/portfolio%2Fprojects%2FOG_Image%2FOGimage_odyssey.png?alt=media&token=3b70ccd0-1b41-438d-9b82-4ab1177fc1c9";

export const metadata: Metadata = {
  title: "My Odyssey",
  description: "질문에 답하고, 앞으로 5년을 직접 시도해 볼 수 있는 계획으로 정리하세요.",
  openGraph: {
    title: "My Odyssey",
    description: "질문에 답하고, 앞으로 5년을 직접 시도해 볼 수 있는 계획으로 정리하세요.",
    images: [{ url: ogImageUrl }],
  },
  twitter: {
    card: "summary_large_image",
    title: "My Odyssey",
    description: "질문에 답하고, 앞으로 5년을 직접 시도해 볼 수 있는 계획으로 정리하세요.",
    images: [ogImageUrl],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
    other: [
      {
        rel: "mask-icon",
        url: "/icon.png",
      },
    ],
  },
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansKr.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas font-sans text-ink">
        <SessionProvider>
          <div className="flex min-h-full flex-1 flex-col">
            <ConditionalAppShell>{children}</ConditionalAppShell>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
};

export default RootLayout;
