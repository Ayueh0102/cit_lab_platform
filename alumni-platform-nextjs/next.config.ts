import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks', '@mantine/notifications', '@mantine/dates'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5001',
        pathname: '/api/files/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5001',
        pathname: '/static/**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development', // 開發環境不使用優化
  },
};

export default nextConfig;
