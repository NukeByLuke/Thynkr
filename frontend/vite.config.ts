import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true, // Allow external access
    allowedHosts: ['.trycloudflare.com', '.loca.lt'], // Allow tunnel domains
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
          'viz-vendor': ['recharts'],
          'anim-vendor': ['framer-motion', 'lottie-react', 'canvas-confetti'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-utils': ['clsx', 'date-fns', 'react-hot-toast'],
          'markdown': ['react-markdown', 'remark-gfm', 'rehype-highlight', 'rehype-raw'],
          'icons': ['lucide-react']
        },
      },
    },
    // Optimize chunk sizes
    chunkSizeWarningLimit: 600,
    // Emit sourcemaps for debugging
    sourcemap: false,
  },
  // Enable esbuild optimizations
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    // Drop console in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      '@tanstack/react-query',
      'framer-motion',
      'lucide-react',
      'zod',
      'react-hot-toast',
    ],
    // Exclude large deps that don't need pre-bundling
    exclude: [],
  },
});
