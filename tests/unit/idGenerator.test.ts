import { describe, it, expect } from 'vitest'
import { generateTripId, generateMemberId, generateReceiptId, generateSubgroupId } from '../../shared/utils/idGenerator'

describe('ID Generator', () => {
  describe('generateTripId', () => {
    it('should generate trip ID with correct format', () => {
      const tripId = generateTripId()
      expect(tripId).toMatch(/^trip_\d{8}_[a-z0-9]{6}$/)
    })

    it('should generate unique trip IDs', () => {
      const id1 = generateTripId()
      const id2 = generateTripId()
      expect(id1).not.toBe(id2)
    })
  })

  describe('generateMemberId', () => {
    it('should generate member ID with correct format', () => {
      const memberId = generateMemberId(0)
      expect(memberId).toBe('m1')
    })

    it('should generate sequential member IDs', () => {
      expect(generateMemberId(0)).toBe('m1')
      expect(generateMemberId(1)).toBe('m2')
      expect(generateMemberId(2)).toBe('m3')
    })
  })

  describe('generateReceiptId', () => {
    it('should generate receipt ID with correct format', () => {
      const receiptId = generateReceiptId(0)
      expect(receiptId).toBe('r1')
    })

    it('should generate sequential receipt IDs', () => {
      expect(generateReceiptId(0)).toBe('r1')
      expect(generateReceiptId(1)).toBe('r2')
      expect(generateReceiptId(2)).toBe('r3')
    })
  })

  describe('generateSubgroupId', () => {
    it('should generate subgroup ID with correct format', () => {
      const subgroupId = generateSubgroupId(0)
      expect(subgroupId).toBe('sg1')
    })

    it('should generate sequential subgroup IDs', () => {
      expect(generateSubgroupId(0)).toBe('sg1')
      expect(generateSubgroupId(1)).toBe('sg2')
      expect(generateSubgroupId(2)).toBe('sg3')
    })

    it('should handle large counts', () => {
      expect(generateSubgroupId(99)).toBe('sg100')
    })
  })
})
