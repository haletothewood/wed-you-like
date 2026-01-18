'use client'

import Link from 'next/link'

export default function Admin() {
  return (
    <div>
      <div
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        <p style={{ fontSize: '1.125rem', color: '#555', margin: 0 }}>
          Welcome to your wedding RSVP management system. Use the sidebar to navigate between different sections.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}
      >
        <Link
          href="/admin/invites"
          style={{
            display: 'block',
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            textDecoration: 'none',
            color: 'inherit',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            border: '1px solid transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
            e.currentTarget.style.borderColor = '#3498db'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'
            e.currentTarget.style.borderColor = 'transparent'
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✉️</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>Invites</h3>
          <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.9rem' }}>
            Create and manage guest invitations with unique RSVP links
          </p>
        </Link>

        <Link
          href="/admin/meal-options"
          style={{
            display: 'block',
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            textDecoration: 'none',
            color: 'inherit',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            border: '1px solid transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
            e.currentTarget.style.borderColor = '#3498db'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'
            e.currentTarget.style.borderColor = 'transparent'
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🍽️</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>Meal Options</h3>
          <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.9rem' }}>
            Configure menu options for starters, mains, and desserts
          </p>
        </Link>

        <Link
          href="/admin/custom-questions"
          style={{
            display: 'block',
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            textDecoration: 'none',
            color: 'inherit',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            border: '1px solid transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
            e.currentTarget.style.borderColor = '#3498db'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'
            e.currentTarget.style.borderColor = 'transparent'
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>❓</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>Custom Questions</h3>
          <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.9rem' }}>
            Add custom questions for guests (text, single choice, multiple choice)
          </p>
        </Link>

        <div
          style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            opacity: 0.6,
            border: '1px solid #e0e0e0',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📧</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#95a5a6' }}>Email Templates</h3>
          <p style={{ margin: 0, color: '#95a5a6', fontSize: '0.9rem' }}>
            Coming soon: Configure and send email invitations
          </p>
        </div>

        <div
          style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            opacity: 0.6,
            border: '1px solid #e0e0e0',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🪑</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#95a5a6' }}>Table Assignments</h3>
          <p style={{ margin: 0, color: '#95a5a6', fontSize: '0.9rem' }}>
            Coming soon: Assign guests to tables
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: '2rem',
          background: '#e8f4f8',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #b8daec',
        }}
      >
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>Quick Stats</h3>
        <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>
          View all your invites and RSVPs in the Invites section
        </p>
      </div>
    </div>
  )
}
