/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 서버리스(Vercel) 환경: 네이티브 모듈 금지 (bcrypt 대신 bcryptjs 사용)
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs", "jsonwebtoken"],
  },
};

module.exports = nextConfig;
