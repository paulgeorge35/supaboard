import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { defineConfig, searchForWorkspaceRoot } from 'vite'

// Vendor package groups
const vendorChunks = {
  'vendor-react': ['react', 'react-dom', 'react-aria', 'react-aria-components', 'react-stately', 'scheduler'],
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
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      babel: {
        plugins: [
          ['@babel/plugin-syntax-dynamic-import']
        ]
      }
    }),
    TanStackRouterVite({}),
    tailwindcss()
  ],
  server: {
    allowedHosts: true,
    fs: {
      allow: [
        searchForWorkspaceRoot(process.cwd()),
      ],
    },
    // allowedHosts: [ 'supaboard.io'],
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 700,
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: mode === 'development',
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': [
            'react',
            'react-dom',
            'react/jsx-runtime',
            'scheduler',
            'react-aria',
            'react-aria-components',
            'react-stately'
          ],
          'vendor-tanstack': [
            '@tanstack/react-query',
            '@tanstack/react-router',
            '@tanstack/react-table',
            '@tanstack/router-devtools',
            '@tanstack/react-form'
          ],
          'vendor-ui': [
            'framer-motion',
            '@radix-ui/react-tooltip',
            'lucide-react',
            'recharts',
            'sonner'
          ],
          'vendor-utils': [
            'luxon',
            'uuid',
            'lodash.clonedeep',
            'class-variance-authority',
            'tailwind-merge'
          ],
          'vendor-state': ['zustand']
        }
      }
    },
    modulePreload: {
      polyfill: true
    },
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
    ]
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    __DEV__: mode === 'development'
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'scheduler',
      '@tanstack/react-router',
      '@tanstack/react-query',
      'zustand'
    ],
    exclude: ['@tanstack/router-devtools'],
    esbuildOptions: {
      target: 'esnext',
      jsx: 'automatic',
      jsxImportSource: 'react'
    }
  }
}))
