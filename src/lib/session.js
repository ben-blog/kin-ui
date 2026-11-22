// HMAC session cookie. Web Crypto so this can run in middleware and route handlers.
// AUTH_SECRET stays server-only. Never prefix it with NEXT_PUBLIC_.

export const SESSION_COOKIE = 'kin_auth'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30

const MAX_TOKEN_LENGTH = 512
const CLOCK_SKEW_MS = 5 * 60 * 1000

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function bytesToBase64Url(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '')
}

function base64UrlToBytes(value) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  const binary = atob(normalized + pad)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function secretConfigured(secret) {
  return typeof secret === 'string' && secret.length > 0
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  }
}

export async function createSessionToken(secret) {
  if (!secretConfigured(secret)) {
    throw new Error('AUTH_SECRET is not configured')
  }

  const now = Date.now()
  const nonce = new Uint8Array(16)
  crypto.getRandomValues(nonce)
  const payload = {
    v: 1,
    iat: now,
    exp: now + SESSION_MAX_AGE * 1000,
    n: bytesToBase64Url(nonce),
  }
  const body = bytesToBase64Url(textEncoder.encode(JSON.stringify(payload)))
  const key = await importHmacKey(secret)
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, textEncoder.encode(body)))
  return `${body}.${bytesToBase64Url(signature)}`
}

export async function verifySessionToken(token, secret) {
  try {
    if (!secretConfigured(secret)) return false
    if (typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
      return false
    }

    const dot = token.indexOf('.')
    if (dot <= 0 || dot !== token.lastIndexOf('.')) return false
    const body = token.slice(0, dot)
    const signature = token.slice(dot + 1)
    if (!body || !signature) return false

    const key = await importHmacKey(secret)
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlToBytes(signature),
      textEncoder.encode(body)
    )
    if (!valid) return false

    const payload = JSON.parse(textDecoder.decode(base64UrlToBytes(body)))
    if (!payload || payload.v !== 1) return false
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) return false
    if (payload.exp <= Date.now()) return false
    if (typeof payload.iat !== 'number' || payload.iat > Date.now() + CLOCK_SKEW_MS) return false
    return true
  } catch {
    return false
  }
}
