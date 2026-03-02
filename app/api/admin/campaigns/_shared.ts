import { nanoid } from 'nanoid'
import { sql } from 'drizzle-orm'
import { db } from '@/infrastructure/database/connection'

const LOCK_TTL_SECONDS = 60 * 60 * 4

const toSafeProtocol = (value: string | null): 'http' | 'https' =>
  value === 'https' ? 'https' : 'http'

export const getCampaignBaseUrl = (request: Request): string => {
  const configuredBaseUrl = process.env.BASE_URL?.trim()

  if (configuredBaseUrl) {
    const parsed = new URL(configuredBaseUrl)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('BASE_URL must use http or https')
    }
    return parsed.origin
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('BASE_URL must be configured in production')
  }

  const protocol = toSafeProtocol(request.headers.get('x-forwarded-proto'))
  const host = request.headers.get('host') || 'localhost:3000'
  return `${protocol}://${host}`
}

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const ensureCampaignLocksTable = async (): Promise<void> => {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS campaign_locks (
      lock_key TEXT PRIMARY KEY NOT NULL,
      owner TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    )
  `)
}

const acquireCampaignLock = async (
  lockKey: string
): Promise<{ acquired: boolean; owner: string }> => {
  await ensureCampaignLocksTable()

  const owner = nanoid()
  const nowSeconds = Math.floor(Date.now() / 1000)
  const expiresAt = nowSeconds + LOCK_TTL_SECONDS

  await db.run(
    sql`DELETE FROM campaign_locks WHERE lock_key = ${lockKey} AND expires_at <= ${nowSeconds}`
  )

  await db.run(sql`
    INSERT INTO campaign_locks (lock_key, owner, expires_at)
    VALUES (${lockKey}, ${owner}, ${expiresAt})
    ON CONFLICT(lock_key) DO NOTHING
  `)

  const row = await db.get<{ owner: string }>(
    sql`SELECT owner FROM campaign_locks WHERE lock_key = ${lockKey}`
  )

  return { acquired: row?.owner === owner, owner }
}

const releaseCampaignLock = async (
  lockKey: string,
  owner: string
): Promise<void> => {
  await db.run(
    sql`DELETE FROM campaign_locks WHERE lock_key = ${lockKey} AND owner = ${owner}`
  )
}

export const withCampaignLock = async <T>(
  lockKey: string,
  task: () => Promise<T>
): Promise<T> => {
  const { acquired, owner } = await acquireCampaignLock(lockKey)
  if (!acquired) {
    throw new Error('Campaign is already running')
  }

  try {
    return await task()
  } finally {
    await releaseCampaignLock(lockKey, owner)
  }
}
