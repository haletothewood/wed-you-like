import { NextResponse } from 'next/server'
import { db } from '@/infrastructure/database/connection'
import { mealSelections, mealOptions } from '@/infrastructure/database/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    // Get all meal selections with meal option details
    const allMealSelections = await db
      .select({
        mealOptionId: mealSelections.mealOptionId,
        courseType: mealSelections.courseType,
        mealOptionName: mealOptions.name,
        mealOptionDescription: mealOptions.description,
      })
      .from(mealSelections)
      .leftJoin(mealOptions, eq(mealSelections.mealOptionId, mealOptions.id))

    // Group meal selections by meal option
    const mealCounts = allMealSelections.reduce((acc, selection) => {
      const key = selection.mealOptionId
      if (!acc[key]) {
        acc[key] = {
          name: selection.mealOptionName || 'Unknown',
          courseType: selection.courseType,
          description: selection.mealOptionDescription || '',
          count: 0,
        }
      }
      acc[key].count++
      return acc
    }, {} as Record<string, { name: string; courseType: string; description: string; count: number }>)

    // Sort by course type and count
    const sortedMealCounts = Object.values(mealCounts).sort((a, b) => {
      const courseOrder = { STARTER: 1, MAIN: 2, DESSERT: 3 }
      const courseCompare = courseOrder[a.courseType as keyof typeof courseOrder] - courseOrder[b.courseType as keyof typeof courseOrder]
      if (courseCompare !== 0) return courseCompare
      return b.count - a.count
    })

    // Build CSV
    const rows: string[] = []
    rows.push('Course Type,Meal Option,Description,Guest Count')

    for (const item of sortedMealCounts) {
      const courseLabel = item.courseType === 'STARTER' ? 'Starter' :
                         item.courseType === 'MAIN' ? 'Main Course' : 'Dessert'
      const row = [
        courseLabel,
        `"${item.name}"`,
        `"${item.description}"`,
        item.count.toString(),
      ].join(',')
      rows.push(row)
    }

    // Add totals by course
    rows.push('')
    rows.push('Summary by Course')
    const totals = { STARTER: 0, MAIN: 0, DESSERT: 0 }
    for (const item of sortedMealCounts) {
      totals[item.courseType as keyof typeof totals] += item.count
    }
    rows.push(`Starters,${totals.STARTER}`)
    rows.push(`Main Courses,${totals.MAIN}`)
    rows.push(`Desserts,${totals.DESSERT}`)

    const csv = rows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="meal-counts-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting meal counts:', error)
    return NextResponse.json(
      { error: 'Failed to export meal counts' },
      { status: 500 }
    )
  }
}
