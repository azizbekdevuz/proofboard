import { auth } from "@/auth";
import ClientProviders from "@/providers";
import { MiniKitErrorBoundary } from "@/components/MiniKitErrorBoundary";
import "@worldcoin/mini-apps-ui-kit-react/styles.css";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Thought",
  description:
    "Share anonymously. Real people only. Your likes, posts, and stats in one place.",
};

/** Mobile-first: full-width viewport, safe area for notches, theme for browser UI. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ddd6f5" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1b4b" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en">
      <body
        className={`app-shell ${geistSans.variable} ${geistMono.variable} h-dvh min-h-dvh`}
        style={{
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
        }}
      >
        <MiniKitErrorBoundary>
          <ClientProviders session={session}>{children}</ClientProviders>
        </MiniKitErrorBoundary>
      </body>
    </html>
  );
}
