/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const nextConfig = {
    webpack: (config) => {
        // This is to handle the PDF.js worker
        config.resolve.alias.canvas = false;
        // Add rule for Lottie JSON files
        config.module.rules.push({
            test: /\.lottie$/,
            type: 'asset/source',
            use: {
                loader: 'lottie-loader',
            },
        });
        config.resolve.fallback = { fs: false, net: false, tls: false, child_process: false };
        return config;
    },
    images: {
        remotePatterns: [{
                protocol: 'https',
                hostname: process.env.NEXT_PUBLIC_PICTURES_S3 || 'localhost',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: process.env.NEXT_PUBLIC_VIDEOS_CLOUDFRONT || 'localhost',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: process.env.NEXT_PUBLIC_WEBTOONS_S3 || 'localhost',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'picsum.photos',
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
            }, ],
        }, ];
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
    staticPageGenerationTimeout: 180,
};