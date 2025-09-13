import { defineConfig, loadEnv, Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

function expressPlugin(): Plugin {
  return {
    name: 'express-plugin',
    apply: 'serve',
    async configureServer(server) {
      const { createServer } = await import('./server')
      const app = createServer()
      server.middlewares.use('/api', app)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    // 👇 tell Vite where your index.html is
    root: path.resolve(__dirname, './client'),
    publicDir: path.resolve(__dirname, './public'),

    server: {
      host: '::',
      port: 8080,
      fs: {
        allow: ['./client', './shared'],
        deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', 'server/**'],
      },
    },

    build: {
      outDir: path.resolve(__dirname, './dist/spa'),
      emptyOutDir: true,
    },

    plugins: [react(), expressPlugin()],

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
