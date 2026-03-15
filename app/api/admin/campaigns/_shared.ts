import { sql } from 'drizzle-orm'
import { db } from '@/infrastructure/database/connection'

export type CampaignRunKey =
  | 'rsvp-reminder'
  | 'rsvp-completion'
  | 'thank-you'
  | 'photo-share'
export type CampaignRunStatus = 'success' | 'partial' | 'failed'

export interface CampaignRunSummary {
  campaignKey: CampaignRunKey
  lastStatus: CampaignRunStatus
  lastAttemptAt: number
  lastSuccessAt: number | null
  lastSent: number
  lastFailed: number
}

export const getCampaignBaseUrl = (_request?: Request): string => {
  const configuredBaseUrl = process.env.BASE_URL?.trim()
  const requestBaseUrl = _request ? new URL(_request.url).origin : null

  if (!configuredBaseUrl && !requestBaseUrl) {
    throw new Error('BASE_URL must be configured')
  }

  const parsed = new URL(configuredBaseUrl || requestBaseUrl!)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('BASE_URL must use http or https')
  }

  return parsed.origin
}

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const ensureCampaignRunsTable = async (): Promise<void> => {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS campaign_runs (
      campaign_key TEXT PRIMARY KEY NOT NULL,
      last_status TEXT NOT NULL,
      last_attempt_at INTEGER NOT NULL,
      last_success_at INTEGER,
      last_sent INTEGER NOT NULL DEFAULT 0,
      last_failed INTEGER NOT NULL DEFAULT 0
    )
  `)
}

export const recordCampaignRun = async (input: {
  campaignKey: CampaignRunKey
  status: CampaignRunStatus
  sent: number
  failed: number
}): Promise<void> => {
  await ensureCampaignRunsTable()

  const nowSeconds = Math.floor(Date.now() / 1000)
  const lastSuccessAt =
    input.status === 'success' || input.status === 'partial' ? nowSeconds : null

  await db.run(sql`
    INSERT INTO campaign_runs (
      campaign_key,
      last_status,
      last_attempt_at,
      last_success_at,
      last_sent,
      last_failed
    )
    VALUES (
      ${input.campaignKey},
      ${input.status},
      ${nowSeconds},
      ${lastSuccessAt},
      ${input.sent},
      ${input.failed}
    )
    ON CONFLICT(campaign_key) DO UPDATE SET
      last_status = excluded.last_status,
      last_attempt_at = excluded.last_attempt_at,
      last_success_at = COALESCE(excluded.last_success_at, campaign_runs.last_success_at),
      last_sent = excluded.last_sent,
      last_failed = excluded.last_failed
  `)
}

export const getCampaignRunSummaries = async (
  keys: CampaignRunKey[]
): Promise<Partial<Record<CampaignRunKey, CampaignRunSummary>>> => {
  await ensureCampaignRunsTable()

  const rows = await db.all<{
    campaign_key: CampaignRunKey
    last_status: CampaignRunStatus
    last_attempt_at: number
    last_success_at: number | null
    last_sent: number
    last_failed: number
  }>(sql`SELECT campaign_key, last_status, last_attempt_at, last_success_at, last_sent, last_failed FROM campaign_runs`)

  const allowedKeys = new Set<CampaignRunKey>(keys)
  const result: Partial<Record<CampaignRunKey, CampaignRunSummary>> = {}
  for (const row of rows) {
    if (!allowedKeys.has(row.campaign_key)) {
      continue
    }
    result[row.campaign_key] = {
      campaignKey: row.campaign_key,
      lastStatus: row.last_status,
      lastAttemptAt: row.last_attempt_at,
      lastSuccessAt: row.last_success_at,
      lastSent: row.last_sent,
      lastFailed: row.last_failed,
    }
  }

  return result
}
