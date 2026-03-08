import { describe, it, expect } from 'vitest'
import { serializeTrip, deserializeTrip, validateAndConvertTrip } from '../../shared/utils/serialization'
import { Trip } from '../../shared/types/trip'

describe('Serialization', () => {
  const sampleTrip: Trip = {
    tripId: 'trip_20260308_abc123',
    tripName: '伊豆旅行',
    version: 1,
    createdAt: '2026-03-08T10:00:00.000Z',
    updatedAt: '2026-03-08T10:00:00.000Z',
    members: [
      {
        id: 'm1',
        name: '山田',
        defaultRatio: 100,
        createdAt: '2026-03-08T10:00:00.000Z'
      },
      {
        id: 'm2',
        name: '鈴木',
        defaultRatio: 100,
        createdAt: '2026-03-08T10:00:00.000Z'
      }
    ],
    receipts: [
      {
        id: 'r1',
        title: 'スーパー買い出し',
        amount: 30000,
        payerId: 'm1',
        targetMode: 'all',
        splitMode: 'equal',
        selectedMemberIds: ['m1', 'm2'],
        splits: [
          { memberId: 'm1', amount: 15000 },
          { memberId: 'm2', amount: 15000 }
        ],
        createdAt: '2026-03-08T12:00:00.000Z',
        updatedAt: '2026-03-08T12:00:00.000Z'
      }
    ],
    subgroups: []
  }

  describe('serializeTrip', () => {
    it('should serialize trip to JSON string', () => {
      const json = serializeTrip(sampleTrip)
      expect(typeof json).toBe('string')
      expect(JSON.parse(json)).toEqual(sampleTrip)
    })
  })

  describe('deserializeTrip', () => {
    it('should deserialize JSON string to Trip object', () => {
      const json = serializeTrip(sampleTrip)
      const trip = deserializeTrip(json)
      expect(trip).toEqual(sampleTrip)
    })

    it('should throw error for invalid JSON', () => {
      expect(() => deserializeTrip('invalid json')).toThrow()
    })
  })

  describe('validateAndConvertTrip', () => {
    it('should validate and convert valid trip data', () => {
      const trip = validateAndConvertTrip(sampleTrip)
      expect(trip).toEqual(sampleTrip)
    })

    it('should throw error when tripId is missing', () => {
      const invalidData = { ...sampleTrip, tripId: undefined }
      expect(() => validateAndConvertTrip(invalidData)).toThrow('Invalid trip data: tripId is required')
    })

    it('should throw error when tripName is missing', () => {
      const invalidData = { ...sampleTrip, tripName: undefined }
      expect(() => validateAndConvertTrip(invalidData)).toThrow('Invalid trip data: tripName is required')
    })

    it('should throw error when version is not a number', () => {
      const invalidData = { ...sampleTrip, version: '1' }
      expect(() => validateAndConvertTrip(invalidData)).toThrow('Invalid trip data: version must be a number')
    })

    it('should throw error when members is not an array', () => {
      const invalidData = { ...sampleTrip, members: 'not an array' }
      expect(() => validateAndConvertTrip(invalidData)).toThrow('Invalid trip data: members must be an array')
    })

    it('should throw error when receipts is not an array', () => {
      const invalidData = { ...sampleTrip, receipts: 'not an array' }
      expect(() => validateAndConvertTrip(invalidData)).toThrow('Invalid trip data: receipts must be an array')
    })

    it('should throw error when member id is missing', () => {
      const invalidData = {
        ...sampleTrip,
        members: [{ name: '山田', createdAt: '2026-03-08T10:00:00.000Z' }]
      }
      expect(() => validateAndConvertTrip(invalidData)).toThrow('Invalid member at index 0: id is required')
    })

    it('should throw error when receipt amount is not positive', () => {
      const invalidData = {
        ...sampleTrip,
        receipts: [{
          ...sampleTrip.receipts[0],
          amount: -100
        }]
      }
      expect(() => validateAndConvertTrip(invalidData)).toThrow('Invalid receipt at index 0: amount must be a positive number')
    })

    it('should throw error when receipt targetMode is invalid', () => {
      const invalidData = {
        ...sampleTrip,
        receipts: [{
          ...sampleTrip.receipts[0],
          targetMode: 'invalid'
        }]
      }
      expect(() => validateAndConvertTrip(invalidData)).toThrow("Invalid receipt at index 0: targetMode must be 'all' or 'selected'")
    })

    it('should throw error when receipt splitMode is invalid', () => {
      const invalidData = {
        ...sampleTrip,
        receipts: [{
          ...sampleTrip.receipts[0],
          splitMode: 'invalid'
        }]
      }
      expect(() => validateAndConvertTrip(invalidData)).toThrow("Invalid receipt at index 0: splitMode must be 'equal', 'ratio', or 'fixed'")
    })
  })
})
