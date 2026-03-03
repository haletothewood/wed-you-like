import { NextResponse } from 'next/server'
import { db } from '@/infrastructure/database/connection'
import { rsvps } from '@/infrastructure/database/schema'
import { DrizzleInviteRepository } from '@/infrastructure/database/repositories/DrizzleInviteRepository'
import {
  planBulkInviteEmail,
  type BulkEmailMode,
  type BulkEmailPlanResult,
} from '@/application/campaigns/planBulkInviteEmail'

const inviteRepository = new DrizzleInviteRepository()
const MAX_BULK_INVITES = 500

interface BulkEmailPreviewResponse {
  success: boolean
  mode: BulkEmailMode
  dryRun: true
  requested: number
  eligible: number
  skipped: number
  eligibleInviteIds: string[]
  results: BulkEmailPlanResult[]
}

const parseMode = (value: unknown): BulkEmailMode | null => {
  if (value === 'invite' || value === 'reminder') return value
  return null
}

const parseInviteIds = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null

  const ids = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item !== '')

  return ids
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const mode = parseMode(body.mode)
    const inviteIds = parseInviteIds(body.inviteIds)

    if (!mode || !inviteIds) {
      return NextResponse.json(
        { error: 'mode must be invite/reminder and inviteIds must be an array of invite IDs' },
        { status: 400 }
      )
    }

    if (inviteIds.length === 0) {
      return NextResponse.json({ error: 'Select at least one invite' }, { status: 400 })
    }

    if (inviteIds.length > MAX_BULK_INVITES) {
      return NextResponse.json(
        { error: `Too many invites selected (max ${MAX_BULK_INVITES})` },
        { status: 400 }
      )
    }

    const [allInvites, respondedRows] = await Promise.all([
      inviteRepository.findAll(),
      db.select({ inviteId: rsvps.inviteId }).from(rsvps),
    ])

    const invitesById = new Map(
      allInvites.map((invite) => [
        invite.id,
        {
          id: invite.id,
          groupName: invite.groupName,
          sentAt: invite.sentAt,
          guests: invite.guests.map((guest) => ({
            name: guest.name,
            email: guest.email,
          })),
        },
      ])
    )

    const respondedInviteIds = new Set(respondedRows.map((row) => row.inviteId))
    const plan = planBulkInviteEmail({
      mode,
      inviteIds,
      invitesById,
      respondedInviteIds,
    })

    const response: BulkEmailPreviewResponse = {
      success: true,
      mode,
      dryRun: true,
      requested: plan.requested,
      eligible: plan.eligible,
      skipped: plan.skipped,
      eligibleInviteIds: plan.results
        .filter((result) => result.status === 'would_send')
        .map((result) => result.inviteId),
      results: plan.results,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error previewing bulk email send:', error)
    return NextResponse.json({ error: 'Failed to preview bulk email send' }, { status: 500 })
  }
}
