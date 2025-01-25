/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizeCss: true,
  },
  webpack: (config, { isServer }) => {
    // Handle native modules
    config.module.rules.push({
      test: /\.node$/,
      use: [
        {
          loader: "node-loader",
          options: {
            name: "[name].[ext]"
          }
        }
      ]
    });

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false
      };

      // Add externals for native modules
      config.externals = {
        ...config.externals,
        '@lancedb/lancedb-win32-x64-msvc': 'commonjs @lancedb/lancedb-win32-x64-msvc'
      };

      // Specifically target Windows x64 MSVC build
      config.resolve.alias = {
        ...config.resolve.alias,
        '@lancedb/lancedb': '@lancedb/lancedb-win32-x64-msvc'
      };
    }

    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  }
};

module.exports = nextConfig;
