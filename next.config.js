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
      loader: "node-loader",
    });

    if (!isServer) {
      config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false
      };
    }

    // Properly resolve LanceDB native modules for Windows
    config.resolve.alias = {
      ...config.resolve.alias,
      '@lancedb/lancedb': '@lancedb/lancedb',
      '@lancedb/lancedb-win32-x64-msvc': '@lancedb/lancedb-win32-x64-msvc',
      // Disable all other platform builds
      '@lancedb/lancedb-linux-s390x-gnu': false,
      '@lancedb/lancedb-darwin-x64': false,
      '@lancedb/lancedb-darwin-arm64': false,
      '@lancedb/lancedb-linux-x64-gnu': false,
      '@lancedb/lancedb-linux-arm64-gnu': false,
      '@lancedb/lancedb-android-arm64': false,
      '@lancedb/lancedb-android-arm-eabi': false,
      '@lancedb/lancedb-linux-arm-gnueabihf': false,
      '@lancedb/lancedb-linux-arm-musleabihf': false,
      '@lancedb/lancedb-linux-x64-musl': false,
      '@lancedb/lancedb-linux-arm64-musl': false,
      '@lancedb/lancedb-linux-riscv64-gnu': false,
      '@lancedb/lancedb-linux-riscv64-musl': false,
      '@lancedb/lancedb-darwin-universal': false,
      '@lancedb/lancedb-freebsd-x64': false,
      '@lancedb/lancedb-win32-ia32-msvc': false,
      '@lancedb/lancedb-win32-arm64-msvc': false
    };

    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  }
};

module.exports = nextConfig;