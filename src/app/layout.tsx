import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simple Expense Tracker",
  description: "Local-first OCR expense tracking MVP"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

