/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: process.env.NEXT_PUBLIC_PICTURES_S3,
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: process.env.NEXT_PUBLIC_VIDEOS_S3,
                pathname: '/**',
            },
        ],
    },
    async headers() {
        return [{
            source: '/upload/(.*)',
            headers: [{
                key: 'Cache-Control',
                value: 'public, max-age=31536000, immutable',
            },],
        },];
    },
};

const pwaConfig = withPWA({
  dest: 'public',
  disable: false,
  experimental: {
    appDir: true, // Ensures the App Router is enabled
  },
});

export default {
  ...pwaConfig,
  ...nextConfig,
};