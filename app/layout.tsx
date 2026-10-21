import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Providers } from "@/providers/Providers";
import { Analytics } from "@vercel/analytics/next";
import { NavBar } from "@/components/layout/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sejmograf",
  description: "Monitor frekwencji posłów polskiego Sejmu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Analytics />
          <NavBar />
          <div className="min-h-[calc(100vh-3.5rem)]">{children}</div>
          <footer className="border-t border-slate-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
              <div>
                <p className="font-semibold tracking-tight text-slate-900">Sejmograf</p>
                <p className="text-slate-500 mt-0.5">
                  Niezależny monitor pracy posłów. Dane:{" "}
                  <a href="https://api.sejm.gov.pl" target="_blank" rel="noopener noreferrer" className="underline decoration-slate-300 hover:text-slate-800">
                    API Sejmu RP
                  </a>
                  .
                </p>
              </div>
              <div className="flex items-center gap-5 text-slate-500">
                <Link href="/contact" className="hover:text-slate-900 transition-colors">Kontakt</Link>
                <Link href="/privacy" className="hover:text-slate-900 transition-colors">Polityka prywatności</Link>
                <span className="text-slate-400">© {new Date().getFullYear()} Adam Borowski Digital</span>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
