'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

  const [courseType, setCourseType] = useState<'STARTER' | 'MAIN' | 'DESSERT'>('MAIN')
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

  const handleToggleAvailability = async (id: string, isAvailable: boolean) => {
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
    return <LoadingSpinner text="Loading meal options..." />
  }

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Meal Options Management"
        description="Configure menu options for starters, mains, and desserts"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Meal Option</CardTitle>
          <CardDescription>Create a new menu item for guests to choose from</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="courseType">Course Type</Label>
              <Select
                value={courseType}
                onValueChange={(value) =>
                  setCourseType(value as 'STARTER' | 'MAIN' | 'DESSERT')
                }
              >
                <SelectTrigger id="courseType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STARTER">Starter</SelectItem>
                  <SelectItem value="MAIN">Main Course</SelectItem>
                  <SelectItem value="DESSERT">Dessert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g., Grilled Salmon"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the meal..."
                rows={3}
              />
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Meal Option'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {(['STARTER', 'MAIN', 'DESSERT'] as const).map((course) => (
          <div key={course}>
            <h2 className="text-2xl font-bold mb-4">{courseTypeLabels[course]}</h2>
            {groupedOptions[course].length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No {courseTypeLabels[course].toLowerCase()} options yet
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {groupedOptions[course].map((option) => (
                  <Card
                    key={option.id}
                    className={!option.isAvailable ? 'opacity-60' : ''}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            {option.name}
                            <Badge variant={option.isAvailable ? 'default' : 'secondary'}>
                              {option.isAvailable ? 'Available' : 'Unavailable'}
                            </Badge>
                          </CardTitle>
                          {option.description && (
                            <CardDescription className="mt-2">
                              {option.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant={option.isAvailable ? 'outline' : 'default'}
                            size="sm"
                            onClick={() =>
                              handleToggleAvailability(option.id, option.isAvailable)
                            }
                          >
                            {option.isAvailable ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(option.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
            {course !== 'DESSERT' && <Separator className="mt-6" />}
          </div>
        ))}
      </div>
    </div>
  )
}
