import { describe, it, expect } from 'vitest'
import { WeddingSettings } from '../WeddingSettings'

describe('WeddingSettings Entity', () => {
  describe('creating wedding settings', () => {
    it('should create wedding settings with all required fields', () => {
      const settings = WeddingSettings.create({
        partner1Name: 'John',
        partner2Name: 'David',
        weddingDate: 'Saturday, June 15th, 2024',
        weddingTime: '4:00 PM',
        venueName: 'The Grand Ballroom',
        venueAddress: '123 Main St, City, State 12345',
      })

      expect(settings.id).toBeDefined()
      expect(settings.partner1Name).toBe('John')
      expect(settings.partner2Name).toBe('David')
      expect(settings.weddingDate).toBe('Saturday, June 15th, 2024')
      expect(settings.weddingTime).toBe('4:00 PM')
      expect(settings.venueName).toBe('The Grand Ballroom')
      expect(settings.venueAddress).toBe('123 Main St, City, State 12345')
      expect(settings.dressCode).toBeUndefined()
      expect(settings.rsvpDeadline).toBeUndefined()
      expect(settings.registryUrl).toBeUndefined()
      expect(settings.additionalInfo).toBeUndefined()
    })

    it('should create wedding settings with optional fields', () => {
      const settings = WeddingSettings.create({
        partner1Name: 'John',
        partner2Name: 'David',
        weddingDate: 'Saturday, June 15th, 2024',
        weddingTime: '4:00 PM',
        venueName: 'The Grand Ballroom',
        venueAddress: '123 Main St, City, State 12345',
        dressCode: 'Black Tie',
        rsvpDeadline: 'May 1st, 2024',
        registryUrl: 'https://registry.example.com',
        additionalInfo: 'Additional parking information',
      })

      expect(settings.dressCode).toBe('Black Tie')
      expect(settings.rsvpDeadline).toBe('May 1st, 2024')
      expect(settings.registryUrl).toBe('https://registry.example.com')
      expect(settings.additionalInfo).toBe('Additional parking information')
    })
  })

  describe('validation', () => {
    it('should require partner1Name', () => {
      expect(() => {
        WeddingSettings.create({
          partner1Name: '',
          partner2Name: 'David',
          weddingDate: 'Saturday, June 15th, 2024',
          weddingTime: '4:00 PM',
          venueName: 'The Grand Ballroom',
          venueAddress: '123 Main St, City, State 12345',
        })
      }).toThrow('Partner 1 name is required')
    })

    it('should require partner2Name', () => {
      expect(() => {
        WeddingSettings.create({
          partner1Name: 'John',
          partner2Name: '',
          weddingDate: 'Saturday, June 15th, 2024',
          weddingTime: '4:00 PM',
          venueName: 'The Grand Ballroom',
          venueAddress: '123 Main St, City, State 12345',
        })
      }).toThrow('Partner 2 name is required')
    })

    it('should require weddingDate', () => {
      expect(() => {
        WeddingSettings.create({
          partner1Name: 'John',
          partner2Name: 'David',
          weddingDate: '',
          weddingTime: '4:00 PM',
          venueName: 'The Grand Ballroom',
          venueAddress: '123 Main St, City, State 12345',
        })
      }).toThrow('Wedding date is required')
    })

    it('should require weddingTime', () => {
      expect(() => {
        WeddingSettings.create({
          partner1Name: 'John',
          partner2Name: 'David',
          weddingDate: 'Saturday, June 15th, 2024',
          weddingTime: '',
          venueName: 'The Grand Ballroom',
          venueAddress: '123 Main St, City, State 12345',
        })
      }).toThrow('Wedding time is required')
    })

    it('should require venueName', () => {
      expect(() => {
        WeddingSettings.create({
          partner1Name: 'John',
          partner2Name: 'David',
          weddingDate: 'Saturday, June 15th, 2024',
          weddingTime: '4:00 PM',
          venueName: '',
          venueAddress: '123 Main St, City, State 12345',
        })
      }).toThrow('Venue name is required')
    })

    it('should require venueAddress', () => {
      expect(() => {
        WeddingSettings.create({
          partner1Name: 'John',
          partner2Name: 'David',
          weddingDate: 'Saturday, June 15th, 2024',
          weddingTime: '4:00 PM',
          venueName: 'The Grand Ballroom',
          venueAddress: '',
        })
      }).toThrow('Venue address is required')
    })
  })

  describe('update method', () => {
    it('should update wedding settings with new values', () => {
      const settings = WeddingSettings.create({
        partner1Name: 'John',
        partner2Name: 'David',
        weddingDate: 'Saturday, June 15th, 2024',
        weddingTime: '4:00 PM',
        venueName: 'The Grand Ballroom',
        venueAddress: '123 Main St, City, State 12345',
      })

      settings.update({
        partner1Name: 'Johnny',
        weddingTime: '5:00 PM',
        dressCode: 'Cocktail Attire',
      })

      expect(settings.partner1Name).toBe('Johnny')
      expect(settings.weddingTime).toBe('5:00 PM')
      expect(settings.dressCode).toBe('Cocktail Attire')
      expect(settings.partner2Name).toBe('David')
    })

    it('should validate required fields on update', () => {
      const settings = WeddingSettings.create({
        partner1Name: 'John',
        partner2Name: 'David',
        weddingDate: 'Saturday, June 15th, 2024',
        weddingTime: '4:00 PM',
        venueName: 'The Grand Ballroom',
        venueAddress: '123 Main St, City, State 12345',
      })

      expect(() => {
        settings.update({
          partner1Name: '',
        })
      }).toThrow('Partner 1 name is required')
    })
  })
})
