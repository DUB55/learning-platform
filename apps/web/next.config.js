/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  typescript: {
    ignoreBuildErrors: true, // Skip all TypeScript build errors on Vercel
  },
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint during builds
  },

  webpack: (config, { isServer }) => {
    // Fixes for npm packages depending on node core modules on client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };

      // Mark pptxgenjs as external to prevent bundling
      config.externals = config.externals || [];
      config.externals.push('pptxgenjs');
    }

    return config;
  },
};

module.exports = nextConfig;
