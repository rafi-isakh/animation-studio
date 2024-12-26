/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const pwaConfig = withPWA({
    dest: 'public', // Where the service worker and cache files will be output
    register: true, // Automatically registers the service worker
    skipWaiting: true, // Ensures updated service worker activates immediately
});

const nextConfig = {
    webpack: (config) => {
        // Add rule for Lottie JSON files
        config.module.rules.push({
            test: /\.lottie$/,
            type: 'asset/source',
            use: {
                loader: 'lottie-loader',
            },
        });
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
                hostname: process.env.NEXT_PUBLIC_VIDEOS_S3 || 'localhost',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: process.env.NEXT_PUBLIC_WEBTOONS_S3,
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

export default pwaConfig({...nextConfig });