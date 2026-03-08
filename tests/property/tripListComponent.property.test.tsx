import { describe, it, expect, vi } from 'vitest'
import * as fc from 'fast-check'
import { render, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import TripListComponent from '../../src/components/TripListComponent'
import { TripListItem } from '../../shared/types/tripListItem'

// Helper function to render component with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('TripListComponent Property Tests', () => {
  // Feature: trip-management-enhancements, Property 1: 旅行リスト表示の完全性
  describe('Property 1: 旅行リスト表示の完全性', () => {
    it('任意の旅行リストに対して、表示される各旅行には旅行名、作成日時、メンバー数が含まれていなければならない', () => {
      /**
       * Validates: Requirements 1.2
       */
      
      // 旅行リストジェネレータ（1個以上10個以下）- ユニークなIDと名前を保証
      const tripsArbitrary = fc.array(
        fc.record({
          tripName: fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length > 2),
          memberCount: fc.integer({ min: 0, max: 50 }),
          createdAt: fc.date({ 
            min: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            max: new Date()
          }).map(d => d.toISOString())
        }),
        { minLength: 1, maxLength: 10 }
      ).map((trips, index) => 
        // 各旅行にユニークなIDとプレフィックス付きの名前を追加（空白を正規化）
        trips.map((trip, i) => ({
          ...trip,
          tripId: `trip-${index}-${i}-${Date.now()}`,
          tripName: `${i}-${trip.tripName.trim().replace(/\s+/g, ' ')}` // 空白を正規化（複数の空白を1つに）
        }))
      )

      fc.assert(
        fc.property(
          tripsArbitrary,
          (trips) => {
            const onDelete = vi.fn()
            const { container } = renderWithRouter(<TripListComponent trips={trips} onDelete={onDelete} />)

            // containerを使ってスコープを限定
            const scope = within(container)

            // 各旅行について検証
            trips.forEach((trip) => {
              // 旅行名が表示されていること（ユニークなので getByText を使用可能）
              expect(scope.getByText(trip.tripName)).toBeDefined()
            })

            // メンバー数が表示されていること（重複する可能性があるので、全体で検証）
            trips.forEach((trip) => {
              const memberCountText = `メンバー数: ${trip.memberCount}人`
              const memberCountElements = scope.queryAllByText(memberCountText)
              // 少なくとも1つは存在することを確認
              expect(memberCountElements.length).toBeGreaterThan(0)
            })

            // 作成日時が表示されていること（"作成日時:"というテキストが含まれる）
            const createdAtElements = scope.getAllByText(/作成日時:/)
            expect(createdAtElements.length).toBe(trips.length)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: trip-management-enhancements, Property 2: 旅行リストへのリンク提供
  describe('Property 2: 旅行リストへのリンク提供', () => {
    it('任意の旅行リストに対して、表示される各旅行には旅行ページへのリンクが含まれていなければならない', () => {
      /**
       * Validates: Requirements 1.3
       */
      
      // 旅行リストジェネレータ（1個以上10個以下）- ユニークなIDと名前を保証
      const tripsArbitrary = fc.array(
        fc.record({
          tripName: fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length > 2),
          memberCount: fc.integer({ min: 0, max: 50 }),
          createdAt: fc.date({ 
            min: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            max: new Date()
          }).map(d => d.toISOString())
        }),
        { minLength: 1, maxLength: 10 }
      ).map((trips, index) => 
        trips.map((trip, i) => ({
          ...trip,
          tripId: `trip-${index}-${i}-${Date.now()}`,
          tripName: `${i}-${trip.tripName.trim().replace(/\s+/g, ' ')}` // 空白を正規化
        }))
      )

      fc.assert(
        fc.property(
          tripsArbitrary,
          (trips) => {
            const onDelete = vi.fn()
            const { container } = renderWithRouter(<TripListComponent trips={trips} onDelete={onDelete} />)

            // containerを使ってスコープを限定
            const scope = within(container)

            // リンクの数が旅行の数と一致すること
            const links = scope.getAllByRole('link', { name: '開く' })
            expect(links.length).toBe(trips.length)

            // 各旅行について検証
            trips.forEach((trip) => {
              // 旅行ページへのリンクが存在すること
              const link = links.find(l => l.getAttribute('href') === `/trip/${trip.tripId}`)
              expect(link).toBeDefined()
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: trip-management-enhancements, Property 4: 削除ボタンの提供
  describe('Property 4: 削除ボタンの提供', () => {
    it('任意の旅行リストに対して、表示される各旅行には削除ボタンが含まれていなければならない', () => {
      /**
       * Validates: Requirements 2.1
       */
      
      // 旅行リストジェネレータ（1個以上10個以下）- ユニークなIDと名前を保証
      const tripsArbitrary = fc.array(
        fc.record({
          tripName: fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length > 2),
          memberCount: fc.integer({ min: 0, max: 50 }),
          createdAt: fc.date({ 
            min: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            max: new Date()
          }).map(d => d.toISOString())
        }),
        { minLength: 1, maxLength: 10 }
      ).map((trips, index) => 
        trips.map((trip, i) => ({
          ...trip,
          tripId: `trip-${index}-${i}-${Date.now()}`,
          tripName: `${i}-${trip.tripName.trim().replace(/\s+/g, ' ')}` // 空白を正規化
        }))
      )

      fc.assert(
        fc.property(
          tripsArbitrary,
          (trips) => {
            const onDelete = vi.fn()
            const { container } = renderWithRouter(<TripListComponent trips={trips} onDelete={onDelete} />)

            // containerを使ってスコープを限定
            const scope = within(container)

            // 削除ボタンの数が旅行の数と一致すること
            const deleteButtons = scope.getAllByRole('button', { name: '削除' })
            expect(deleteButtons.length).toBe(trips.length)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
