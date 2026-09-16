/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/nks/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
