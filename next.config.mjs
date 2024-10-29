/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [{
            protocol: 'https',
            hostname: process.env.NEXT_PUBLIC_CLOUDFRONT,
            pathname: '/**',
        }, ],
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

export default nextConfig;