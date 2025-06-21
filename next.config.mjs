/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'mongodb', 
      'bcryptjs', 
      'jsonwebtoken',
      '@mongodb-js/zstd',
      'snappy',
      'kerberos',
      'mongodb-client-encryption',
      'bson-ext',
      'utf-8-validate',
      'bufferutil'
    ],
    esmExternals: 'loose',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
    domains: ['images.unsplash.com'],
  },
  env: {
    // Ensure environment variables are available at build time
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
  },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // Completely exclude server-only modules from client bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        'mongodb': false,
        'bcryptjs': false,
        'jsonwebtoken': false,
        '@mongodb-js/zstd': false,
        'snappy': false,
        'kerberos': false,
        'mongodb-client-encryption': false,
        'bson-ext': false,
        'utf-8-validate': false,
        'bufferutil': false,
        'supports-color': false,
        'aws4': false,
      }

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        dns: false,
        child_process: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      }

      // Add ignore plugin for problematic modules
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(mongodb|bcryptjs|jsonwebtoken|@mongodb-js\/zstd|snappy|kerberos|mongodb-client-encryption|bson-ext|utf-8-validate|bufferutil)$/,
        })
      )
    }

    return config
  },
}

export default nextConfig
