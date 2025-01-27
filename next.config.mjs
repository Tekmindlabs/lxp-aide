/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizeCss: true,
  },
  compiler: {
    removeConsole: false,
  },
  webpack: (config, { isServer }) => {
    // Handle native modules
    config.module.rules.push({
      test: /\.node$/,
      use: [
        {
          loader: "node-loader",
        },
      ],
    });

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // Only include the Windows x64 MSVC build for LanceDB
    config.resolve.alias = {
      ...config.resolve.alias,
      '@lancedb/lancedb': '@lancedb/lancedb',
      '@lancedb/lancedb-win32-x64-msvc': '@lancedb/lancedb-win32-x64-msvc',
    };

    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  },
};

export default nextConfig;