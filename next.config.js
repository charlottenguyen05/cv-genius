/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration Next.js 14
  experimental: {
    // Enable webpack config customization
    esmExternals: 'loose',
  },
  // Ensure proper transpilation
  transpilePackages: [],
};

module.exports = nextConfig; 