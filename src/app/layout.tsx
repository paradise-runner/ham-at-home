import { Inter } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";
import { Metadata } from "next";
import { GoogleAdsense } from "@/components/google-adsense";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "ham@home",
    template: "%s | ham@home",
  },
  description:
    "A blog covering topics from web development to travel, to food and more.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hamathome.com",
    siteName: "ham@home",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleAdsense />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background antialiased",
          inter.className
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <div className="container mx-auto max-w-4xl px-4 flex-1">
              {children}
            </div>
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
