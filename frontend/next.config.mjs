/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hiddenridgeedh.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  ...(apiUrl
    ? {
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: `${apiUrl}/api/:path*`,
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
