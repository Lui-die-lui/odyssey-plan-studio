import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

const ogImageUrl =
  "https://firebasestorage.googleapis.com/v0/b/lui-archive.firebasestorage.app/o/portfolio%2Fprojects%2FOG_Image%2FOGimage_odyssey.png?alt=media&token=3b70ccd0-1b41-438d-9b82-4ab1177fc1c9";

export const metadata: Metadata = {
  title: "Odyssey Plan",
  description: "Odyssey Plan app.",
  openGraph: {
    title: "Odyssey Plan",
    description: "Odyssey Plan app.",
    images: [{ url: ogImageUrl }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Odyssey Plan",
    description: "Odyssey Plan app.",
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
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-app-canvas font-sans dark:bg-app-canvas-dark">
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
