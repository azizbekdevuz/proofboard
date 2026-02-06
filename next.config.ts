import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["static.usernames.app-backend.toolsforhumanity.com"],
  },
  // Allow ngrok and other tunnel dev origins (subdomain changes each ngrok session)
  allowedDevOrigins: [
    "*",
    "*.ngrok-free.app",
    "https://f560-112-219-86-244.ngrok-free.app",
  ],
  reactStrictMode: false,
};

export default nextConfig;
