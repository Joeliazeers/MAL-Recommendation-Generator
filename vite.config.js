import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy MAL OAuth token endpoint to bypass CORS
      '/api/mal/oauth2': {
        target: 'https://myanimelist.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mal\/oauth2/, '/v1/oauth2'),
        secure: true,
      },
      // Proxy MAL API requests to bypass CORS
      '/api/mal/v2': {
        target: 'https://api.myanimelist.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mal\/v2/, '/v2'),
        secure: true,
      },
    },
  },
})
