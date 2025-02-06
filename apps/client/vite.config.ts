import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [TanStackRouterVite({}), react(), tailwindcss()],
  server: {
    allowedHosts: true,
    // allowedHosts: [ 'supaboard.io'],
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
    ],
  },
})
