// vite.config.ts
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Dev-only: mount your Express server into Vite's middleware
function expressPlugin(): Plugin {
  return {
    name: 'express-plugin',
    apply: 'serve',
    async configureServer(server) {
      const { createServer } = await import('./server');
      const app = await createServer?.();
      server.middlewares.use(app);
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      // SWC fast refresh already enabled by plugin; extra plugin optional
    }),
    expressPlugin(),
  ],

  server: {
    host: '::',
    port: 8080,
    fs: {
      allow: ['client', 'shared'],
      deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', 'server/**'],
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'framer-motion',
    ],
    exclude: [
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      '@solana/web3.js',
      'ethers',
    ],
  },

  build: {
    outDir: 'dist/spa',
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: mode === 'development',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-toast', '@radix-ui/react-dropdown-menu'],
          'vendor-crypto': ['@solana/web3.js', 'ethers'],
          'vendor-animation': ['framer-motion'],
          'vendor-3d': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-charts': ['recharts'],
          'vendor-query': ['@tanstack/react-query'],
        },
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
      },
    },
  },
}));
