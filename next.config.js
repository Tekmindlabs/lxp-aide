/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizeCss: true,
  },
  webpack: (config, { dev, isServer }) => {
    // Add CSS handling optimization
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        styles: {
          name: 'styles',
          test: /\.(css|scss)$/,
          chunks: 'all',
          enforce: true,
        },
      }
    }

    // Specifically handle LanceDB native bindings
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }

    // Enable WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }

    // Handle native modules
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    })

    // Specifically target Windows x64 MSVC build
    config.resolve.alias = {
      ...config.resolve.alias,
      '@lancedb/lancedb': '@lancedb/lancedb-win32-x64-msvc'
    }

    return config
  }
}

module.exports = nextConfig