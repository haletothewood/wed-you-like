import { findGuestWithEmail } from '@/application/invites/contactDetails'

export interface RsvpCompletionCampaignGuest {
  name: string
  email: string
}

export interface RsvpCompletionCampaignInvite {
  id: string
  token: string
  groupName: string | null
  sentAt: string | null
  guests: RsvpCompletionCampaignGuest[]
  rsvpStatus: {
    hasResponded: boolean
    isAttending: boolean | null
  }
  completeness: {
    isComplete: boolean
  }
}

export interface RsvpCompletionCampaignRecipient {
  inviteId: string
  token: string
  groupName: string | null
  guestName: string
  email: string
}

export interface RsvpCompletionCampaignPlan {
  recipients: RsvpCompletionCampaignRecipient[]
  skippedNotSent: number
  skippedPending: number
  skippedNotAttending: number
  skippedComplete: number
  skippedNoEmail: number
}

export const planRsvpCompletionCampaign = ({
  invites,
}: {
  invites: RsvpCompletionCampaignInvite[]
}): RsvpCompletionCampaignPlan => {
  const recipients: RsvpCompletionCampaignRecipient[] = []
  let skippedNotSent = 0
  let skippedPending = 0
  let skippedNotAttending = 0
  let skippedComplete = 0
  let skippedNoEmail = 0

  for (const invite of invites) {
    if (!invite.sentAt) {
      skippedNotSent++
      continue
    }

    if (!invite.rsvpStatus.hasResponded) {
      skippedPending++
      continue
    }

    if (!invite.rsvpStatus.isAttending) {
      skippedNotAttending++
      continue
    }

    if (invite.completeness.isComplete) {
      skippedComplete++
      continue
    }

    const primaryGuest = findGuestWithEmail(invite.guests)
    if (!primaryGuest) {
      skippedNoEmail++
      continue
    }

    recipients.push({
      inviteId: invite.id,
      token: invite.token,
      groupName: invite.groupName,
      guestName: primaryGuest.name,
      email: primaryGuest.email,
    })
  }

  return {
    recipients,
    skippedNotSent,
    skippedPending,
    skippedNotAttending,
    skippedComplete,
    skippedNoEmail,
  }
}
