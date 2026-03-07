'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import JSConfetti from 'js-confetti'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Guest {
  id: string
  name: string
  email: string
  isPlusOne: boolean
  isChild: boolean
  parentGuestId?: string
  isInviteLead: boolean
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
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [missingMealSelectionKeys, setMissingMealSelectionKeys] = useState<string[]>([])

  const jsConfetti = useRef<JSConfetti | null>(null)
  const successHeadingRef = useRef<HTMLHeadingElement | null>(null)

  // Form state
  const [isAttending, setIsAttending] = useState<boolean | null>(null)
  const [attendingGuests, setAttendingGuests] = useState<Array<{ guestId: string; name: string; isAdult: boolean }>>([])
  const [plusOneName, setPlusOneName] = useState('')
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

      // Initialize attending guests list
      const initialGuests = data.invite.guests.map((g: Guest) => ({
        guestId: g.id,
        name: g.name,
        isAdult: !g.isChild,
      }))
      setAttendingGuests(initialGuests)

      if (data.invite.hasResponded && data.invite.rsvp) {
        setIsAttending(data.invite.rsvp.isAttending)
        setDietaryRequirements(data.invite.rsvp.dietaryRequirements || '')
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

  useEffect(() => {
    jsConfetti.current = new JSConfetti()
  }, [])

  useEffect(() => {
    if (!submitted) return
    successHeadingRef.current?.focus()
  }, [submitted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationErrors([])
    setSubmitError(null)
    setMissingMealSelectionKeys([])

    const nextValidationErrors: string[] = []
    const nextMissingMealSelectionKeys: string[] = []

    if (isAttending === null) {
      nextValidationErrors.push('Please choose whether you are attending.')
    }

    if (isAttending && attendingGuests.length === 0) {
      nextValidationErrors.push('Select at least one guest who is attending.')
    }

    if (isAttending && plusOneName.trim() && !attendingGuests.some((g) => g.guestId === 'PLUS_ONE')) {
      nextValidationErrors.push('You entered a plus-one name. Select Add to include them.')
    }

    if (isAttending && invite) {
      const requiredCourseTypes = Array.from(new Set(invite.mealOptions.map((meal) => meal.courseType)))
      for (const guest of attendingGuests) {
        const guestSelections = mealSelections[guest.guestId] || {}
        for (const courseType of requiredCourseTypes) {
          if (!guestSelections[courseType]) {
            nextMissingMealSelectionKeys.push(`${guest.guestId}:${courseType}`)
            const courseLabel =
              courseType === 'STARTER' ? 'starter' : courseType === 'MAIN' ? 'main course' : 'dessert'
            nextValidationErrors.push(`Select a ${courseLabel} for ${guest.name}.`)
          }
        }
      }
    }

    if (isAttending && invite) {
      for (const question of invite.customQuestions) {
        if (!question.isRequired) continue
        if (question.questionType === 'MULTIPLE_CHOICE') {
          if ((multipleChoiceSelections[question.id] || []).length === 0) {
            nextValidationErrors.push(`Please answer required question: ${question.questionText}`)
          }
          continue
        }

        if (!(questionResponses[question.id] || '').trim()) {
          nextValidationErrors.push(`Please answer required question: ${question.questionText}`)
        }
      }
    }

    if (nextValidationErrors.length > 0) {
      setValidationErrors(nextValidationErrors)
      setMissingMealSelectionKeys(nextMissingMealSelectionKeys)
      return
    }

    setSubmitting(true)

    try {
      // Calculate counts from attending guests
      const adultsCount = isAttending ? attendingGuests.filter(g => g.isAdult).length : 0
      const childrenCount = isAttending ? attendingGuests.filter(g => !g.isAdult).length : 0

      const mealSelectionsArray = isAttending && invite
        ? Object.entries(mealSelections)
            .filter(([guestId]) =>
              attendingGuests.some((attendingGuest) => attendingGuest.guestId === guestId)
            )
            .flatMap(([guestId, courses]) =>
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

      const plusOneGuest = attendingGuests.find(g => g.guestId === 'PLUS_ONE')

      const response = await fetch(`/api/rsvp/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isAttending,
          adultsAttending: adultsCount,
          childrenAttending: childrenCount,
          dietaryRequirements: isAttending ? dietaryRequirements : undefined,
          plusOneName: plusOneGuest?.name,
          mealSelections: mealSelectionsArray,
          questionResponses: questionResponsesArray,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        const message = data.error || 'Failed to submit RSVP'
        const validationMessages = Array.isArray(data.errors)
          ? data.errors
              .map((item: unknown) => (typeof item === 'string' ? item.trim() : ''))
              .filter((item: string) => item.length > 0)
          : []

        if (validationMessages.length > 0) {
          setValidationErrors(validationMessages)
          setSubmitError('Please review the fields below and try again.')
          return
        }

        throw new Error(message)
      }

      setSubmitted(true)

      // Celebrate with confetti! 🎉
      if (jsConfetti.current) {
        jsConfetti.current.addConfetti({
          confettiColors: [
            '#c15b3b',
            '#2f6f5e',
            '#f0b558',
            '#4a9b74',
          ],
          confettiNumber: 500,
        })
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit RSVP')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMealSelection = (guestId: string, courseType: string, mealOptionId: string) => {
    setValidationErrors([])
    setSubmitError(null)
    setMissingMealSelectionKeys((prev) =>
      prev.filter((key) => key !== `${guestId}:${courseType}`)
    )

    setMealSelections((prev) => ({
      ...prev,
      [guestId]: {
        ...prev[guestId],
        [courseType]: mealOptionId,
      },
    }))
  }

  const clearFeedbackState = () => {
    setValidationErrors([])
    setSubmitError(null)
  }

  const toggleMultipleChoice = (questionId: string, option: string) => {
    clearFeedbackState()
    setMultipleChoiceSelections((prev) => {
      const current = prev[questionId] || []
      const isSelected = current.includes(option)
      return {
        ...prev,
        [questionId]: isSelected
          ? current.filter((o) => o !== option)
          : [...current, option],
      }
    })
  }

  const toggleGuest = (guestId: string) => {
    clearFeedbackState()

    const isSelected = attendingGuests.some((guest) => guest.guestId === guestId)
    if (isSelected) {
      setMealSelections((prev) => {
        if (!prev[guestId]) return prev
        const updated = { ...prev }
        delete updated[guestId]
        return updated
      })
      setMissingMealSelectionKeys((prev) =>
        prev.filter((key) => !key.startsWith(`${guestId}:`))
      )
    }

    setAttendingGuests((prev) => {
      const isAttending = prev.some(g => g.guestId === guestId)
      if (isAttending) {
        return prev.filter(g => g.guestId !== guestId)
      } else {
        const guest = invite?.guests.find(g => g.id === guestId)
        if (guest) {
          return [...prev, {
            guestId: guest.id,
            name: guest.name,
            isAdult: !guest.isChild
          }]
        }
        return prev
      }
    })
  }

  const addPlusOne = () => {
    if (!plusOneName.trim() || !invite) return
    clearFeedbackState()
    setAttendingGuests((prev) => [...prev, {
      guestId: 'PLUS_ONE',
      name: plusOneName,
      isAdult: true,
    }])
    setPlusOneName('')
  }

  const removePlusOne = () => {
    clearFeedbackState()
    setAttendingGuests((prev) => prev.filter(g => g.guestId !== 'PLUS_ONE'))
    setMissingMealSelectionKeys((prev) =>
      prev.filter((key) => !key.startsWith('PLUS_ONE:'))
    )
    setMealSelections((prev) => {
      const updated = { ...prev }
      delete updated['PLUS_ONE']
      return updated
    })
  }

  if (loading) {
    return (
      <div className="hero-wash min-h-screen flex items-center justify-center p-4">
        <LoadingSpinner text="Loading your invitation..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="hero-wash min-h-screen flex items-center justify-center p-4">
        <Card className="surface-panel w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Invitation not available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="hero-wash min-h-screen flex items-center justify-center p-4">
        <Card className="surface-panel w-full max-w-lg text-center" role="status" aria-live="polite">
          <CardHeader>
            <CardTitle
              ref={successHeadingRef}
              tabIndex={-1}
              className="text-2xl sm:text-3xl"
            >
              Thanks, you&apos;re all set
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">
              Your RSVP has been {invite?.hasResponded ? 'updated' : 'submitted'} successfully.
            </p>
            {isAttending ? (
              <p className="text-lg text-success font-semibold">
                We look forward to seeing you at the wedding!
              </p>
            ) : (
              <p className="text-lg text-muted-foreground">
                We&apos;re sorry you can&apos;t make it.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invite) {
    return null
  }

  const displayName = invite.groupName || invite.guests[0]?.name || 'Guest'
  const starters = invite.mealOptions.filter((m) => m.courseType === 'STARTER')
  const mains = invite.mealOptions.filter((m) => m.courseType === 'MAIN')
  const desserts = invite.mealOptions.filter((m) => m.courseType === 'DESSERT')
  const hasPlusOneAdded = attendingGuests.some((g) => g.guestId === 'PLUS_ONE')
  const requiredCourseTypes = Array.from(new Set(invite.mealOptions.map((meal) => meal.courseType)))
  const missingMealSelectionsCount = isAttending
    ? attendingGuests.reduce((count, guest) => {
        const guestSelections = mealSelections[guest.guestId] || {}
        return (
          count +
          requiredCourseTypes.reduce(
            (guestCount, courseType) => guestCount + (guestSelections[courseType] ? 0 : 1),
            0
          )
        )
      }, 0)
    : 0
  const missingRequiredAnswersCount = isAttending
    ? invite.customQuestions.reduce((count, question) => {
        if (!question.isRequired) return count
        if (question.questionType === 'MULTIPLE_CHOICE') {
          return count + ((multipleChoiceSelections[question.id] || []).length === 0 ? 1 : 0)
        }

        return count + ((questionResponses[question.id] || '').trim() ? 0 : 1)
      }, 0)
    : 0
  const pendingDetailsCount = missingMealSelectionsCount + missingRequiredAnswersCount
  const formStatusText =
    isAttending === null
      ? 'Start by telling us if you can make it.'
      : isAttending === false
        ? 'You can submit your response now.'
        : attendingGuests.length === 0
          ? 'Choose which guests are attending.'
          : pendingDetailsCount > 0
            ? `${pendingDetailsCount} detail${pendingDetailsCount === 1 ? '' : 's'} left before you can submit.`
            : 'Everything looks ready to submit.'

  return (
    <div className="hero-wash min-h-screen p-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-2xl space-y-4 sm:space-y-6">
        <Card className="surface-panel text-center">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl">Wedding RSVP</CardTitle>
            <CardDescription className="text-lg">Guest: {displayName}</CardDescription>
            <div className="pt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground sm:text-sm sm:tracking-[0.12em]">
              {formStatusText}
            </div>
          </CardHeader>
        </Card>

        {invite.hasResponded && (
          <Alert>
            <AlertDescription>
              <div className="flex items-center gap-2">
                <span>ℹ️</span>
                <strong>You have already responded to this invitation.</strong>
              </div>
              <p className="text-sm mt-1">You can update your RSVP below.</p>
            </AlertDescription>
          </Alert>
        )}

        {(validationErrors.length > 0 || submitError) && (
          <Alert variant="destructive">
            <AlertDescription>
              {submitError && <p>{submitError}</p>}
              {validationErrors.length > 0 && (
                <ul className="list-disc pl-5">
                  {validationErrors.map((message, idx) => (
                    <li key={`${message}-${idx}`}>{message}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}

        {isAttending && (
          <Alert>
            <AlertDescription>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant={attendingGuests.length > 0 ? 'default' : 'secondary'}>
                  Guests: {attendingGuests.length}
                </Badge>
                {invite.plusOneAllowed && (
                  <Badge variant={hasPlusOneAdded ? 'default' : 'secondary'}>
                    Plus one: {hasPlusOneAdded ? 'Added' : 'Optional'}
                  </Badge>
                )}
                <Badge
                  variant={
                    pendingDetailsCount === 0 && validationErrors.length === 0
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {pendingDetailsCount === 0 && validationErrors.length === 0
                    ? 'Ready to submit'
                    : `${pendingDetailsCount} detail${pendingDetailsCount === 1 ? '' : 's'} remaining`}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Are you attending?</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <Button
                type="button"
                size="lg"
                variant={isAttending === true ? 'default' : 'outline'}
                className={isAttending === true ? 'bg-success hover:bg-success/90' : ''}
                onClick={() => {
                  setIsAttending(true)
                  clearFeedbackState()
                  setMissingMealSelectionKeys([])
                }}
              >
                Yes, I&apos;ll be there
              </Button>
              <Button
                type="button"
                size="lg"
                variant={isAttending === false ? 'destructive' : 'outline'}
                onClick={() => {
                  setIsAttending(false)
                  clearFeedbackState()
                  setMissingMealSelectionKeys([])
                }}
              >
                Sorry, I can&apos;t make it
              </Button>
            </CardContent>
          </Card>

          {isAttending && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>2. Who is attending?</CardTitle>
                  <CardDescription>
                    {invite.groupName ?
                      'Select which guests from your group will attend' :
                      invite.plusOneAllowed ?
                        'You can bring a plus one' :
                        'Invitation for one person'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Main guest(s) */}
                  {invite.guests.map((guest) => {
                    const isSelected = attendingGuests.some(g => g.guestId === guest.id)
                    return (
                      <div key={guest.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={guest.id}
                          checked={isSelected}
                          onCheckedChange={() => toggleGuest(guest.id)}
                        />
                        <Label htmlFor={guest.id} className="font-normal cursor-pointer">
                          {guest.name}
                        </Label>
                      </div>
                    )
                  })}

                  {/* Plus one section */}
                  {invite.plusOneAllowed && (
                    <>
                      <Separator />
                      {attendingGuests.some(g => g.guestId === 'PLUS_ONE') ? (
                        <div className="space-y-2">
                          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary">Plus One</Badge>
                              <span className="text-sm font-medium">
                                {attendingGuests.find(g => g.guestId === 'PLUS_ONE')?.name}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={removePlusOne}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                            <Label htmlFor="plusOne">Add plus-one guest (optional)</Label>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                              id="plusOne"
                              type="text"
                              placeholder="Enter guest name"
                              value={plusOneName}
                              onChange={(e) => setPlusOneName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  addPlusOne()
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={addPlusOne}
                              disabled={!plusOneName.trim()}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="text-sm text-muted-foreground pt-2">
                    Total attending: {attendingGuests.length} {attendingGuests.length === 1 ? 'guest' : 'guests'}
                  </div>
                </CardContent>
              </Card>

              {(starters.length > 0 || mains.length > 0 || desserts.length > 0) && attendingGuests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Meal selections</CardTitle>
                    <CardDescription>Select menu choices for each attending guest.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {attendingGuests.map((guest) => (
                      <div key={guest.guestId} className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{guest.name}</Badge>
                        </div>

                        {starters.length > 0 && (
                          <div className="space-y-2">
                            <Label>Starter</Label>
                          <Select
                              value={mealSelections[guest.guestId]?.STARTER}
                              onValueChange={(value) => handleMealSelection(guest.guestId, 'STARTER', value)}
                            >
                              <SelectTrigger
                                className={
                                  missingMealSelectionKeys.includes(`${guest.guestId}:STARTER`)
                                    ? 'border-destructive focus:ring-destructive'
                                    : ''
                                }
                              >
                                <SelectValue placeholder="Select starter" />
                              </SelectTrigger>
                              <SelectContent>
                                {starters.map((meal) => (
                                  <SelectItem key={meal.id} value={meal.id}>
                                    {meal.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {mains.length > 0 && (
                          <div className="space-y-2">
                            <Label>Main Course</Label>
                          <Select
                              value={mealSelections[guest.guestId]?.MAIN}
                              onValueChange={(value) => handleMealSelection(guest.guestId, 'MAIN', value)}
                            >
                              <SelectTrigger
                                className={
                                  missingMealSelectionKeys.includes(`${guest.guestId}:MAIN`)
                                    ? 'border-destructive focus:ring-destructive'
                                    : ''
                                }
                              >
                                <SelectValue placeholder="Select main" />
                              </SelectTrigger>
                              <SelectContent>
                                {mains.map((meal) => (
                                  <SelectItem key={meal.id} value={meal.id}>
                                    {meal.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {desserts.length > 0 && (
                          <div className="space-y-2">
                            <Label>Dessert</Label>
                          <Select
                              value={mealSelections[guest.guestId]?.DESSERT}
                              onValueChange={(value) => handleMealSelection(guest.guestId, 'DESSERT', value)}
                            >
                              <SelectTrigger
                                className={
                                  missingMealSelectionKeys.includes(`${guest.guestId}:DESSERT`)
                                    ? 'border-destructive focus:ring-destructive'
                                    : ''
                                }
                              >
                                <SelectValue placeholder="Select dessert" />
                              </SelectTrigger>
                              <SelectContent>
                                {desserts.map((meal) => (
                                  <SelectItem key={meal.id} value={meal.id}>
                                    {meal.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {guest.guestId !== attendingGuests[attendingGuests.length - 1].guestId && (
                          <Separator />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {invite.customQuestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional questions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {invite.customQuestions.map((question) => (
                      <div key={question.id} className="space-y-2">
                        <Label>
                          {question.questionText}
                          {question.isRequired && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              Required
                            </Badge>
                          )}
                        </Label>

                        {question.questionType === 'TEXT' && (
                          <Textarea
                            value={questionResponses[question.id] || ''}
                            onChange={(e) => {
                              clearFeedbackState()
                              setQuestionResponses({
                                ...questionResponses,
                                [question.id]: e.target.value,
                              })
                            }}
                            required={question.isRequired}
                          />
                        )}

                        {question.questionType === 'SINGLE_CHOICE' && (
                          <Select
                            value={questionResponses[question.id]}
                            onValueChange={(value) => {
                              clearFeedbackState()
                              setQuestionResponses({
                                ...questionResponses,
                                [question.id]: value,
                              })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              {question.options.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {question.questionType === 'MULTIPLE_CHOICE' && (
                          <div className="space-y-2">
                            {question.options.map((option) => (
                              <div key={option} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${question.id}-${option}`}
                                  checked={(multipleChoiceSelections[question.id] || []).includes(option)}
                                  onCheckedChange={() => toggleMultipleChoice(question.id, option)}
                                />
                                <Label
                                  htmlFor={`${question.id}-${option}`}
                                  className="font-normal cursor-pointer"
                                >
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Dietary requirements</CardTitle>
                  <CardDescription>
                    Let us know about any allergies or dietary requirements.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={dietaryRequirements}
                    onChange={(e) => setDietaryRequirements(e.target.value)}
                    placeholder="For example: vegetarian, gluten-free, nut allergy"
                    rows={3}
                  />
                </CardContent>
              </Card>
            </>
          )}

          <Card className="border-border/70 bg-muted/35">
            <CardContent className="pt-6">
              <Button
                type="submit"
                disabled={submitting}
                size="lg"
                className="w-full"
                aria-busy={submitting}
              >
                {submitting ? 'Saving your RSVP...' : 'Submit RSVP'}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
