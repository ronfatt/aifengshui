import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Fengshui OS",
  description: "AI 风水师、点数钱包、会员订阅、商城课程、推荐分润与后台管理的一体化 SaaS 原型"
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
