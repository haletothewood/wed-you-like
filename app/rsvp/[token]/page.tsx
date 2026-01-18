'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'

interface Guest {
  id: string
  name: string
  email: string
}

interface MealOption {
  id: string
  courseType: 'STARTER' | 'MAIN' | 'DESSERT'
  name: string
  description: string | null
}

interface CustomQuestion {
  id: string
  questionText: string
  questionType: 'TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'
  options: string[]
  isRequired: boolean
}

interface InviteDetails {
  id: string
  token: string
  groupName: string | null
  adultsCount: number
  childrenCount: number
  plusOneAllowed: boolean
  guests: Guest[]
  hasResponded: boolean
  rsvp?: {
    isAttending: boolean
    adultsAttending: number
    childrenAttending: number
    dietaryRequirements: string | null
  }
  mealOptions: MealOption[]
  customQuestions: CustomQuestion[]
}

export default function RSVP() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Form state
  const [isAttending, setIsAttending] = useState<boolean | null>(null)
  const [adultsAttending, setAdultsAttending] = useState(0)
  const [childrenAttending, setChildrenAttending] = useState(0)
  const [dietaryRequirements, setDietaryRequirements] = useState('')
  const [mealSelections, setMealSelections] = useState<Record<string, Record<string, string>>>({})
  const [questionResponses, setQuestionResponses] = useState<Record<string, string>>({})
  const [multipleChoiceSelections, setMultipleChoiceSelections] = useState<Record<string, string[]>>({})

  const fetchInvite = useCallback(async () => {
    try {
      const response = await fetch(`/api/rsvp/${token}`)

      if (response.status === 404) {
        setError('Invite not found. Please check your link.')
        setLoading(false)
        return
      }

      const data = await response.json()
      setInvite(data.invite)

      // Pre-fill form if already responded
      if (data.invite.hasResponded && data.invite.rsvp) {
        setIsAttending(data.invite.rsvp.isAttending)
        setAdultsAttending(data.invite.rsvp.adultsAttending)
        setChildrenAttending(data.invite.rsvp.childrenAttending)
        setDietaryRequirements(data.invite.rsvp.dietaryRequirements || '')
      } else {
        // Default to full party size
        setAdultsAttending(data.invite.adultsCount)
        setChildrenAttending(data.invite.childrenCount)
      }
    } catch {
      setError('Failed to load invite details')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchInvite()
  }, [fetchInvite])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isAttending === null) {
      alert('Please indicate if you will be attending')
      return
    }

    setSubmitting(true)

    try {
      const mealSelectionsArray = isAttending && invite
        ? Object.entries(mealSelections).flatMap(([guestId, courses]) =>
            Object.entries(courses).map(([courseType, mealOptionId]) => ({
              guestId,
              mealOptionId,
              courseType: courseType as 'STARTER' | 'MAIN' | 'DESSERT',
            }))
          )
        : undefined

      const questionResponsesArray = isAttending && invite
        ? invite.customQuestions
            .map((q) => {
              let responseText = ''
              if (q.questionType === 'MULTIPLE_CHOICE') {
                const selected = multipleChoiceSelections[q.id] || []
                responseText = selected.join(', ')
              } else {
                responseText = questionResponses[q.id] || ''
              }
              return {
                questionId: q.id,
                responseText,
              }
            })
            .filter((r) => r.responseText.trim() !== '')
        : undefined

      const response = await fetch(`/api/rsvp/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isAttending,
          adultsAttending: isAttending ? adultsAttending : 0,
          childrenAttending: isAttending ? childrenAttending : 0,
          dietaryRequirements: isAttending ? dietaryRequirements : undefined,
          mealSelections: mealSelectionsArray,
          questionResponses: questionResponsesArray,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit RSVP')
      }

      setSubmitted(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit RSVP')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '3rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✉️</div>
          <p style={{ color: '#555' }}>Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '3rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '500px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
          <h1 style={{ color: '#2c3e50', marginBottom: '1rem' }}>Oops!</h1>
          <p style={{ color: '#dc3545' }}>{error}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '3rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '600px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎉</div>
          <h1 style={{ color: '#2c3e50', marginBottom: '1rem', fontSize: '2rem' }}>Thank You!</h1>
          <p style={{ color: '#555', marginBottom: '1rem', fontSize: '1.125rem' }}>
            Your RSVP has been {invite?.hasResponded ? 'updated' : 'submitted'} successfully.
          </p>
          {isAttending ? (
            <p style={{ color: '#27ae60', fontSize: '1.125rem' }}>We look forward to seeing you at the wedding!</p>
          ) : (
            <p style={{ color: '#7f8c8d', fontSize: '1.125rem' }}>We&apos;re sorry you can&apos;t make it.</p>
          )}
        </div>
      </div>
    )
  }

  if (!invite) {
    return null
  }

  const displayName = invite.groupName || invite.guests[0]?.name || 'Guest'

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {/* Header Card */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💒</div>
          <h1 style={{ color: '#2c3e50', marginBottom: '0.5rem', fontSize: '2rem' }}>Wedding RSVP</h1>
          <h2 style={{ color: '#7f8c8d', fontSize: '1.25rem', fontWeight: 'normal' }}>
            For: {displayName}
          </h2>
        </div>

        {/* Already Responded Alert */}
        {invite.hasResponded && (
          <div
            style={{
              padding: '1.5rem',
              background: '#e8f4f8',
              border: '1px solid #b8daec',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
              <strong style={{ color: '#2c3e50' }}>You have already responded to this invitation.</strong>
            </div>
            <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>
              You can update your RSVP below.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Attendance Selection Card */}
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Will you be attending?</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setIsAttending(true)}
                style={{
                  padding: '1rem 2rem',
                  fontSize: '1rem',
                  border: isAttending === true ? '2px solid #27ae60' : '2px solid #ddd',
                  background: isAttending === true ? '#27ae60' : 'white',
                  color: isAttending === true ? 'white' : '#555',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  flex: 1,
                  fontWeight: isAttending === true ? 'bold' : 'normal',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (isAttending !== true) {
                    e.currentTarget.style.borderColor = '#27ae60'
                    e.currentTarget.style.color = '#27ae60'
                  }
                }}
                onMouseLeave={(e) => {
                  if (isAttending !== true) {
                    e.currentTarget.style.borderColor = '#ddd'
                    e.currentTarget.style.color = '#555'
                  }
                }}
              >
                Yes, I&apos;ll be there
              </button>
              <button
                type="button"
                onClick={() => setIsAttending(false)}
                style={{
                  padding: '1rem 2rem',
                  fontSize: '1rem',
                  border: isAttending === false ? '2px solid #dc3545' : '2px solid #ddd',
                  background: isAttending === false ? '#dc3545' : 'white',
                  color: isAttending === false ? 'white' : '#555',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  flex: 1,
                  fontWeight: isAttending === false ? 'bold' : 'normal',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (isAttending !== false) {
                    e.currentTarget.style.borderColor = '#dc3545'
                    e.currentTarget.style.color = '#dc3545'
                  }
                }}
                onMouseLeave={(e) => {
                  if (isAttending !== false) {
                    e.currentTarget.style.borderColor = '#ddd'
                    e.currentTarget.style.color = '#555'
                  }
                }}
              >
                Sorry, I can&apos;t make it
              </button>
            </div>
          </div>

          {isAttending && (
            <>
              {/* Guest Count Card */}
              <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>How many people will be attending?</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#555', fontWeight: '500' }}>
                      Adults (max {invite.adultsCount})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={invite.adultsCount}
                      value={adultsAttending}
                      onChange={(e) =>
                        setAdultsAttending(parseInt(e.target.value))
                      }
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        fontSize: '1rem',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        fontFamily: 'system-ui'
                      }}
                    />
                  </div>
                  {invite.childrenCount > 0 && (
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#555', fontWeight: '500' }}>
                        Children (max {invite.childrenCount})
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={invite.childrenCount}
                        value={childrenAttending}
                        onChange={(e) =>
                          setChildrenAttending(parseInt(e.target.value))
                        }
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          fontSize: '1rem',
                          border: '2px solid #ddd',
                          borderRadius: '8px',
                          fontFamily: 'system-ui'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Dietary Requirements Card */}
              <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Dietary Requirements (optional)</h3>
                <textarea
                  value={dietaryRequirements}
                  onChange={(e) => setDietaryRequirements(e.target.value)}
                  placeholder="Please let us know of any dietary requirements..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    fontFamily: 'system-ui',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Meal Selection Card */}
              {invite.mealOptions.length > 0 && (
                <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>Meal Selection</h3>
                  <p style={{ color: '#7f8c8d', fontSize: '0.9rem', margin: '0 0 1.5rem 0' }}>
                    Please select meal preferences for each guest
                  </p>
                  {invite.guests.slice(0, adultsAttending + childrenAttending).map((guest) => {
                    const starterOptions = invite.mealOptions.filter(o => o.courseType === 'STARTER')
                    const mainOptions = invite.mealOptions.filter(o => o.courseType === 'MAIN')
                    const dessertOptions = invite.mealOptions.filter(o => o.courseType === 'DESSERT')

                    return (
                      <div key={guest.id} style={{ marginBottom: '1.5rem', padding: '1.5rem', background: '#f8f9fa', border: '2px solid #e9ecef', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#2c3e50', fontSize: '1.1rem' }}>{guest.name}</h4>

                        {starterOptions.length > 0 && (
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#555' }}>
                              Starter
                            </label>
                            <select
                              value={mealSelections[guest.id]?.STARTER || ''}
                              onChange={(e) => setMealSelections({
                                ...mealSelections,
                                [guest.id]: {
                                  ...mealSelections[guest.id],
                                  STARTER: e.target.value
                                }
                              })}
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                fontSize: '1rem',
                                border: '2px solid #ddd',
                                borderRadius: '8px',
                                background: 'white',
                                fontFamily: 'system-ui'
                              }}
                            >
                              <option value="">Select starter...</option>
                              {starterOptions.map(option => (
                                <option key={option.id} value={option.id}>
                                  {option.name}
                                  {option.description && ` - ${option.description}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {mainOptions.length > 0 && (
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#555' }}>
                              Main Course
                            </label>
                            <select
                              value={mealSelections[guest.id]?.MAIN || ''}
                              onChange={(e) => setMealSelections({
                                ...mealSelections,
                                [guest.id]: {
                                  ...mealSelections[guest.id],
                                  MAIN: e.target.value
                                }
                              })}
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                fontSize: '1rem',
                                border: '2px solid #ddd',
                                borderRadius: '8px',
                                background: 'white',
                                fontFamily: 'system-ui'
                              }}
                            >
                              <option value="">Select main course...</option>
                              {mainOptions.map(option => (
                                <option key={option.id} value={option.id}>
                                  {option.name}
                                  {option.description && ` - ${option.description}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {dessertOptions.length > 0 && (
                          <div style={{ marginBottom: '0' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#555' }}>
                              Dessert
                            </label>
                            <select
                              value={mealSelections[guest.id]?.DESSERT || ''}
                              onChange={(e) => setMealSelections({
                                ...mealSelections,
                                [guest.id]: {
                                  ...mealSelections[guest.id],
                                  DESSERT: e.target.value
                                }
                              })}
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                fontSize: '1rem',
                                border: '2px solid #ddd',
                                borderRadius: '8px',
                                background: 'white',
                                fontFamily: 'system-ui'
                              }}
                            >
                              <option value="">Select dessert...</option>
                              {dessertOptions.map(option => (
                                <option key={option.id} value={option.id}>
                                  {option.name}
                                  {option.description && ` - ${option.description}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Custom Questions Card */}
              {invite.customQuestions.length > 0 && (
                <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', color: '#2c3e50' }}>Additional Questions</h3>
                  {invite.customQuestions.map((question) => (
                    <div key={question.id} style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#555' }}>
                        {question.questionText}
                        {question.isRequired && <span style={{ color: '#dc3545' }}> *</span>}
                      </label>

                      {question.questionType === 'TEXT' && (
                        <textarea
                          value={questionResponses[question.id] || ''}
                          onChange={(e) => setQuestionResponses({
                            ...questionResponses,
                            [question.id]: e.target.value
                          })}
                          required={question.isRequired}
                          rows={3}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            fontSize: '1rem',
                            fontFamily: 'system-ui',
                            border: '2px solid #ddd',
                            borderRadius: '8px',
                            resize: 'vertical'
                          }}
                        />
                      )}

                      {question.questionType === 'SINGLE_CHOICE' && (
                        <select
                          value={questionResponses[question.id] || ''}
                          onChange={(e) => setQuestionResponses({
                            ...questionResponses,
                            [question.id]: e.target.value
                          })}
                          required={question.isRequired}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            fontSize: '1rem',
                            border: '2px solid #ddd',
                            borderRadius: '8px',
                            background: 'white',
                            fontFamily: 'system-ui'
                          }}
                        >
                          <option value="">Select an option...</option>
                          {question.options.map((option, index) => (
                            <option key={index} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      )}

                      {question.questionType === 'MULTIPLE_CHOICE' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
                          {question.options.map((option, index) => (
                            <label key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: '#555' }}>
                              <input
                                type="checkbox"
                                checked={(multipleChoiceSelections[question.id] || []).includes(option)}
                                onChange={(e) => {
                                  const current = multipleChoiceSelections[question.id] || []
                                  const updated = e.target.checked
                                    ? [...current, option]
                                    : current.filter(o => o !== option)
                                  setMultipleChoiceSelections({
                                    ...multipleChoiceSelections,
                                    [question.id]: updated
                                  })
                                }}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </>
        )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || isAttending === null}
            style={{
              width: '100%',
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              background: isAttending === null || submitting ? '#bdc3c7' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isAttending === null || submitting ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              boxShadow: isAttending === null || submitting ? 'none' : '0 2px 8px rgba(52, 152, 219, 0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!submitting && isAttending !== null) {
                e.currentTarget.style.background = '#2980b9'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting && isAttending !== null) {
                e.currentTarget.style.background = '#3498db'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(52, 152, 219, 0.3)'
              }
            }}
          >
            {submitting
              ? 'Submitting...'
              : invite.hasResponded
              ? 'Update RSVP'
              : 'Submit RSVP'}
          </button>
        </form>
      </div>
    </div>
  )
}
