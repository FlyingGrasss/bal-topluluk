import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Toaster } from "@/components/ui/Toaster";
import "./globals.css";

const description =
  "BAL Topluluk; kulüpleri, etkinlikleri ve mahallenin dijital panosunu tek yerde buluşturur.";

export const metadata: Metadata = {
  title: {
    default: "BAL Topluluk — Mahallenin dijital panosu",
    template: "%s · BAL Topluluk",
  },
  description,
  applicationName: "BAL Topluluk",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "BAL Topluluk",
    title: "BAL Topluluk",
    description,
  },
  twitter: {
    card: "summary",
    title: "BAL Topluluk",
    description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  themeColor: "#fafafa",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>
        <a
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:border focus:border-[color:var(--border)] focus:bg-[color:var(--surface)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
          href="#icerik"
        >
          İçeriğe geç
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
        <Toaster />
      </body>
    </html>
  );
}
