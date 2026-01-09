import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "swiper/css";`
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
      }
    }
  },
  optimizeDeps: {
    include: [
      '@fullcalendar/core',
      '@fullcalendar/react',
      '@fullcalendar/daygrid',
      '@fullcalendar/timegrid',
      '@fullcalendar/list',
      '@fullcalendar/interaction'
    ]
  },
  // server: {
  //   headers: {
  //     'X-Frame-Options': 'DENY',
  //     'X-Content-Type-Options': 'nosniff',
  //     'Referrer-Policy': 'strict-origin-when-cross-origin',
  //   },
  //   proxy: {
  //     "/api": {
  //       target: process.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000',
  //       changeOrigin: true,
  //       secure: false
  //     },
  //     "/auth": {
  //       target: process.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000',
  //       changeOrigin: true,
  //       secure: false
  //     }
  //   },
  // },
  esbuild: {
    jsx: 'automatic',
  },
});