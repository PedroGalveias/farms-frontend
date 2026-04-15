import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  description: "A Swiss farm search tool!",
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
    <html lang="en">
      <body className={`${manrope.variable} ${fraunces.variable}`}>
        {children}
      </body>
    </html>
  );
}
