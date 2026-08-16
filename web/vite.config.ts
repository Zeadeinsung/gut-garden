import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// In-memory store for debug positions data
let positionsCache: Record<string, unknown> = {}

function debugMiddleware() {
  return {
    name: 'debug-middleware',
    configureServer(server: any) {
      server.middlewares.use('/__debug/positions', (req: any, res: any) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk: string) => { body += chunk })
          req.on('end', () => {
            try {
              positionsCache = JSON.parse(body)
              console.log('[debug] Positions updated:', JSON.stringify(positionsCache, null, 2))
              res.statusCode = 200
              res.end(JSON.stringify({ ok: true }))
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid JSON' }))
            }
          })
          return
        }

        // GET — return cached positions
        res.setHeader('Content-Type', 'application/json')
        res.statusCode = 200
        res.end(JSON.stringify(positionsCache, null, 2))
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), debugMiddleware()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
