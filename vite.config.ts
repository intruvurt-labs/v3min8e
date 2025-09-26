// 4. UPDATED: vite.config.ts - Performance optimizations
// ============================================================================

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from "path";

export default defineConfig({
plugins: [react()],
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
    // ADDED: Performance optimizations
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-toast', '@radix-ui/react-dropdown-menu'],
          'vendor-crypto': ['@solana/web3.js', 'ethers'],
          'vendor-animation': ['framer-motion'],
          'vendor-3d': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-charts': ['recharts'],
          'vendor-query': ['@tanstack/react-query'],
        },
        // ADDED: Optimize chunk file names
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    },
    // ADDED: Build optimizations
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: mode === 'development',
    // Increase chunk size warning limit for crypto libraries
    chunkSizeWarningLimit: 1000,
  },
  plugins: [
    react({
      // ADDED: SWC optimizations
      plugins: [
        // Enable React Fast Refresh
        ["@swc/plugin-react-refresh", {}]
      ]
    }), 
    expressPlugin()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  // ADDED: Optimize dependencies
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      '@tanstack/react-query',
      'framer-motion'
    ],
    exclude: [
      'three',
      '@react-three/fiber', 
      '@react-three/drei',
      '@solana/web3.js',
      'ethers'
    ]
  },

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    async configureServer(server) {
      const { createServer } = await import("./server");
      const app = createServer();
      server.middlewares.use(app);
    },
  };
}
