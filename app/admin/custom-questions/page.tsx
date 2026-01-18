'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
    return <LoadingSpinner text="Loading custom questions..." />
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Custom Questions Management"
        description="Add custom questions for guests to answer with their RSVP"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Question</CardTitle>
          <CardDescription>
            Create text, single choice, or multiple choice questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="questionText">
                Question Text <span className="text-destructive">*</span>
              </Label>
              <Input
                id="questionText"
                type="text"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                required
                placeholder="e.g., What is your favorite memory with the couple?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionType">Question Type</Label>
              <Select
                value={questionType}
                onValueChange={(value) =>
                  setQuestionType(
                    value as 'TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'
                  )
                }
              >
                <SelectTrigger id="questionType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT">Text (open-ended)</SelectItem>
                  <SelectItem value="SINGLE_CHOICE">Single Choice</SelectItem>
                  <SelectItem value="MULTIPLE_CHOICE">
                    Multiple Choice
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(questionType === 'SINGLE_CHOICE' ||
              questionType === 'MULTIPLE_CHOICE') && (
              <div className="space-y-2">
                <Label>Options</Label>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="text"
                        value={option}
                        onChange={(e) =>
                          handleOptionChange(index, e.target.value)
                        }
                        placeholder={`Option ${index + 1}`}
                        className="flex-1"
                      />
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveOption(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddOption}
                  >
                    Add Option
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRequired"
                checked={isRequired}
                onCheckedChange={(checked) => setIsRequired(checked as boolean)}
              />
              <Label htmlFor="isRequired" className="font-normal cursor-pointer">
                Required
              </Label>
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Question'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Current Questions</h2>
        {questions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No custom questions yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {questions.map((question) => (
              <Card key={question.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 flex-wrap">
                        {question.questionText}
                        {question.isRequired && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Type: {questionTypeLabels[question.questionType]}
                      </CardDescription>
                      {question.options.length > 0 && (
                        <ul className="mt-2 ml-6 list-disc text-sm text-muted-foreground">
                          {question.options.map((option, index) => (
                            <li key={index}>{option}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(question.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
