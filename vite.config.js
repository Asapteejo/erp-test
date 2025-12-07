// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path'; // ← ADD THIS LINE

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Teebot Acadion',
        short_name: 'Teebot Acadion',
        theme_color: '#1e3a8a',
        background_color: '#f3f4f6',
        display: 'standalone',
        icons: [
          { src: '/images/logo-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/images/logo-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // ← ADD THIS BLOCK
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('Proxying:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Proxy response:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
    watch: {
      usePolling: false,
      interval: 2000,
    },
    hmr: false,
  },
  define: {
    'import.meta.env.VITE_RECAPTCHA_SITE_KEY': JSON.stringify(process.env.VITE_RECAPTCHA_SITE_KEY || ''),
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3000'),
  },
});