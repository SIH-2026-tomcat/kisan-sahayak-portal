/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    PUBLIC_API_URL: process.env.PUBLIC_API_URL,
  },
};

export default nextConfig;
