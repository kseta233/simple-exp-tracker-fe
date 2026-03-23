import type { Metadata } from "next";
import { DM_Serif_Display, Manrope } from "next/font/google";
import { AppStoreProvider } from "@/providers/app-store";
import "./globals.css";

const fontSans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans"
});

const fontHeading = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-heading"
});

export const metadata: Metadata = {
  title: "Expense Tracker MVP",
  description: "Local-first expense tracker with draft confirmation and category analytics"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fontSans.variable} ${fontHeading.variable}`}>
        <AppStoreProvider>{children}</AppStoreProvider>
      </body>
    </html>
  );
}

