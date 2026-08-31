import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// In-memory store for debug positions data
let positionsCache: Record<string, unknown> = {}
// 布局导出收集器（临时调试用，用完移除）
let exportCache: Record<string, string> = {}

function exportLayoutsMiddleware() {
  return {
    name: 'export-layouts-middleware',
    configureServer(server: any) {
      server.middlewares.use('/__export-layouts', (req: any, res: any) => {
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
              exportCache = JSON.parse(body)
              res.statusCode = 200
              res.end(JSON.stringify({ ok: true, count: Object.keys(exportCache).length }))
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid JSON' }))
            }
          })
          return
        }

        // ?json=1 —— 返回收集到的导出数据（供脚本读取）
        if (req.url && req.url.includes('json=1')) {
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 200
          res.end(JSON.stringify(exportCache, null, 2))
          return
        }

        // 普通 GET —— 返回一个会自动导出本浏览器 localStorage 布局的页面
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        const html = `<!doctype html><meta charset="utf-8"><title>导出布局</title>
<body><h3>正在导出本浏览器保存的布局…</h3><script>
(function(){
  var out = {};
  for (var k of Object.keys(localStorage)) if (k.indexOf('gg-block-positions-') === 0) out[k] = localStorage.getItem(k);
  fetch('/__export-layouts', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(out)})
    .then(function(r){ return r.json() })
    .then(function(d){ document.body.innerHTML = '<h3 style="color:green">导出成功：' + (d.count||0) + ' 个页面布局</h3>'; })
    .catch(function(e){ document.body.innerHTML = '<h3 style="color:red">导出失败：' + e + '</h3>'; });
})();
</script></body>`
        res.end(html)
      })
    },
  }
}

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
  plugins: [react(), tailwindcss(), debugMiddleware(), exportLayoutsMiddleware()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
