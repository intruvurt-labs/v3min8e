// vite.config.ts (or vite.config.js)
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    // where your index.html lives:
    root: path.resolve(__dirname, './client'),
    publicDir: path.resolve(__dirname, './public'),

    server: {
      host: '::',
      port: 8080,
      // Proxy API/webhook calls to your running Node server (server.js)
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        '/webhook': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
      fs: {
        allow: [
          path.resolve(__dirname, './client'),
          path.resolve(__dirname, './shared'),
        ],
        // keep secrets out of Vite static serving:
        deny: ['.env', '.env.*', '**/.git/**', 'server/**', '*.{crt,pem}'],
      },
    },

    build: {
      outDir: path.resolve(__dirname, './dist/spa'),
      emptyOutDir: true,
    },

    plugins: [react()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './client'),
        '@shared': path.resolve(__dirname, './shared'),
      },
    },

    define: {
      'process.env.SUPABASE_URL': JSON.stringify(
        env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? ''
      ),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(
        env.SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? ''
      ),
    },
  }
})
