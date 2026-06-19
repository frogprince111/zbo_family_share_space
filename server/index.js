import { createReadStream, existsSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rootDir = resolve(__dirname, '..')
const distDir = resolve(rootDir, 'dist')
const port = Number(process.env.PORT || 3000)
const visitorTtlMs = 45_000

const visitors = new Map()
const clients = new Set()

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(JSON.stringify(data))
}

function readBody(req) {
  return new Promise((resolveBody) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 64_000) req.destroy()
    })
    req.on('end', () => {
      try {
        resolveBody(raw ? JSON.parse(raw) : {})
      } catch {
        resolveBody({})
      }
    })
    req.on('error', () => resolveBody({}))
  })
}

function cleanText(value, fallback) {
  const text = typeof value === 'string' ? value.trim() : ''
  return text.slice(0, 24) || fallback
}

function serializeVisitors() {
  const now = Date.now()
  return [...visitors.values()]
    .filter((visitor) => now - visitor.lastSeenAt < visitorTtlMs)
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
    .map((visitor) => ({
      id: visitor.id,
      name: visitor.name,
      device: visitor.device,
      lastSeenAt: new Date(visitor.lastSeenAt).toISOString(),
    }))
}

function broadcast() {
  const payload = `data: ${JSON.stringify({ visitors: serializeVisitors() })}\n\n`
  for (const client of clients) {
    client.write(payload)
  }
}

function upsertVisitor(body, req) {
  const id = cleanText(body.id, '')
  if (!id) return null

  const current = visitors.get(id)
  const userAgent = req.headers['user-agent'] || ''
  const fallbackDevice = /Mobile|Android|iPhone|iPad/i.test(userAgent) ? '手机端' : '网页端'

  const visitor = {
    id,
    name: cleanText(body.name, current?.name || '家人'),
    device: cleanText(body.device, current?.device || fallbackDevice),
    lastSeenAt: Date.now(),
  }
  visitors.set(id, visitor)
  broadcast()
  return visitor
}

function removeVisitor(body) {
  const id = cleanText(body.id, '')
  if (!id) return false
  const removed = visitors.delete(id)
  if (removed) broadcast()
  return removed
}

function handleApi(req, res) {
  if (req.url === '/api/online' && req.method === 'GET') {
    sendJson(res, 200, { visitors: serializeVisitors() })
    return true
  }

  if (req.url === '/api/online/heartbeat' && req.method === 'POST') {
    readBody(req).then((body) => {
      const visitor = upsertVisitor(body, req)
      sendJson(res, visitor ? 200 : 400, visitor ? { visitor } : { message: '缺少在线身份' })
    })
    return true
  }

  if (req.url === '/api/online/offline' && req.method === 'POST') {
    readBody(req).then((body) => {
      removeVisitor(body)
      sendJson(res, 200, { ok: true })
    })
    return true
  }

  if (req.url === '/api/online/stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    clients.add(res)
    res.write(`data: ${JSON.stringify({ visitors: serializeVisitors() })}\n\n`)
    req.on('close', () => clients.delete(res))
    return true
  }

  return false
}

async function serveStatic(req, res) {
  const indexPath = join(distDir, 'index.html')

  if (!existsSync(indexPath)) {
    sendJson(res, 500, { message: '请先执行 npm run build 生成 dist 目录' })
    return
  }

  const requestPath = decodeURIComponent((req.url || '/').split('?')[0])
  const normalizedPath = normalize(requestPath).replace(/^(\.\.[/\\])+/, '')
  const filePath = resolve(distDir, `.${normalizedPath === '/' ? '/index.html' : normalizedPath}`)

  if (!filePath.startsWith(distDir)) {
    sendJson(res, 403, { message: '禁止访问' })
    return
  }

  const isExistingFile = existsSync(filePath) && statSync(filePath).isFile()
  const targetPath = isExistingFile ? filePath : indexPath
  const extension = extname(targetPath)

  try {
    const stream = createReadStream(targetPath)
    res.writeHead(200, {
      'Content-Type': mimeTypes[extension] || 'application/octet-stream',
      'Cache-Control': targetPath === indexPath ? 'no-cache' : 'public, max-age=31536000, immutable',
    })
    stream.pipe(res)
  } catch {
    const fallback = await readFile(indexPath, 'utf8')
    res.writeHead(200, { 'Content-Type': mimeTypes['.html'] })
    res.end(fallback)
  }
}

const server = createServer((req, res) => {
  if (handleApi(req, res)) return
  serveStatic(req, res)
})

setInterval(() => {
  const now = Date.now()
  let changed = false
  for (const [id, visitor] of visitors.entries()) {
    if (now - visitor.lastSeenAt >= visitorTtlMs) {
      visitors.delete(id)
      changed = true
    }
  }
  if (changed) broadcast()
}, 10_000)

server.listen(port, () => {
  console.log(`家庭共享空间已启动：http://localhost:${port}`)
})
