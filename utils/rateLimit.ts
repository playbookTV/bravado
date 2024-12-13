import { NextApiRequest, NextApiResponse } from 'next'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
  generate: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
}

// Cache middleware
export async function withCache(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: () => Promise<any>
) {
  const cacheKey = req.url + JSON.stringify(req.body)
  const cachedResponse = await redis.get(cacheKey)

  if (cachedResponse) {
    return res.status(200).json(JSON.parse(cachedResponse as string))
  }

  const response = await handler()
  await redis.set(cacheKey, JSON.stringify(response), { ex: 3600 }) // Cache for 1 hour
  return res.status(200).json(response)
}

type RateLimitType = 'search' | 'generate'

interface RateLimitInfo {
  count: number
  timestamp: number
}

// Custom rate limit implementation using Redis
export async function withRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => Promise<any>,
  type: RateLimitType = 'search'
) {
  const config = RATE_LIMIT_CONFIG[type]
  const ip = (Array.isArray(req.headers['x-forwarded-for']) 
    ? req.headers['x-forwarded-for'][0] 
    : req.headers['x-forwarded-for']) || 
    req.socket.remoteAddress || 
    'unknown'
  const key = `rate-limit:${type}:${ip}`

  try {
    // Get current count and timestamp
    const current = await redis.get(key)
    const now = Date.now()

    let rateLimitInfo: RateLimitInfo | null = null
    if (current) {
      try {
        rateLimitInfo = typeof current === 'string' 
          ? JSON.parse(current) 
          : current as RateLimitInfo
      } catch (e) {
        console.error('Failed to parse rate limit info:', e)
        rateLimitInfo = null
      }
    }

    if (rateLimitInfo) {
      // Check if window has expired
      if (now - rateLimitInfo.timestamp < config.windowMs) {
        // Window is still valid
        if (rateLimitInfo.count >= config.maxRequests) {
          const remainingTime = Math.ceil((config.windowMs - (now - rateLimitInfo.timestamp)) / 1000)
          return res.status(429).json({
            error: 'Too Many Requests',
            details: `Rate limit exceeded. Please wait ${remainingTime} seconds before trying again.`
          })
        }
        
        // Increment count
        const newInfo: RateLimitInfo = {
          count: rateLimitInfo.count + 1,
          timestamp: rateLimitInfo.timestamp
        }
        await redis.set(key, JSON.stringify(newInfo), { ex: Math.ceil(config.windowMs / 1000) })
      } else {
        // Window has expired, start new window
        const newInfo: RateLimitInfo = {
          count: 1,
          timestamp: now
        }
        await redis.set(key, JSON.stringify(newInfo), { ex: Math.ceil(config.windowMs / 1000) })
      }
    } else {
      // First request, start new window
      const newInfo: RateLimitInfo = {
        count: 1,
        timestamp: now
      }
      await redis.set(key, JSON.stringify(newInfo), { ex: Math.ceil(config.windowMs / 1000) })
    }

    // Continue with the request
    const response = await next()
    return response
  } catch (error) {
    console.error('Rate limit error:', error)
    // If rate limiting fails, allow the request but log the error
    return await next()
  }
} 