import createMDX from '@next/mdx';

const BURNKIT_URL = process.env.BURNKIT_URL || 'http://localhost:3001';
const TIMEKIT_URL = process.env.TIMEKIT_URL || 'http://localhost:3002';
const SENTE_URL = process.env.SENTE_URL || 'http://localhost:3003';
const MEMORYKIT_URL = process.env.MEMORYKIT_URL || 'http://localhost:3004';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  async rewrites() {
    return [
      { source: '/burnkit', destination: `${BURNKIT_URL}/burnkit` },
      { source: '/burnkit/:path*', destination: `${BURNKIT_URL}/burnkit/:path*` },
      { source: '/timekit', destination: `${TIMEKIT_URL}/timekit` },
      { source: '/timekit/:path*', destination: `${TIMEKIT_URL}/timekit/:path*` },
      { source: '/sente', destination: `${SENTE_URL}/sente` },
      { source: '/sente/:path*', destination: `${SENTE_URL}/sente/:path*` },
      { source: '/memorykit', destination: `${MEMORYKIT_URL}/memorykit` },
      { source: '/memorykit/:path*', destination: `${MEMORYKIT_URL}/memorykit/:path*` },
    ];
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

export default withMDX(nextConfig);
