import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    hmr: false,
    // Makes dev same-origin, matching how lunonote.com/api will be served in
    // production. No rewrite: the backend already mounts its routes at /api.
    proxy: { '/api': { target: 'http://localhost:8000', changeOrigin: true } },
  },
  resolve: { alias: { src: "/src" } },
})
