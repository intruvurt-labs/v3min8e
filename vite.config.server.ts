// 3. UPDATED: vite.config.server.ts - Fixed Node version and optimization
// ============================================================================

import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "server/node-build.ts"),
      name: "server",
      fileName: "production",
      formats: ["es"],
    },
    outDir: "dist/server",
    target: "node18", // FIXED: Changed from node22 to node18 for Netlify
    ssr: true,
    rollupOptions: {
      external: [
        // Node.js built-ins
        "fs", "path", "url", "http", "https", "os", "crypto", "stream", 
        "util", "events", "buffer", "querystring", "child_process",
        // External dependencies
        "express", "cors", "helmet", "zod", "jsonwebtoken",
        // NEW: Add Netlify-specific externals
        "@netlify/functions"
      ],
      output: {
        format: "es",
        entryFileNames: "[name].mjs",
        // ADDED: Manual chunks for better organization
        manualChunks: {
          'server-core': ['express', 'cors', 'helmet'],
          'crypto': ['jsonwebtoken', 'crypto'],
          'validation': ['zod', 'express-validator']
        }
      },
    },
    minify: process.env.NODE_ENV === 'production', // ADDED: Conditional minification
    sourcemap: true,
    // ADDED: Tree shaking optimization
    treeshake: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
