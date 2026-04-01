import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 开发模式下用手机通过局域网 IP 访问时，浏览器会以 192.168.x.x 等为 Origin 请求 /_next/*；
  // 默认只允许 localhost / 0.0.0.0，会导致 JS chunk 403，页面一直停在 Loading。
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
};

export default nextConfig;
