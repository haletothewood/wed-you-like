'use client'

import { useState, useEffect, useCallback } from 'react'

interface CustomQuestion {
  id: string
  questionText: string
  questionType: 'TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'
  options: string[]
  isRequired: boolean
  displayOrder: number
}

const questionTypeLabels = {
  TEXT: 'Text',
  SINGLE_CHOICE: 'Single Choice',
  MULTIPLE_CHOICE: 'Multiple Choice',
}

export default function CustomQuestionsPage() {
  const [questions, setQuestions] = useState<CustomQuestion[]>([])
  const [loading, setLoading] = useState(true)

  const [questionText, setQuestionText] = useState('')
  const [questionType, setQuestionType] = useState<
    'TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'
  >('TEXT')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [isRequired, setIsRequired] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchQuestions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/custom-questions')
      const data = await response.json()
      setQuestions(data.questions || [])
    } catch {
      alert('Failed to load custom questions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const handleAddOption = () => {
    setOptions([...options, ''])
  }

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const filteredOptions =
        questionType !== 'TEXT' ? options.filter((o) => o.trim()) : []

      if (
        (questionType === 'SINGLE_CHOICE' ||
          questionType === 'MULTIPLE_CHOICE') &&
        filteredOptions.length < 2
      ) {
        alert('Choice questions must have at least 2 options')
        setSubmitting(false)
        return
      }

      const nextDisplayOrder =
        questions.length > 0
          ? Math.max(...questions.map((q) => q.displayOrder)) + 1
          : 0

      const response = await fetch('/api/admin/custom-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText,
          questionType,
          options: filteredOptions,
          isRequired,
          displayOrder: nextDisplayOrder,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create question')
      }

      setQuestionText('')
      setQuestionType('TEXT')
      setOptions(['', ''])
      setIsRequired(false)
      await fetchQuestions()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create question')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return

    try {
      const response = await fetch(`/api/admin/custom-questions/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete question')
      }

      await fetchQuestions()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete question')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <p>Loading custom questions...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Custom Questions Management</h1>

      <div
        style={{
          marginTop: '2rem',
          padding: '1.5rem',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
        }}
      >
        <h2>Add New Question</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Question Text *
            </label>
            <input
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              required
              placeholder="e.g., What is your favorite memory with the couple?"
              style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Question Type
            </label>
            <select
              value={questionType}
              onChange={(e) =>
                setQuestionType(
                  e.target.value as 'TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'
                )
              }
              required
              style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
            >
              <option value="TEXT">Text (open-ended)</option>
              <option value="SINGLE_CHOICE">Single Choice</option>
              <option value="MULTIPLE_CHOICE">Multiple Choice</option>
            </select>
          </div>

          {(questionType === 'SINGLE_CHOICE' ||
            questionType === 'MULTIPLE_CHOICE') && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Options
              </label>
              {options.map((option, index) => (
                <div
                  key={index}
                  style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}
                >
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    style={{ flex: 1, padding: '0.5rem', fontSize: '1rem' }}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddOption}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                }}
              >
                Add Option
              </button>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
              />
              Required
            </label>
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
            {submitting ? 'Adding...' : 'Add Question'}
          </button>
        </form>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Current Questions</h2>
        {questions.length === 0 ? (
          <p style={{ color: '#666' }}>No custom questions yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {questions.map((question) => (
              <div
                key={question.id}
                style={{
                  padding: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: 'white',
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
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <h3 style={{ margin: 0 }}>{question.questionText}</h3>
                      {question.isRequired && (
                        <span
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            background: '#dc3545',
                            color: 'white',
                            borderRadius: '4px',
                          }}
                        >
                          Required
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                      Type: {questionTypeLabels[question.questionType]}
                    </p>
                    {question.options.length > 0 && (
                      <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#666' }}>
                        {question.options.map((option, index) => (
                          <li key={index}>{option}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(question.id)}
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
