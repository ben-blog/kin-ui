// Server-side proxy to kin-agent. The browser only talks to this origin.
// ADMIN_API_KEY is attached here and must never be exposed as NEXT_PUBLIC_.

import { NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from './session'

const DEFAULT_KIN_API = 'https://kin-agent-production.up.railway.app'
const ALLOWED_PREFIXES = new Set(['/api/kin', '/api/web-learning'])

const STRIP_RESPONSE_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'content-encoding',
  'content-length',
  'set-cookie',
  'authorization',
  'x-admin-key',
])

export function resolveKinOrigin() {
  const raw = (process.env.KIN_API || DEFAULT_KIN_API).trim()
  let url
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.username || url.password) return null
  if (url.protocol === 'https:') return url.origin
  if (url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
    return url.origin
  }
  return null
}

function encodeSegments(path) {
  if (!Array.isArray(path) || path.length === 0) return null
  const parts = []
  for (const segment of path) {
    if (typeof segment !== 'string' || segment.length === 0) return null
    if (segment === '.' || segment === '..') return null
    if (segment.includes('/') || segment.includes('\\') || segment.includes('\0')) return null
    parts.push(encodeURIComponent(segment))
  }
  return parts.join('/')
}

function unauthorized() {
  return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
}

function unavailable() {
  return NextResponse.json({ ok: false, error: 'unavailable' }, { status: 503 })
}

async function requireSession(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const valid = await verifySessionToken(token, process.env.AUTH_SECRET)
  if (!valid) return unauthorized()
  return null
}

export async function handleKinProxy(request, context, prefix) {
  if (!ALLOWED_PREFIXES.has(prefix)) return unavailable()

  const denied = await requireSession(request)
  if (denied) return denied

  const adminKey = process.env.ADMIN_API_KEY
  if (typeof adminKey !== 'string' || adminKey.length === 0) return unavailable()

  const origin = resolveKinOrigin()
  if (!origin) return unavailable()

  const { path } = await context.params
  const encoded = encodeSegments(path)
  if (!encoded) {
    return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 })
  }

  const incoming = new URL(request.url)
  const target = new URL(`${prefix}/${encoded}`, origin)
  target.search = incoming.search

  const headers = new Headers()
  const contentType = request.headers.get('content-type')
  if (contentType) headers.set('content-type', contentType)
  const accept = request.headers.get('accept')
  if (accept) headers.set('accept', accept)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) headers.set('x-forwarded-for', forwardedFor)
  headers.set('x-admin-key', adminKey)

  const method = request.method.toUpperCase()
  const hasBody = method !== 'GET' && method !== 'HEAD'
  const init = {
    method,
    headers,
    cache: 'no-store',
    redirect: 'manual',
  }
  if (hasBody) {
    init.body = Buffer.from(await request.arrayBuffer())
  }

  let upstream
  try {
    upstream = await fetch(target, init)
  } catch {
    console.error('[kin-proxy] upstream request failed')
    return NextResponse.json({ ok: false, error: 'bad gateway' }, { status: 502 })
  }

  const outHeaders = new Headers()
  upstream.headers.forEach((value, key) => {
    if (STRIP_RESPONSE_HEADERS.has(key.toLowerCase())) return
    outHeaders.append(key, value)
  })

  const upstreamType = upstream.headers.get('content-type') || ''
  if (upstreamType.includes('text/event-stream')) {
    outHeaders.set('content-type', upstreamType)
    outHeaders.set('cache-control', 'no-cache, no-transform')
    outHeaders.set('x-accel-buffering', 'no')
  }

  const responseBody =
    method === 'HEAD' || upstream.status === 204 || upstream.status === 304 ? null : upstream.body

  return new Response(responseBody, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders,
  })
}
