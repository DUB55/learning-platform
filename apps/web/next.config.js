const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // ... rest of config
};

module.exports = withPWA({
  reactStrictMode: true,
  swcMinify: true,

  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  typescript: {
    ignoreBuildErrors: true, // Skip all TypeScript build errors on Vercel
  },
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint during builds
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'play.nintendo.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'img.game8.co' },
      { protocol: 'https', hostname: 'imgcdn.stablediffusionweb.com' },
      { protocol: 'https', hostname: 'www.toonafish.nl' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 'media.licdn.com' },
      { protocol: 'https', hostname: 'images.squarespace-cdn.com' },
      { protocol: 'https', hostname: 'static.wikia.nocookie.net' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // For Google avatars
    ],
  },

  webpack: (config, { isServer, webpack }) => {
    // Fixes for npm packages depending on node core modules on client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        https: false,
        http: false,
        stream: false,
        path: false,
        os: false,
        url: false,
        buffer: false,
      };

      // Handle node: prefix for client-side bundling
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        })
      );
    }

    return config;
  },
});
