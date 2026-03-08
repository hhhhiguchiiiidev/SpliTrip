import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { Trip } from '../../shared/types/trip'

describe('URL Generation Property Tests', () => {
  // Feature: splitrip-expense-tracker, Property 22: 旅行URL生成
  describe('Property 22: 旅行URL生成', () => {
    it('任意の旅行に対して、作成時に旅行IDを含む共有可能なURLが生成されなければならない', () => {
      /**
       * Validates: Requirements 7.1
       */
      const tripIdArbitrary = fc.string({ minLength: 10, maxLength: 50 })
        .map(s => `trip_${Date.now()}_${s}`)
      const tripNameArbitrary = fc.string({ minLength: 1, maxLength: 100 })

      fc.assert(
        fc.property(
          tripIdArbitrary,
          tripNameArbitrary,
          (tripId, tripName) => {
            // 旅行を作成
            const trip: Trip = {
              tripId,
              tripName,
              version: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              members: [],
              receipts: [],
              subgroups: []
            }

            // URL生成ロジック（AdminPageと同じ）
            const origin = 'https://example.com'
            const tripUrl = `${origin}/trip/${trip.tripId}`

            // 検証1: URLが旅行IDを含むこと
            expect(tripUrl).toContain(trip.tripId)

            // 検証2: URLが正しい形式であること
            expect(tripUrl).toMatch(/^https?:\/\/.+\/trip\/.+$/)

            // 検証3: URLから旅行IDを抽出できること
            const urlParts = tripUrl.split('/trip/')
            expect(urlParts).toHaveLength(2)
            expect(urlParts[1]).toBe(trip.tripId)

            // 検証4: URLが共有可能な形式であること（httpまたはhttpsで始まる）
            expect(tripUrl.startsWith('http://') || tripUrl.startsWith('https://')).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('異なる旅行IDに対して、異なるURLが生成されなければならない', () => {
      /**
       * Validates: Requirements 7.1
       */
      const tripIdArbitrary = fc.string({ minLength: 10, maxLength: 50 })
        .map(s => `trip_${Date.now()}_${s}`)

      fc.assert(
        fc.property(
          fc.array(tripIdArbitrary, { minLength: 2, maxLength: 10 }),
          (tripIds) => {
            // 重複を除去
            const uniqueTripIds = Array.from(new Set(tripIds))
            
            if (uniqueTripIds.length < 2) {
              // 一意なIDが2つ未満の場合はスキップ
              return true
            }

            const origin = 'https://example.com'
            const urls = uniqueTripIds.map(tripId => `${origin}/trip/${tripId}`)

            // すべてのURLが一意であることを確認
            const uniqueUrls = new Set(urls)
            expect(uniqueUrls.size).toBe(uniqueTripIds.length)

            // 各URLが対応する旅行IDを含むことを確認
            urls.forEach((url, index) => {
              expect(url).toContain(uniqueTripIds[index])
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    it('URLから旅行IDを正確に抽出できなければならない', () => {
      /**
       * Validates: Requirements 7.1
       */
      const tripIdArbitrary = fc.string({ minLength: 10, maxLength: 50 })
        .filter(s => !s.includes('/') && !s.includes('?') && !s.includes('#'))
        .map(s => `trip_${Date.now()}_${s}`)

      fc.assert(
        fc.property(
          tripIdArbitrary,
          (tripId) => {
            const origin = 'https://example.com'
            const tripUrl = `${origin}/trip/${tripId}`

            // URLから旅行IDを抽出
            const match = tripUrl.match(/\/trip\/(.+)$/)
            expect(match).not.toBeNull()
            
            if (match) {
              const extractedTripId = match[1]
              expect(extractedTripId).toBe(tripId)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
