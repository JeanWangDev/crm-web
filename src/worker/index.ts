/**
 * Cloudflare Worker 入口：静态页由 assets（SPA）托管。
 * /api 转到 Java 后端。生产把 wrangler.json 里的 CRM_API_ORIGIN 改成服务器地址。
 */
import { Hono } from 'hono'

type Bindings = {
  CRM_API_ORIGIN?: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.all('/api/*', async (c) => {
  const origin = (c.env.CRM_API_ORIGIN || 'http://127.0.0.1:8080').replace(/\/$/, '')
  const incoming = new URL(c.req.url)
  const target = new URL(incoming.pathname + incoming.search, origin)
  const headers = new Headers(c.req.raw.headers)
  headers.delete('host')
  const res = await fetch(target, {
    method: c.req.method,
    headers,
    body: c.req.method === 'GET' || c.req.method === 'HEAD' ? undefined : c.req.raw.body,
  })
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: res.headers })
})

export default app
