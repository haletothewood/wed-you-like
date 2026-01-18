'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Guest {
  id: string
  name: string
  email: string
}

interface Invite {
  id: string
  token: string
  groupName: string | null
  adultsCount: number
  childrenCount: number
  plusOneAllowed: boolean
  guests: Guest[]
  sentAt: string | null
  createdAt: string
}

export default function InvitesAdmin() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [inviteType, setInviteType] = useState<'individual' | 'group'>(
    'individual'
  )
  const [sending, setSending] = useState<string | null>(null)

  // Individual form state
  const [guestName, setGuestName] = useState('')
  const [email, setEmail] = useState('')
  const [plusOneAllowed, setPlusOneAllowed] = useState(false)

  // Group form state
  const [groupName, setGroupName] = useState('')
  const [adultsCount, setAdultsCount] = useState(2)
  const [childrenCount, setChildrenCount] = useState(0)
  const [groupGuests, setGroupGuests] = useState<
    Array<{ name: string; email: string }>
  >([
    { name: '', email: '' },
    { name: '', email: '' },
  ])

  useEffect(() => {
    fetchInvites()
  }, [])

  const fetchInvites = async () => {
    try {
      const response = await fetch('/api/admin/invites')
      const data = await response.json()
      setInvites(data.invites || [])
    } catch (error) {
      console.error('Error fetching invites:', error)
      setInvites([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateIndividual = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'individual',
          guestName,
          email,
          plusOneAllowed,
        }),
      })

      if (response.ok) {
        setGuestName('')
        setEmail('')
        setPlusOneAllowed(false)
        setShowForm(false)
        fetchInvites()
      }
    } catch (error) {
      console.error('Error creating invite:', error)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'group',
          groupName,
          adultsCount,
          childrenCount,
          guests: groupGuests,
        }),
      })

      if (response.ok) {
        setGroupName('')
        setAdultsCount(2)
        setChildrenCount(0)
        setGroupGuests([
          { name: '', email: '' },
          { name: '', email: '' },
        ])
        setShowForm(false)
        fetchInvites()
      }
    } catch (error) {
      console.error('Error creating group invite:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invite?')) return

    try {
      const response = await fetch(`/api/admin/invites/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchInvites()
      }
    } catch (error) {
      console.error('Error deleting invite:', error)
    }
  }

  const handleSendEmail = async (id: string) => {
    setSending(id)
    try {
      const response = await fetch(`/api/admin/invites/${id}/send-email`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Email sent successfully to ${data.sentTo}`)
        fetchInvites()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Failed to send email')
    } finally {
      setSending(null)
    }
  }

  const updateGroupGuestCount = (newAdults: number, newChildren: number) => {
    const totalCount = newAdults + newChildren
    const currentCount = groupGuests.length

    if (totalCount > currentCount) {
      const newGuests = Array(totalCount - currentCount)
        .fill(null)
        .map(() => ({ name: '', email: '' }))
      setGroupGuests([...groupGuests, ...newGuests])
    } else if (totalCount < currentCount) {
      setGroupGuests(groupGuests.slice(0, totalCount))
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <h1>Invite Management</h1>
        <div>
          <Link
            href="/admin"
            style={{
              marginRight: '1rem',
              padding: '0.5rem 1rem',
              background: '#eee',
              borderRadius: '4px',
              textDecoration: 'none',
              color: 'black',
            }}
          >
            Back to Admin
          </Link>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '0.5rem 1rem',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {showForm ? 'Cancel' : 'Create Invite'}
          </button>
        </div>
      </div>

      {showForm && (
        <div
          style={{
            padding: '1.5rem',
            background: '#f9f9f9',
            borderRadius: '8px',
            marginBottom: '2rem',
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ marginRight: '1rem' }}>
              <input
                type="radio"
                checked={inviteType === 'individual'}
                onChange={() => setInviteType('individual')}
              />
              Individual
            </label>
            <label>
              <input
                type="radio"
                checked={inviteType === 'group'}
                onChange={() => setInviteType('group')}
              />
              Group
            </label>
          </div>

          {inviteType === 'individual' ? (
            <form onSubmit={handleCreateIndividual}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Guest Name:
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Email:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={plusOneAllowed}
                    onChange={(e) => setPlusOneAllowed(e.target.checked)}
                  />
                  Allow Plus One
                </label>
              </div>
              <button
                type="submit"
                style={{
                  padding: '0.5rem 1rem',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Create Individual Invite
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateGroup}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Group Name:
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Adults:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={adultsCount}
                    onChange={(e) => {
                      const count = parseInt(e.target.value)
                      setAdultsCount(count)
                      updateGroupGuestCount(count, childrenCount)
                    }}
                    required
                    style={{ width: '100px', padding: '0.5rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Children:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={childrenCount}
                    onChange={(e) => {
                      const count = parseInt(e.target.value)
                      setChildrenCount(count)
                      updateGroupGuestCount(adultsCount, count)
                    }}
                    required
                    style={{ width: '100px', padding: '0.5rem' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <h4>Guests:</h4>
                {groupGuests.map((guest, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Name"
                      value={guest.name}
                      onChange={(e) => {
                        const newGuests = [...groupGuests]
                        newGuests[index].name = e.target.value
                        setGroupGuests(newGuests)
                      }}
                      required
                      style={{ flex: 1, padding: '0.5rem' }}
                    />
                    <input
                      type="email"
                      placeholder="Email (optional for children)"
                      value={guest.email}
                      onChange={(e) => {
                        const newGuests = [...groupGuests]
                        newGuests[index].email = e.target.value
                        setGroupGuests(newGuests)
                      }}
                      style={{ flex: 1, padding: '0.5rem' }}
                    />
                  </div>
                ))}
              </div>
              <button
                type="submit"
                style={{
                  padding: '0.5rem 1rem',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Create Group Invite
              </button>
            </form>
          )}
        </div>
      )}

      <div>
        <h2>Invites ({invites.length})</h2>
        {invites.length === 0 ? (
          <p>No invites yet. Create one to get started!</p>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '1rem',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Count</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Token</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <tr key={invite.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.5rem' }}>
                    {invite.groupName || invite.guests[0]?.name}
                    {invite.plusOneAllowed && ' (+1)'}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    {invite.groupName ? 'Group' : 'Individual'}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    {invite.adultsCount}A / {invite.childrenCount}C
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    {invite.sentAt ? (
                      <span style={{ color: '#28a745', fontSize: '0.875rem' }}>
                        Sent
                      </span>
                    ) : (
                      <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                        Not Sent
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: '0.5rem',
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                    }}
                  >
                    {invite.token}
                  </td>
                  <td style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleSendEmail(invite.id)}
                      disabled={sending === invite.id}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: sending === invite.id ? '#6c757d' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: sending === invite.id ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      {sending === invite.id ? 'Sending...' : 'Send Email'}
                    </button>
                    <button
                      onClick={() => handleDelete(invite.id)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
