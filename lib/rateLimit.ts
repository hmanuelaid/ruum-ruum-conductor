import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

type RateLimitConfig = {
  prefix: string
  limit: number
  window: `${number} ${'s' | 'm' | 'h' | 'd'}`
}

type MemoryEntry = {
  count: number
  resetAt: number
}

const memoryStore = new Map<string, MemoryEntry>()
const limiters = new Map<string, Ratelimit>()

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return (
    forwardedFor
    || request.headers.get('x-real-ip')
    || request.headers.get('cf-connecting-ip')
    || 'unknown'
  )
}

function parseWindowMs(window: RateLimitConfig['window']) {
  const [amountText, unit] = window.split(' ')
  const amount = Number(amountText)

  if (unit === 's') return amount * 1000
  if (unit === 'm') return amount * 60 * 1000
  if (unit === 'h') return amount * 60 * 60 * 1000
  return amount * 24 * 60 * 60 * 1000
}

function getRedisLimiter(config: RateLimitConfig) {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  const key = `${config.prefix}:${config.limit}:${config.window}`
  const cached = limiters.get(key)
  if (cached) return cached

  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.fixedWindow(config.limit, config.window),
    prefix: `ruum:${config.prefix}`,
    analytics: true,
  })
  limiters.set(key, limiter)
  return limiter
}

function memoryLimit(identifier: string, config: RateLimitConfig) {
  const now = Date.now()
  const windowMs = parseWindowMs(config.window)
  const key = `${config.prefix}:${identifier}`
  const current = memoryStore.get(key)

  if (!current || current.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: now + windowMs,
    }
  }

  current.count += 1
  return {
    success: current.count <= config.limit,
    limit: config.limit,
    remaining: Math.max(config.limit - current.count, 0),
    reset: current.resetAt,
  }
}

function rateLimitResponse(limit: number, remaining: number, reset: number) {
  return NextResponse.json(
    { ok: false, error: 'Too many requests. Try again in a few minutes.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.max(Math.ceil((reset - Date.now()) / 1000), 1)),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(reset),
      },
    },
  )
}

export async function checkRateLimit(
  request: Request,
  keyBase: string,
  config: RateLimitConfig
) {
  const ip = getClientIp(request)
  const identifier = `${keyBase}:${ip}`
  const limiter = getRedisLimiter(config)
  const result = limiter
    ? await limiter.limit(identifier)
    : memoryLimit(identifier, config)

  if (result.success) return null
  return rateLimitResponse(result.limit, result.remaining, result.reset)
}
