/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,

    env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },

    webpack: (config, { isServer }) => {
        // Fixes npm packages that depend on `fs` module
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

        const nextConfig = {
            typescript: {
                ignoreBuildErrors: true,  // 👈 Skip ALL TS errors
            },
        };

        module.exports = nextConfig;

    },
}

module.exports = nextConfig
