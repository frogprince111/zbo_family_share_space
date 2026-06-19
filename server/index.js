import { createReadStream, existsSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rootDir = resolve(__dirname, '..')
const distDir = resolve(rootDir, 'dist')
const port = Number(process.env.PORT || 3000)
const visitorTtlMs = 45_000
const themeColors = new Set(['pink', 'purple', 'blue', 'yellow', 'green', 'orange'])

const visitors = new Map()
const clients = new Set()
const chatClients = new Set()
const activityClients = new Set()
const chatMessages = [
  {
    id: 'welcome',
    memberId: 'system',
    type: 'text',
    text: '家庭群聊已开启，今天也要好好说话。',
    createdAt: '2026-06-18T09:00:00.000Z',
  },
]
const activities = []

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
      if (raw.length > 2_000_000) req.destroy()
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

function cleanId(value) {
  const text = typeof value === 'string' ? value.trim() : ''
  return text.slice(0, 80)
}

function cleanLongText(value, fallback, maxLength = 300) {
  const text = typeof value === 'string' ? value.trim() : ''
  return text.slice(0, maxLength) || fallback
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
      themeColor: visitor.themeColor,
      avatar: visitor.avatar,
      role: visitor.role,
      birthday: visitor.birthday,
      lastSeenAt: new Date(visitor.lastSeenAt).toISOString(),
    }))
}

function cleanThemeColor(value, fallback) {
  return themeColors.has(value) ? value : fallback || 'purple'
}

function broadcast() {
  const payload = `data: ${JSON.stringify({ visitors: serializeVisitors() })}\n\n`
  for (const client of clients) {
    client.write(payload)
  }
}

function broadcastChat() {
  const payload = `data: ${JSON.stringify({ messages: chatMessages })}\n\n`
  for (const client of chatClients) {
    client.write(payload)
  }
}

function broadcastActivities(event = 'sync', activity = null) {
  const payload = `data: ${JSON.stringify({ event, activity, activities })}\n\n`
  for (const client of activityClients) {
    client.write(payload)
  }
}

function upsertVisitor(body, req) {
  const id = cleanId(body.id)
  if (!id) return null

  const current = visitors.get(id)
  const userAgent = req.headers['user-agent'] || ''
  const fallbackDevice = /Mobile|Android|iPhone|iPad/i.test(userAgent) ? '手机端' : '网页端'

  const visitor = {
    id,
    name: cleanText(body.name, current?.name || '家人'),
    device: cleanText(body.device, current?.device || fallbackDevice),
    themeColor: cleanThemeColor(body.themeColor, current?.themeColor),
    avatar: cleanLongText(body.avatar, current?.avatar || '', 1_500_000),
    role: cleanText(body.role, current?.role || '家庭成员'),
    birthday: cleanText(body.birthday, current?.birthday || ''),
    lastSeenAt: Date.now(),
  }
  visitors.set(id, visitor)
  broadcast()
  return visitor
}

function removeVisitor(body) {
  const id = cleanId(body.id)
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

  if (req.url === '/api/chat' && req.method === 'GET') {
    sendJson(res, 200, { messages: chatMessages })
    return true
  }

  if (req.url === '/api/chat/send' && req.method === 'POST') {
    readBody(req).then((body) => {
      const memberId = cleanId(body.memberId)
      const type = ['text', 'image', 'audio'].includes(body.type) ? body.type : 'text'
      const text = cleanLongText(body.text, '', 500)
      const src = cleanLongText(body.src, '', 1_500_000)

      if (!memberId || (type === 'text' && !text) || (type !== 'text' && !src)) {
        sendJson(res, 400, { message: '消息内容不能为空' })
        return
      }

      const message = {
        id: cleanId(body.id) || randomUUID(),
        memberId,
        type,
        text,
        src,
        createdAt: new Date().toISOString(),
      }
      chatMessages.push(message)
      if (chatMessages.length > 200) chatMessages.splice(0, chatMessages.length - 200)
      broadcastChat()
      sendJson(res, 200, { message })
    })
    return true
  }

  if (req.url === '/api/chat/stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    chatClients.add(res)
    res.write(`data: ${JSON.stringify({ messages: chatMessages })}\n\n`)
    req.on('close', () => chatClients.delete(res))
    return true
  }

  if (req.url === '/api/activities' && req.method === 'GET') {
    sendJson(res, 200, { activities })
    return true
  }

  if (req.url === '/api/activities/create' && req.method === 'POST') {
    readBody(req).then((body) => {
      const creatorId = cleanId(body.creatorId)
      const creatorName = cleanText(body.creatorName, '家人')
      const title = cleanLongText(body.title, '', 40)
      if (!creatorId || !title) {
        sendJson(res, 400, { message: '活动名称不能为空' })
        return
      }

      const creator = { id: creatorId, name: creatorName }
      const activity = {
        id: randomUUID(),
        title,
        time: cleanLongText(body.time, '待定', 40),
        location: cleanLongText(body.location, '待定', 40),
        note: cleanLongText(body.note, '', 140),
        creatorId,
        creatorName,
        participants: [creator],
        createdAt: new Date().toISOString(),
      }
      activities.unshift(activity)
      if (activities.length > 50) activities.splice(50)
      broadcastActivities('created', activity)
      sendJson(res, 200, { activity })
    })
    return true
  }

  if (req.url === '/api/activities/join' && req.method === 'POST') {
    readBody(req).then((body) => {
      const id = cleanId(body.id)
      const participantId = cleanId(body.participantId)
      const participantName = cleanText(body.participantName, '家人')
      const activity = activities.find((item) => item.id === id)
      if (!activity || !participantId) {
        sendJson(res, 404, { message: '活动不存在' })
        return
      }

      if (!activity.participants.some((participant) => participant.id === participantId)) {
        activity.participants.push({ id: participantId, name: participantName })
        broadcastActivities('joined', activity)
      }
      sendJson(res, 200, { activity })
    })
    return true
  }

  if (req.url === '/api/activities/stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    activityClients.add(res)
    res.write(`data: ${JSON.stringify({ event: 'sync', activity: null, activities })}\n\n`)
    req.on('close', () => activityClients.delete(res))
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
