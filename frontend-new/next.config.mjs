/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  compress: true,
  productionBrowserSourceMaps: false,
  
  // Linting & Type checking
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Image optimization
  images: {
    unoptimized: true,
  },
  
  // Bundle optimization
  webpack: (config, { isServer }) => {
    if (!config.optimization?.splitChunks?.cacheGroups) {
      return config;
    }
    
    config.optimization.splitChunks.cacheGroups = {
      ...config.optimization.splitChunks.cacheGroups,
      // Split vendor libraries
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: 10,
      },
      // Split Radix UI
      radix: {
        test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
        name: 'radix-ui',
        priority: 20,
      },
      // Split Monaco Editor separately (large)
      monaco: {
        test: /[\\/]node_modules[\\/]@monaco-editor[\\/]/,
        name: 'monaco-editor',
        priority: 30,
      },
    };
    return config;
  },
  
  // Enable experimental features
  experimental: {
    // Optimized package imports
    optimizePackageImports: [
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      'lucide-react',
    ],
  },
}

export default nextConfig
