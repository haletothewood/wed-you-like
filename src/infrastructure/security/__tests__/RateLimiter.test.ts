import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { RateLimiter } from '../RateLimiter'

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter

  beforeEach(() => {
    vi.useFakeTimers()
    rateLimiter = new RateLimiter({
      maxAttempts: 5,
      windowMs: 60 * 1000,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should allow requests under the limit', () => {
    const key = '192.168.1.1'

    for (let i = 0; i < 5; i++) {
      const result = rateLimiter.check(key)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4 - i)
    }
  })

  it('should block requests over the limit', () => {
    const key = '192.168.1.1'

    for (let i = 0; i < 5; i++) {
      rateLimiter.check(key)
    }

    const result = rateLimiter.check(key)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfterMs).toBeGreaterThan(0)
  })

  it('should track different keys independently', () => {
    const key1 = '192.168.1.1'
    const key2 = '192.168.1.2'

    for (let i = 0; i < 5; i++) {
      rateLimiter.check(key1)
    }

    const result1 = rateLimiter.check(key1)
    const result2 = rateLimiter.check(key2)

    expect(result1.allowed).toBe(false)
    expect(result2.allowed).toBe(true)
    expect(result2.remaining).toBe(4)
  })

  it('should reset after window expires', () => {
    const key = '192.168.1.1'

    for (let i = 0; i < 5; i++) {
      rateLimiter.check(key)
    }

    expect(rateLimiter.check(key).allowed).toBe(false)

    vi.advanceTimersByTime(60 * 1000 + 1)

    const result = rateLimiter.check(key)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('should return correct retry after time', () => {
    const key = '192.168.1.1'

    for (let i = 0; i < 5; i++) {
      rateLimiter.check(key)
    }

    vi.advanceTimersByTime(30 * 1000)

    const result = rateLimiter.check(key)
    expect(result.allowed).toBe(false)
    expect(result.retryAfterMs).toBeLessThanOrEqual(30 * 1000)
    expect(result.retryAfterMs).toBeGreaterThan(0)
  })

  it('should handle record method for failed attempts', () => {
    const key = '192.168.1.1'

    for (let i = 0; i < 5; i++) {
      rateLimiter.record(key)
    }

    const result = rateLimiter.check(key)
    expect(result.allowed).toBe(false)
  })

  it('should reset specific key', () => {
    const key = '192.168.1.1'

    for (let i = 0; i < 5; i++) {
      rateLimiter.check(key)
    }

    expect(rateLimiter.check(key).allowed).toBe(false)

    rateLimiter.reset(key)

    const result = rateLimiter.check(key)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('should use custom configuration', () => {
    const customLimiter = new RateLimiter({
      maxAttempts: 3,
      windowMs: 10 * 1000,
    })

    const key = '192.168.1.1'

    for (let i = 0; i < 3; i++) {
      expect(customLimiter.check(key).allowed).toBe(true)
    }

    expect(customLimiter.check(key).allowed).toBe(false)
  })
})
