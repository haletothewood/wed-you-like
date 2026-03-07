import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/infrastructure/database/connection'
import { rsvps } from '@/infrastructure/database/schema'
import { DrizzleInviteRepository } from '@/infrastructure/database/repositories/DrizzleInviteRepository'
import { DrizzleWeddingSettingsRepository } from '@/infrastructure/database/repositories/DrizzleWeddingSettingsRepository'
import {
  buildWhatsAppShareUrl,
  findGuestWithPhone,
  getInviteLabel,
  normalizePhoneForWhatsApp,
} from '@/application/invites/contactDetails'
import { getCampaignBaseUrl } from '../../../campaigns/_shared'

const inviteRepository = new DrizzleInviteRepository()
const weddingSettingsRepository = new DrizzleWeddingSettingsRepository()

type ShareMode = 'invite' | 'reminder'

const buildShareMessage = (input: {
  mode: ShareMode
  label: string
  rsvpUrl: string
  deadline?: string
}): string => {
  if (input.mode === 'reminder') {
    return [
      `Hi ${input.label}, just a reminder to RSVP for our wedding.`,
      input.deadline ? `Please RSVP by ${input.deadline}.` : null,
      `Your RSVP link: ${input.rsvpUrl}`,
    ]
      .filter(Boolean)
      .join('\n\n')
  }

  return [
    `Hi ${input.label}, we'd love for you to join us for our wedding.`,
    `Please RSVP using your personal link: ${input.rsvpUrl}`,
  ].join('\n\n')
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [invite, existingRsvpRows, weddingSettings] = await Promise.all([
      inviteRepository.findById(id),
      db.select({ id: rsvps.id }).from(rsvps).where(eq(rsvps.inviteId, id)).limit(1),
      weddingSettingsRepository.get(),
    ])

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    const phoneGuest = findGuestWithPhone(invite.guests)
    if (!phoneGuest) {
      return NextResponse.json(
        { error: 'Invite has no guest with a phone number' },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhoneForWhatsApp(phoneGuest.phone)
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: 'Phone number must be in a WhatsApp-compatible format' },
        { status: 400 }
      )
    }

    const hasResponded = existingRsvpRows.length > 0
    const mode: ShareMode = invite.sentAt && !hasResponded ? 'reminder' : 'invite'
    const baseUrl = getCampaignBaseUrl(request)
    const rsvpUrl = `${baseUrl}/rsvp/${encodeURIComponent(invite.token)}`
    const label = getInviteLabel(invite)
    const message = buildShareMessage({
      mode,
      label,
      rsvpUrl,
      deadline: weddingSettings?.rsvpDeadline,
    })

    let markedSent = false
    if (!invite.sentAt) {
      invite.markAsSent('whatsapp')
      await inviteRepository.save(invite)
      markedSent = true
    }

    return NextResponse.json({
      success: true,
      mode,
      markedSent,
      phone: normalizedPhone,
      shareUrl: buildWhatsAppShareUrl(normalizedPhone, message),
    })
  } catch (error) {
    console.error('Error preparing WhatsApp share:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to prepare WhatsApp share'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
