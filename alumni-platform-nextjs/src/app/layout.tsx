import type { Metadata } from "next";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import { MantineProvider } from "@/components/providers/MantineProvider";
import { GlobalErrorBoundary } from "@/components/error";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "色彩與照明科技研究所系友會 | NTUST-CIT Alumni Association",
  description: "台科大色彩與照明科技研究所系友會平台，提供職缺媒合、活動管理、系友聯繫等功能",
  keywords: "色彩所, CIT, 系友會, 台科大, 職缺, 活動, alumni platform, NTUST",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" {...mantineHtmlProps} suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, viewport-fit=cover" />
      </head>
      <body suppressHydrationWarning>
        <MantineProvider>
          <GlobalErrorBoundary>
            <AuroraBackground />
            {children}
          </GlobalErrorBoundary>
        </MantineProvider>
      </body>
    </html>
  );
}
