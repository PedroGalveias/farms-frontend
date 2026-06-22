import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import SideRail from "@/components/SideRail";
import SiteHeader from "@/components/SiteHeader";
import MobileTabBar from "@/components/MobileTabBar";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import PersonalizationProvider from "@/components/personalization/PersonalizationProvider";
import ThemeProvider from "@/components/theme/ThemeProvider";
import CustomCursor from "@/components/motion/CustomCursor";
import "./globals.css";

// Set the theme class before paint to avoid a flash of the wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem("farms.theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`;

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  // Resolves relative canonical/Open-Graph URLs (e.g. on /farm/[id]) to absolute
  // ones. Set NEXT_PUBLIC_SITE_URL in production; localhost is the dev fallback.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  description:
    "Fresh products, direct from Swiss farms — find what you need at the farm nearest to you.",
  icons: {
    apple: "/apple-icon.png",
    icon: [
      { sizes: "any", url: "/favicon.ico" },
      { sizes: "512x512", type: "image/png", url: "/icon.png" },
    ],
    shortcut: "/favicon.ico",
  },
  title: {
    default: "Swiss farms",
    template: "%s | farms",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={archivo.variable}>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>
          <LanguageProvider>
            <PersonalizationProvider>
              <SideRail />
              <div className="cursor-zone relative z-[1] pb-24 lg:pb-0 lg:pl-[76px]">
                <SiteHeader />
                {children}
              </div>
              <MobileTabBar />
              <CustomCursor />
            </PersonalizationProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
