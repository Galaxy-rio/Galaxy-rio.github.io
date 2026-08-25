import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "你的名字 — 设计与前端作品集",
  description:
    "一个采用 Material 3 Expressive 设计语言的个人作品集雏形，展示项目、能力与联系方式。",
};

const themeScript = `
  (function () {
    try {
      var saved = localStorage.getItem('portfolio-theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.dataset.theme = saved || (prefersDark ? 'dark' : 'light');
    } catch (error) {
      document.documentElement.dataset.theme = 'light';
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
