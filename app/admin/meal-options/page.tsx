'use client'

import { useState, useEffect, useCallback } from 'react'

interface MealOption {
  id: string
  courseType: 'STARTER' | 'MAIN' | 'DESSERT'
  name: string
  description: string | null
  isAvailable: boolean
}

const courseTypeLabels = {
  STARTER: 'Starter',
  MAIN: 'Main Course',
  DESSERT: 'Dessert',
}

export default function MealOptionsPage() {
  const [mealOptions, setMealOptions] = useState<MealOption[]>([])
  const [loading, setLoading] = useState(true)

  const [courseType, setCourseType] = useState<'STARTER' | 'MAIN' | 'DESSERT'>(
    'MAIN'
  )
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchMealOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/meal-options')
      const data = await response.json()
      setMealOptions(data.mealOptions || [])
    } catch {
      alert('Failed to load meal options')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMealOptions()
  }, [fetchMealOptions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/meal-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseType,
          name,
          description: description || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create meal option')
      }

      setName('')
      setDescription('')
      await fetchMealOptions()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create meal option')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meal option?')) return

    try {
      const response = await fetch(`/api/admin/meal-options/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete meal option')
      }

      await fetchMealOptions()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete meal option')
    }
  }

  const handleToggleAvailability = async (
    id: string,
    isAvailable: boolean
  ) => {
    try {
      const response = await fetch(`/api/admin/meal-options/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !isAvailable }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update meal option')
      }

      await fetchMealOptions()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update meal option')
    }
  }

  const groupedOptions = {
    STARTER: mealOptions.filter((o) => o.courseType === 'STARTER'),
    MAIN: mealOptions.filter((o) => o.courseType === 'MAIN'),
    DESSERT: mealOptions.filter((o) => o.courseType === 'DESSERT'),
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <p>Loading meal options...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Meal Options Management</h1>

      <div
        style={{
          marginTop: '2rem',
          padding: '1.5rem',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
        }}
      >
        <h2>Add New Meal Option</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Course Type
            </label>
            <select
              value={courseType}
              onChange={(e) =>
                setCourseType(e.target.value as 'STARTER' | 'MAIN' | 'DESSERT')
              }
              required
              style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
            >
              <option value="STARTER">Starter</option>
              <option value="MAIN">Main Course</option>
              <option value="DESSERT">Dessert</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Grilled Salmon"
              style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the meal..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '1rem',
                fontFamily: 'system-ui',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              background: submitting ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Adding...' : 'Add Meal Option'}
          </button>
        </form>
      </div>

      <div style={{ marginTop: '2rem' }}>
        {(['STARTER', 'MAIN', 'DESSERT'] as const).map((course) => (
          <div
            key={course}
            style={{ marginBottom: '2rem' }}
          >
            <h2>{courseTypeLabels[course]}</h2>
            {groupedOptions[course].length === 0 ? (
              <p style={{ color: '#666' }}>No {courseTypeLabels[course].toLowerCase()} options yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {groupedOptions[course].map((option) => (
                  <div
                    key={option.id}
                    style={{
                      padding: '1rem',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      backgroundColor: option.isAvailable ? 'white' : '#f5f5f5',
                      opacity: option.isAvailable ? 1 : 0.6,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>
                          {option.name}
                          {!option.isAvailable && (
                            <span style={{ color: '#dc3545', fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                              (Unavailable)
                            </span>
                          )}
                        </h3>
                        {option.description && (
                          <p style={{ margin: 0, color: '#666' }}>
                            {option.description}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() =>
                            handleToggleAvailability(option.id, option.isAvailable)
                          }
                          style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.9rem',
                            background: option.isAvailable ? '#ffc107' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          {option.isAvailable ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDelete(option.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.9rem',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
