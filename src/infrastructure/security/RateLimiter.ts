export interface RateLimiterConfig {
  maxAttempts: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs?: number
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map()
  private config: RateLimiterConfig

  constructor(config: RateLimiterConfig) {
    this.config = config
  }

  check(key: string): RateLimitResult {
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || now >= entry.resetAt) {
      this.store.set(key, {
        count: 1,
        resetAt: now + this.config.windowMs,
      })
      return {
        allowed: true,
        remaining: this.config.maxAttempts - 1,
      }
    }

    if (entry.count >= this.config.maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: entry.resetAt - now,
      }
    }

    entry.count++
    return {
      allowed: true,
      remaining: this.config.maxAttempts - entry.count,
    }
  }

  record(key: string): void {
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || now >= entry.resetAt) {
      this.store.set(key, {
        count: 1,
        resetAt: now + this.config.windowMs,
      })
      return
    }

    entry.count++
  }

  reset(key: string): void {
    this.store.delete(key)
  }
}

export const loginRateLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
})
