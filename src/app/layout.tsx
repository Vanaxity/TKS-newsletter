import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TKS articles",
  description: "Cool videos from #r-thisiscool, turned into articles for TKS students.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The inline script sets data-theme before first paint, so the server's default may differ from the client's.
    <html lang="en" data-theme="light" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col bg-page font-sans text-ink">{children}</body>
    </html>
  );
}
