import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 东方智慧决策系统 | AI Eastern Wisdom Decision System",
  description: "结合 AI 东方智慧与易易大师判断的决策服务与创业平台"
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
