import { describe, it, expect } from 'vitest'
import { MealOption, CourseType } from '../MealOption'

describe('MealOption', () => {
  describe('create', () => {
    it('should create a valid meal option', () => {
      const mealOption = MealOption.create({
        courseType: 'MAIN',
        name: 'Grilled Salmon',
        description: 'Fresh Atlantic salmon with seasonal vegetables',
      })

      expect(mealOption.id).toBeDefined()
      expect(mealOption.courseType).toBe('MAIN')
      expect(mealOption.name).toBe('Grilled Salmon')
      expect(mealOption.description).toBe(
        'Fresh Atlantic salmon with seasonal vegetables'
      )
      expect(mealOption.isAvailable).toBe(true)
      expect(mealOption.createdAt).toBeInstanceOf(Date)
      expect(mealOption.updatedAt).toBeInstanceOf(Date)
    })

    it('should create a meal option without description', () => {
      const mealOption = MealOption.create({
        courseType: 'STARTER',
        name: 'Caesar Salad',
      })

      expect(mealOption.name).toBe('Caesar Salad')
      expect(mealOption.description).toBeNull()
    })

    it('should throw error if name is empty', () => {
      expect(() =>
        MealOption.create({
          courseType: 'DESSERT',
          name: '',
        })
      ).toThrow('Meal option name is required')
    })

    it('should throw error if name is too long', () => {
      const longName = 'a'.repeat(201)
      expect(() =>
        MealOption.create({
          courseType: 'MAIN',
          name: longName,
        })
      ).toThrow('Meal option name must be 200 characters or less')
    })

    it('should throw error if description is too long', () => {
      const longDescription = 'a'.repeat(1001)
      expect(() =>
        MealOption.create({
          courseType: 'STARTER',
          name: 'Soup',
          description: longDescription,
        })
      ).toThrow('Description must be 1000 characters or less')
    })

    it('should throw error for invalid course type', () => {
      expect(() =>
        MealOption.create({
          courseType: 'INVALID' as CourseType,
          name: 'Test Meal',
        })
      ).toThrow('Invalid course type')
    })
  })

  describe('update', () => {
    it('should update meal option name and description', () => {
      const mealOption = MealOption.create({
        courseType: 'MAIN',
        name: 'Chicken',
      })

      mealOption.update({
        name: 'Roasted Chicken',
        description: 'Free-range roasted chicken',
      })

      expect(mealOption.name).toBe('Roasted Chicken')
      expect(mealOption.description).toBe('Free-range roasted chicken')
    })

    it('should update only name if description not provided', () => {
      const mealOption = MealOption.create({
        courseType: 'DESSERT',
        name: 'Cake',
        description: 'Chocolate cake',
      })

      mealOption.update({ name: 'Chocolate Fudge Cake' })

      expect(mealOption.name).toBe('Chocolate Fudge Cake')
      expect(mealOption.description).toBe('Chocolate cake')
    })
  })

  describe('setAvailability', () => {
    it('should mark meal option as unavailable', () => {
      const mealOption = MealOption.create({
        courseType: 'STARTER',
        name: 'Soup',
      })

      mealOption.setAvailability(false)

      expect(mealOption.isAvailable).toBe(false)
    })

    it('should mark meal option as available', () => {
      const mealOption = MealOption.create({
        courseType: 'MAIN',
        name: 'Steak',
      })

      mealOption.setAvailability(false)
      mealOption.setAvailability(true)

      expect(mealOption.isAvailable).toBe(true)
    })
  })
})
