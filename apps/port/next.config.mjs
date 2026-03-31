import createMDX from '@next/mdx';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  async rewrites() {
    return [
      {
        source: '/burnkit',
        destination: 'http://localhost:3001/burnkit',
      },
      {
        source: '/burnkit/:path*',
        destination: 'http://localhost:3001/burnkit/:path*',
      },
      {
        source: '/timekit',
        destination: 'http://localhost:3002/timekit',
      },
      {
        source: '/timekit/:path*',
        destination: 'http://localhost:3002/timekit/:path*',
      },
      {
        source: '/sente',
        destination: 'http://localhost:3003/sente',
      },
      {
        source: '/sente/:path*',
        destination: 'http://localhost:3003/sente/:path*',
      },
      {
        source: '/memorykit',
        destination: 'http://localhost:3004/memorykit',
      },
      {
        source: '/memorykit/:path*',
        destination: 'http://localhost:3004/memorykit/:path*',
      },
    ];
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

export default withMDX(nextConfig);
