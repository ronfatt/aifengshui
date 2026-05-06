import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Feng Shui Master",
  description: "结合 AI 分析与易玺大师判断的风水命理服务与创业平台"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
