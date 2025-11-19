import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
  // Load Vite-style env files (e.g. .env.local, .env.development)
  const env = loadEnv(mode, process.cwd(), '')

  return defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      // Preserve runtime environment variables with fallback to NODE_ENV
      'import.meta.env.VITE_HF_API_KEY': JSON.stringify(env.VITE_HF_API_KEY ?? ''),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL ?? 'http://localhost:8000'),
    },
    server: {
      port: 3000,
    },
  })
}
