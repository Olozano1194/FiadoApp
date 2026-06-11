import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://v2.tauri.app/start/frontend/vite/
const isTauriDev = process.env.TAURI_DEV === 'true'
const isTauriBuild = process.env.TAURI_BUILD === 'true'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  cacheDir: 'node_modules/.vite_cache',

  clearScreen: false,

  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
    hmr: isTauriDev
      ? {
          protocol: 'ws',
          host: '0.0.0.0',
          port: 5174,
        }
      : undefined,
  },

  envPrefix: ['VITE_', 'TAURI_'],

  build: {
    target: isTauriBuild ? 'es2021' : 'esnext',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
})
