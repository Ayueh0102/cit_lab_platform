import type { Metadata } from "next";
import { ColorSchemeScript } from "@mantine/core";
import { MantineProvider } from "@/components/providers/MantineProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "校友平台 | Alumni Platform",
  description: "現代化的校友互動平台，提供職缺媒合、活動管理、系友聯繫等功能",
  keywords: "校友, 職缺, 活動, 校友會, alumni platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no" />
      </head>
      <body>
        <MantineProvider>{children}</MantineProvider>
      </body>
    </html>
  );
}
