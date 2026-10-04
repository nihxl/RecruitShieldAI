import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: '%s — RecruitShield AI',
    default: 'RecruitShield AI',
  },
  description: "Protecting job seekers through transparency and AI",
};

import { TopBar } from "../components/TopBar";
import { Footer } from "../components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${publicSans.variable} antialiased`}>
      <body className="min-h-full flex flex-col relative">
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-surface p-4 rounded-[var(--radius-control)] text-primary border-2 border-primary font-bold shadow-lg"
        >
          Skip to main content
        </a>
        
        <TopBar />
        
        <main id="main-content" className="flex-1 flex flex-col w-full">
          {children}
        </main>
        
        <Footer />
      </body>
    </html>
  );
}
