/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@recruitflow/core'],
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        'node:crypto': false,
        buffer: false,
      };
    }
    return config;
  },
};

export default nextConfig;
