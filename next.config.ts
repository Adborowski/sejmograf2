import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: let a phone load the dev server over the LAN or a Cloudflare quick tunnel
  allowedDevOrigins: ['192.168.1.16', '*.trycloudflare.com'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/**',
      },
    ],
  },
};

export default nextConfig;
