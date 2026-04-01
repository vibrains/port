import createMDX from '@next/mdx';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  async rewrites() {
    return [
      { source: '/burnkit', destination: 'https://ndos-burnkit.vercel.app/burnkit' },
      { source: '/burnkit/:path*', destination: 'https://ndos-burnkit.vercel.app/burnkit/:path*' },
      { source: '/timekit', destination: 'https://ndos-timekit.vercel.app/timekit' },
      { source: '/timekit/:path*', destination: 'https://ndos-timekit.vercel.app/timekit/:path*' },
      { source: '/sente', destination: 'https://ndos-sente.vercel.app/sente' },
      { source: '/sente/:path*', destination: 'https://ndos-sente.vercel.app/sente/:path*' },
      { source: '/report', destination: 'https://ndos-sente.vercel.app/report' },
      { source: '/report/:path*', destination: 'https://ndos-sente.vercel.app/report/:path*' },
      { source: '/memorykit', destination: 'https://ndos-memorykit.vercel.app/memorykit' },
      { source: '/memorykit/:path*', destination: 'https://ndos-memorykit.vercel.app/memorykit/:path*' },
    ];
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

export default withMDX(nextConfig);
