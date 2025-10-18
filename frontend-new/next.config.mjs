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
  
  // Bundle optimization - Smart code splitting
  webpack: (config, { isServer }) => {
    if (!config.optimization?.splitChunks?.cacheGroups) {
      return config;
    }
    
    config.optimization.splitChunks.cacheGroups = {
      // Keep default groups
      ...config.optimization.splitChunks.cacheGroups,
      
      // Split Monaco Editor separately (very large - 500KB+)
      monaco: {
        test: /[\\/]node_modules[\\/](@monaco-editor|monaco-editor)[\\/]/,
        name: 'monaco-editor',
        priority: 40,
        reuseExistingChunk: true,
        enforce: true,
      },
      
      // Split Radix UI components
      radix: {
        test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
        name: 'radix-ui',
        priority: 30,
        reuseExistingChunk: true,
      },
      
      // Split React
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
        name: 'react-vendors',
        priority: 20,
        reuseExistingChunk: true,
      },
      
      // Split UI library dependencies
      ui: {
        test: /[\\/]node_modules[\\/](recharts|embla-carousel-react|react-resizable-panels|sonner)[\\/]/,
        name: 'ui-vendors',
        priority: 15,
        reuseExistingChunk: true,
      },
      
      // Default vendor split
      vendors: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: 10,
        reuseExistingChunk: true,
      },
    };
    
    return config;
  },
  
  // Enable experimental features
  experimental: {
    // Optimized package imports for tree-shaking
    optimizePackageImports: [
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-select',
      '@radix-ui/react-scroll-area',
      'lucide-react',
    ],
  },
}

export default nextConfig
