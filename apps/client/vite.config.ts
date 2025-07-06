import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { defineConfig, searchForWorkspaceRoot } from "vite";
import { ManifestOptions, VitePWA } from "vite-plugin-pwa";

// Vendor package groups
const vendorChunks = {
  "vendor-react": [
    "react",
    "react-dom",
    "react-aria",
    "react-aria-components",
    "react-stately",
    "scheduler",
  ],
  "vendor-tanstack": [
    "@tanstack/react-query",
    "@tanstack/react-router",
    "@tanstack/react-table",
    "@tanstack/router-devtools",
    "@tanstack/react-form",
  ],
  "vendor-ui": [
    "framer-motion",
    "@radix-ui/react-tooltip",
    "lucide-react",
    "recharts",
    "sonner",
  ],
  "vendor-utils": [
    "luxon",
    "uuid",
    "lodash.clonedeep",
    "class-variance-authority",
    "tailwind-merge",
  ],
  "vendor-state": [
    "zustand",
    "zustand/middleware",
    "zustand/middleware/persist",
  ],
};

const manifest: Partial<ManifestOptions> = {
  name: "Supaboard",
  short_name: "Supaboard",
  description: "Supaboard is a feedback board for your application.",
  theme_color: "#18181b",
  background_color: "#18181b",
  icons: [
    {
      src: "icons/icon-72x72.png",
      sizes: "72x72",
      type: "image/png",
    },
    {
      src: "icons/icon-96x96.png",
      sizes: "96x96",
      type: "image/png",
    },
    {
      src: "icons/icon-128x128.png",
      sizes: "128x128",
      type: "image/png",
    },
    {
      src: "icons/icon-144x144.png",
      sizes: "144x144",
      type: "image/png",
    },
    {
      src: "icons/icon-152x152.png",
      sizes: "152x152",
      type: "image/png",
    },
    {
      src: "icons/icon-192x192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "icons/icon-384x384.png",
      sizes: "384x384",
      type: "image/png",
    },
    {
      src: "icons/icon-512x512.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
};

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [
    tanstackRouter({
      autoCodeSplitting: true,
    }),
    react({
      jsxRuntime: "automatic",
      jsxImportSource: "react",
    }),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "script",
      includeAssets: ["favicon.svg", "robots.txt"],
      manifest,
    }),
  ],
  server: {
    allowedHosts: true,
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd())],
    },
    // allowedHosts: [ 'supaboard.io'],
  },
  preview: {
    port: 4173,
    host: true,
  },
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 700,
    minify: "esbuild",
    cssCodeSplit: true,
    sourcemap: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": [
            "react",
            "react-dom",
            "scheduler",
            "react-aria",
            "react-aria-components",
            "react-stately",
          ],
          "vendor-tanstack": [
            "@tanstack/react-query",
            "@tanstack/react-router",
            "@tanstack/react-table",
            "@tanstack/router-devtools",
            "@tanstack/react-form",
          ],
          "vendor-ui": [
            "framer-motion",
            "@radix-ui/react-tooltip",
            "lucide-react",
            "recharts",
            "sonner",
          ],
          "vendor-utils": [
            "luxon",
            "uuid",
            "lodash.clonedeep",
            "class-variance-authority",
            "tailwind-merge",
          ],
          "vendor-state": ["zustand"],
        },
      },
    },
    modulePreload: {
      polyfill: true,
    },
    commonjsOptions: {
      include: [/node_modules/],
      defaultIsModuleExports: true,
    },
  },
  resolve: {
    alias: [
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
      {
        find: "@/components",
        replacement: fileURLToPath(
          new URL("./src/components", import.meta.url)
        ),
      },
      {
        find: "@/lib",
        replacement: fileURLToPath(new URL("./src/lib", import.meta.url)),
      },
      {
        find: "@/routes",
        replacement: fileURLToPath(new URL("./src/routes", import.meta.url)),
      },
      {
        find: "@/utils",
        replacement: fileURLToPath(new URL("./src/utils", import.meta.url)),
      },
      {
        find: "@/stores",
        replacement: fileURLToPath(new URL("./src/stores", import.meta.url)),
      },
      {
        find: "@/hooks",
        replacement: fileURLToPath(new URL("./src/hooks", import.meta.url)),
      },
    ],
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
    __DEV__: mode === "development",
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "scheduler",
      "@tanstack/react-router",
      "@tanstack/react-query",
      "zustand",
    ],
    exclude: ["@tanstack/router-devtools"],
    esbuildOptions: {
      target: "es2020",
      jsx: "automatic",
      jsxImportSource: "react",
    },
  },
}));
