import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { AccountLinks, AccountNav } from "@/components/account-nav";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "Format JSON, encode text, build color palettes and prepare pages for sharing. Run developer tools locally in your browser or use the same engines through the Toolzync API.";

export const metadata: Metadata = {
  metadataBase: new URL("https://toolzync.com"),
  title: {
    default: "Toolzync — your everyday developer toolkit",
    template: "%s · Toolzync",
  },
  description,
  keywords: [
    "developer tools",
    "api",
    "base64",
    "json formatter",
    "hash generator",
    "uuid",
    "cron parser",
    "seo tools",
  ],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Toolzync",
    title: "Toolzync — your everyday developer toolkit",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Toolzync — your everyday developer toolkit",
    description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0c100f",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-ink font-sans text-fg antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-lime focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-ink"
        >
          Skip to content
        </a>
        <SiteHeader
          account={
            <Suspense fallback={<AccountLinks signedIn={false} />}>
              <AccountNav />
            </Suspense>
          }
        />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
