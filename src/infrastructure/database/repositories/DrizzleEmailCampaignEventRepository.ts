import { and, desc, eq, isNotNull } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db } from '../connection'
import { emailCampaignEvents, emailTemplates } from '../schema'

export type EmailCampaignEventType = 'invite_send' | 'test_send' | 'photo_share_send'
export type EmailCampaignEventStatus = 'sent' | 'failed'

interface LogEmailCampaignEventInput {
  eventType: EmailCampaignEventType
  status: EmailCampaignEventStatus
  templateId?: string
  inviteId?: string
  recipientEmail: string
  subject?: string
  errorMessage?: string
}

export interface TemplateEmailAnalytics {
  templateId: string
  templateName: string
  sent: number
  failed: number
  lastSentAt: Date | null
}

export interface RecentEmailFailure {
  id: string
  eventType: EmailCampaignEventType
  templateName: string | null
  recipientEmail: string
  errorMessage: string | null
  createdAt: Date
}

export class DrizzleEmailCampaignEventRepository {
  async logEvent(input: LogEmailCampaignEventInput): Promise<void> {
    await db.insert(emailCampaignEvents).values({
      id: nanoid(),
      eventType: input.eventType,
      status: input.status,
      templateId: input.templateId,
      inviteId: input.inviteId,
      recipientEmail: input.recipientEmail,
      subject: input.subject,
      errorMessage: input.errorMessage,
    })
  }

  async getTemplateAnalytics(): Promise<TemplateEmailAnalytics[]> {
    const rows = await db
      .select({
        templateId: emailCampaignEvents.templateId,
        templateName: emailTemplates.name,
        status: emailCampaignEvents.status,
        createdAt: emailCampaignEvents.createdAt,
      })
      .from(emailCampaignEvents)
      .leftJoin(emailTemplates, eq(emailCampaignEvents.templateId, emailTemplates.id))
      .where(
        and(
          eq(emailCampaignEvents.eventType, 'invite_send'),
          isNotNull(emailCampaignEvents.templateId)
        )
      )
      .orderBy(desc(emailCampaignEvents.createdAt))

    const analyticsMap = new Map<string, TemplateEmailAnalytics>()

    for (const row of rows) {
      if (!row.templateId) continue

      const existing = analyticsMap.get(row.templateId) ?? {
        templateId: row.templateId,
        templateName: row.templateName || 'Unknown template',
        sent: 0,
        failed: 0,
        lastSentAt: null,
      }

      if (row.status === 'sent') {
        existing.sent += 1
        if (!existing.lastSentAt || row.createdAt > existing.lastSentAt) {
          existing.lastSentAt = row.createdAt
        }
      } else {
        existing.failed += 1
      }

      analyticsMap.set(row.templateId, existing)
    }

    return Array.from(analyticsMap.values()).sort((a, b) => {
      const aTime = a.lastSentAt ? a.lastSentAt.getTime() : 0
      const bTime = b.lastSentAt ? b.lastSentAt.getTime() : 0
      return bTime - aTime
    })
  }

  async getRecentFailures(limit = 12): Promise<RecentEmailFailure[]> {
    const rows = await db
      .select({
        id: emailCampaignEvents.id,
        eventType: emailCampaignEvents.eventType,
        templateName: emailTemplates.name,
        recipientEmail: emailCampaignEvents.recipientEmail,
        errorMessage: emailCampaignEvents.errorMessage,
        createdAt: emailCampaignEvents.createdAt,
      })
      .from(emailCampaignEvents)
      .leftJoin(emailTemplates, eq(emailCampaignEvents.templateId, emailTemplates.id))
      .where(eq(emailCampaignEvents.status, 'failed'))
      .orderBy(desc(emailCampaignEvents.createdAt))
      .limit(limit)

    return rows.map((row) => ({
      id: row.id,
      eventType: row.eventType,
      templateName: row.templateName,
      recipientEmail: row.recipientEmail,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
    }))
  }

  async getOverallCounts(): Promise<{
    sent: number
    failed: number
    lastSentAt: Date | null
  }> {
    const rows = await db
      .select({
        status: emailCampaignEvents.status,
        createdAt: emailCampaignEvents.createdAt,
      })
      .from(emailCampaignEvents)

    let sent = 0
    let failed = 0
    let lastSentAt: Date | null = null

    for (const row of rows) {
      if (row.status === 'sent') {
        sent += 1
        if (!lastSentAt || row.createdAt > lastSentAt) {
          lastSentAt = row.createdAt
        }
      } else {
        failed += 1
      }
    }

    return {
      sent,
      failed,
      lastSentAt,
    }
  }
}
