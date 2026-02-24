import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const ioskeley = localFont({
  src: [
    { path: "./fonts/IoskeleyMono-Light.woff2", weight: "300" },
    { path: "./fonts/IoskeleyMono-Regular.woff2", weight: "400" },
    { path: "./fonts/IoskeleyMono-Medium.woff2", weight: "500" },
    { path: "./fonts/IoskeleyMono-SemiBold.woff2", weight: "600" },
    { path: "./fonts/IoskeleyMono-Bold.woff2", weight: "700" },
  ],
  variable: "--font-ioskeley",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pleroma – AI Syllabus Generator",
  description: "Generate structured educational syllabuses and lessons with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ioskeley.variable} antialiased`}>{children}</body>
    </html>
  );
}
