import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

// Vendor package groups
const vendorChunks = {
  'vendor-react': ['react', 'react-dom', 'react-aria', 'react-aria-components', 'react-stately'],
  'vendor-tanstack': [
    '@tanstack/react-query',
    '@tanstack/react-router',
    '@tanstack/react-table',
    '@tanstack/router-devtools',
    '@tanstack/react-form'
  ],
  'vendor-ui': ['framer-motion', '@radix-ui/react-tooltip', 'lucide-react', 'recharts', 'sonner'],
  'vendor-utils': ['luxon', 'uuid', 'lodash.clonedeep', 'class-variance-authority', 'tailwind-merge'],
  'vendor-state': ['zustand', 'zustand/middleware', 'zustand/middleware/persist']
}

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [
    TanStackRouterVite({}),
    react({
      babel: {
        plugins: [
          ['@babel/plugin-syntax-dynamic-import']
        ]
      },
      jsxRuntime: 'automatic',
      jsxImportSource: 'react'
    }),
    tailwindcss()
  ],
  server: {
    allowedHosts: true,
    // allowedHosts: [ 'supaboard.io'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Bundle all React related code together to avoid initialization issues
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/scheduler') ||
              id.includes('node_modules/react-aria') || 
              id.includes('node_modules/react-stately')) {
            return 'vendor-react'
          }

          // TanStack packages
          if (id.includes('node_modules/@tanstack')) {
            if (id.includes('react-router')) {
              return 'vendor-router'
            }
            if (id.includes('react-query')) {
              return 'vendor-query'
            }
            return 'vendor-tanstack'
          }

          // UI packages
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion')) {
              return 'vendor-framer'
            }
            if (id.includes('recharts') || id.includes('d3') || id.includes('victory')) {
              return 'vendor-charts'
            }
            if (id.includes('lucide-react') || id.includes('@radix-ui') || id.includes('sonner')) {
              return 'vendor-ui'
            }
            if (id.includes('zustand')) {
              return 'vendor-state'
            }
            // Other node_modules
            return 'vendor'
          }

          // Application code
          if (id.includes('src/routes')) {
            if (id.includes('/_public/')) {
              return 'route-public'
            }
            if (id.includes('/admin/')) {
              const section = id.split('/admin/')[1]?.split('/')[0]
              return section ? `route-admin-${section}` : 'route-admin'
            }
            return 'routes'
          }

          // Shared code
          if (id.includes('src/components/')) {
            const isAdmin = id.includes('/admin/')
            const isPublic = id.includes('/public/')
            return isAdmin ? 'components-admin' : isPublic ? 'components-public' : 'components'
          }

          // Group remaining app code
          if (id.includes('src/lib/')) return 'lib'
          if (id.includes('src/utils/')) return 'utils'
          if (id.includes('src/stores/')) return 'stores'
        }
      }
    },
    chunkSizeWarningLimit: 500,
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: mode === 'development',
    reportCompressedSize: false,
    // Ensure proper production optimizations
    modulePreload: {
      polyfill: true
    },
    // Add proper React production optimizations
    commonjsOptions: {
      include: [/node_modules/],
      defaultIsModuleExports: true
    }
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
      {
        find: '@/components',
        replacement: fileURLToPath(new URL('./src/components', import.meta.url)),
      },
      {
        find: '@/lib',
        replacement: fileURLToPath(new URL('./src/lib', import.meta.url)),
      },
      {
        find: '@/routes',
        replacement: fileURLToPath(new URL('./src/routes', import.meta.url)),
      },
      {
        find: '@/utils',
        replacement: fileURLToPath(new URL('./src/utils', import.meta.url)),
      },
      {
        find: '@/stores',
        replacement: fileURLToPath(new URL('./src/stores', import.meta.url)),
      },
      {
        find: '@/hooks',
        replacement: fileURLToPath(new URL('./src/hooks', import.meta.url)),
      },
    ],
  },
  // Add proper define options for production
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    __DEV__: mode === 'development'
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'scheduler',
      'zustand'
    ]
  },
  // Enable proper HMR
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
}))
