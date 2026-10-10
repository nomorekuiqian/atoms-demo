import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atoms Lite",
  description: "Describe an app. A team of AI agents builds it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
