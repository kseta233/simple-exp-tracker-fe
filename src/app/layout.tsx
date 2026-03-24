import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { AuthGate } from "@/components/auth-gate";
import { AppStoreProvider } from "@/providers/app-store";
import "./globals.css";

const fontHeading = Manrope({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-heading"
});

const fontSans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans"
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
        <AuthGate>
          <AppStoreProvider>{children}</AppStoreProvider>
        </AuthGate>
      </body>
    </html>
  );
}

