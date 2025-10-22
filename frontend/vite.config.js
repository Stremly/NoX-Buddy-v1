import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: 'globalThis',
  },
  base: './', // 👈 ensures relative asset paths inside Electron
  build: {
    outDir: 'dist',
  },
  optimizeDeps: {
    include: ['siriwave']
  }
})
