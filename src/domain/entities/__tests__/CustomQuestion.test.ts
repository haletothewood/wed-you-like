import { describe, it, expect } from 'vitest'
import { CustomQuestion, QuestionType } from '../CustomQuestion'

describe('CustomQuestion', () => {
  describe('create', () => {
    it('should create a text question', () => {
      const question = CustomQuestion.create({
        questionText: 'What is your favorite memory with the couple?',
        questionType: 'TEXT',
        isRequired: true,
        displayOrder: 1,
      })

      expect(question.id).toBeDefined()
      expect(question.questionText).toBe(
        'What is your favorite memory with the couple?'
      )
      expect(question.questionType).toBe('TEXT')
      expect(question.options).toEqual([])
      expect(question.isRequired).toBe(true)
      expect(question.displayOrder).toBe(1)
      expect(question.createdAt).toBeInstanceOf(Date)
      expect(question.updatedAt).toBeInstanceOf(Date)
    })

    it('should create a single choice question with options', () => {
      const question = CustomQuestion.create({
        questionText: 'Which drink would you prefer?',
        questionType: 'SINGLE_CHOICE',
        options: ['Red Wine', 'White Wine', 'Beer', 'Soft Drink'],
        isRequired: false,
        displayOrder: 2,
      })

      expect(question.questionType).toBe('SINGLE_CHOICE')
      expect(question.options).toEqual([
        'Red Wine',
        'White Wine',
        'Beer',
        'Soft Drink',
      ])
      expect(question.isRequired).toBe(false)
    })

    it('should create a multiple choice question', () => {
      const question = CustomQuestion.create({
        questionText: 'Select your preferred activities',
        questionType: 'MULTIPLE_CHOICE',
        options: ['Dancing', 'Photo Booth', 'Games', 'Cocktails'],
        isRequired: false,
        displayOrder: 3,
      })

      expect(question.questionType).toBe('MULTIPLE_CHOICE')
      expect(question.options).toHaveLength(4)
    })

    it('should throw error if question text is empty', () => {
      expect(() =>
        CustomQuestion.create({
          questionText: '',
          questionType: 'TEXT',
          isRequired: true,
          displayOrder: 1,
        })
      ).toThrow('Question text is required')
    })

    it('should throw error if question text is too long', () => {
      const longText = 'a'.repeat(501)
      expect(() =>
        CustomQuestion.create({
          questionText: longText,
          questionType: 'TEXT',
          isRequired: false,
          displayOrder: 1,
        })
      ).toThrow('Question text must be 500 characters or less')
    })

    it('should throw error if SINGLE_CHOICE has no options', () => {
      expect(() =>
        CustomQuestion.create({
          questionText: 'Pick one',
          questionType: 'SINGLE_CHOICE',
          isRequired: false,
          displayOrder: 1,
        })
      ).toThrow('Single choice questions must have at least 2 options')
    })

    it('should throw error if SINGLE_CHOICE has less than 2 options', () => {
      expect(() =>
        CustomQuestion.create({
          questionText: 'Pick one',
          questionType: 'SINGLE_CHOICE',
          options: ['Only One'],
          isRequired: false,
          displayOrder: 1,
        })
      ).toThrow('Single choice questions must have at least 2 options')
    })

    it('should throw error if MULTIPLE_CHOICE has no options', () => {
      expect(() =>
        CustomQuestion.create({
          questionText: 'Pick many',
          questionType: 'MULTIPLE_CHOICE',
          isRequired: false,
          displayOrder: 1,
        })
      ).toThrow('Multiple choice questions must have at least 2 options')
    })

    it('should throw error for invalid question type', () => {
      expect(() =>
        CustomQuestion.create({
          questionText: 'Test',
          questionType: 'INVALID' as QuestionType,
          isRequired: false,
          displayOrder: 1,
        })
      ).toThrow('Invalid question type')
    })

    it('should throw error if display order is negative', () => {
      expect(() =>
        CustomQuestion.create({
          questionText: 'Test',
          questionType: 'TEXT',
          isRequired: false,
          displayOrder: -1,
        })
      ).toThrow('Display order must be a positive number')
    })
  })

  describe('update', () => {
    it('should update question text and required status', () => {
      const question = CustomQuestion.create({
        questionText: 'Old question',
        questionType: 'TEXT',
        isRequired: false,
        displayOrder: 1,
      })

      question.update({
        questionText: 'Updated question',
        isRequired: true,
      })

      expect(question.questionText).toBe('Updated question')
      expect(question.isRequired).toBe(true)
    })

    it('should update options for choice questions', () => {
      const question = CustomQuestion.create({
        questionText: 'Pick one',
        questionType: 'SINGLE_CHOICE',
        options: ['A', 'B'],
        isRequired: false,
        displayOrder: 1,
      })

      question.update({
        options: ['Option 1', 'Option 2', 'Option 3'],
      })

      expect(question.options).toEqual(['Option 1', 'Option 2', 'Option 3'])
    })

    it('should update display order', () => {
      const question = CustomQuestion.create({
        questionText: 'Test',
        questionType: 'TEXT',
        isRequired: false,
        displayOrder: 1,
      })

      question.update({ displayOrder: 5 })

      expect(question.displayOrder).toBe(5)
    })
  })
})
