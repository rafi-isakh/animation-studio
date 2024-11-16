/** @type {import('next').NextConfig} */
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

export default nextConfig;