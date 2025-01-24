/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizeCss: true, // Enable CSS optimization
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

    // Add configuration for binary files
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
      // Alternatively, you can exclude the binary files
      // test: /\.node$/,
      // loader: "ignore-loader"
    })

    // Mark @lancedb/lancedb as external
    config.externals.push({
      '@lancedb/lancedb-win32-x64-msvc': 'commonjs @lancedb/lancedb-win32-x64-msvc'
    })

    return config
  }
}

module.exports = nextConfig