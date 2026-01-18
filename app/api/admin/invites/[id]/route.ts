import { NextResponse } from 'next/server'
import { DrizzleInviteRepository } from '@/infrastructure/database/repositories/DrizzleInviteRepository'
import { DeleteInvite } from '@/application/use-cases/DeleteInvite'

const inviteRepository = new DrizzleInviteRepository()

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleteInvite = new DeleteInvite(inviteRepository)
    await deleteInvite.execute(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invite:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete invite'
    const status = message === 'Invite not found' ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
