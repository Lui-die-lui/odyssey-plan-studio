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

export const metadata: Metadata = {
  title: "Odyssey Plan",
  description: "Odyssey Plan app.",
  icons: {
    // Favicon for browser tab (served from /public)
    icon: "/odyssey.PNG",
    // Some browsers / contexts use this rel for the same favicon
    shortcut: "/odyssey.PNG",
    // Pinned tabs / mobile homescreen
    apple: "/odyssey.PNG",
    // Fallback (Safari pinned tabs mask icon)
    other: [
      {
        rel: "mask-icon",
        url: "/odyssey.PNG",
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
