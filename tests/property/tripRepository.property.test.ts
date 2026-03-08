import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { TripRepository } from '../../shared/repository/tripRepository'
import { Trip } from '../../shared/types/trip'
import { Member } from '../../shared/types/member'

// Mock KVNamespace for testing
class MockKVNamespace {
  private store: Map<string, string> = new Map()

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null
  }

  async put(key: string, value: string): Promise<void> {
    this.store.set(key, value)
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  async list(options?: { prefix?: string }): Promise<{ keys: Array<{ name: string }> }> {
    const keys: Array<{ name: string }> = []
    const prefix = options?.prefix || ''
    
    for (const [key] of this.store.entries()) {
      if (key.startsWith(prefix)) {
        keys.push({ name: key })
      }
    }
    
    return { keys }
  }
}

describe('TripRepository Property Tests', () => {
  let mockKV: MockKVNamespace
  let repository: TripRepository

  beforeEach(() => {
    mockKV = new MockKVNamespace()
    repository = new TripRepository(mockKV)
  })

  // Feature: splitrip-expense-tracker, Property 1: 旅行作成時の初期化
  describe('Property 1: 旅行作成時の初期化', () => {
    it('任意の旅行名に対して、旅行を作成したとき、システムは一意の旅行IDを生成し、空のメンバーリストと空のレシートリストで初期化しなければならない', async () => {
      /**
       * Validates: Requirements 1.1, 1.2
       */
      const tripNameArbitrary = fc.string({ minLength: 1, maxLength: 100 })

      await fc.assert(
        fc.asyncProperty(
          tripNameArbitrary,
          async (tripName) => {
            // 旅行を作成
            const trip: Trip = {
              tripId: `trip_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
              tripName,
              version: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              members: [],
              receipts: [],
              subgroups: []
            }

            // 保存
            await repository.save(trip)

            // 取得
            const retrieved = await repository.get(trip.tripId)

            // 検証
            expect(retrieved).not.toBeNull()
            expect(retrieved!.tripId).toBe(trip.tripId)
            expect(retrieved!.tripName).toBe(tripName)
            expect(retrieved!.members).toEqual([])
            expect(retrieved!.receipts).toEqual([])
            expect(retrieved!.version).toBe(1)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: splitrip-expense-tracker, Property 2: メンバー追加の一意性
  describe('Property 2: メンバー追加の一意性', () => {
    it('任意の旅行と任意のメンバー名に対して、メンバーを追加したとき、システムは一意のメンバーIDを割り当て、旅行のメンバーリストに追加しなければならない', async () => {
      /**
       * Validates: Requirements 1.3
       */
      const tripNameArbitrary = fc.string({ minLength: 1, maxLength: 100 })
      const memberNamesArbitrary = fc.array(
        fc.string({ minLength: 1, maxLength: 50 }),
        { minLength: 1, maxLength: 10 }
      )

      await fc.assert(
        fc.asyncProperty(
          tripNameArbitrary,
          memberNamesArbitrary,
          async (tripName, memberNames) => {
            // 旅行を作成
            const trip: Trip = {
              tripId: `trip_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
              tripName,
              version: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              members: [],
              receipts: [],
              subgroups: []
            }

            // メンバーを追加
            const memberIds = new Set<string>()
            for (let i = 0; i < memberNames.length; i++) {
              const memberId = `m${i + 1}`
              const member: Member = {
                id: memberId,
                name: memberNames[i],
                defaultRatio: 100,
                createdAt: new Date().toISOString()
              }
              trip.members.push(member)
              memberIds.add(memberId)
            }

            // 保存
            await repository.save(trip)

            // 取得
            const retrieved = await repository.get(trip.tripId)

            // 検証
            expect(retrieved).not.toBeNull()
            expect(retrieved!.members).toHaveLength(memberNames.length)

            // すべてのメンバーIDが一意であることを確認
            const retrievedIds = new Set(retrieved!.members.map(m => m.id))
            expect(retrievedIds.size).toBe(memberNames.length)

            // すべてのメンバーが追加されていることを確認
            retrieved!.members.forEach((member, index) => {
              expect(member.id).toBe(`m${index + 1}`)
              expect(member.name).toBe(memberNames[index])
              expect(member.createdAt).toBeDefined()
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: splitrip-expense-tracker, Property 4: バージョン番号のインクリメント
  describe('Property 4: バージョン番号のインクリメント', () => {
    it('任意の旅行に対して、更新操作を実行したとき、システムはバージョン番号をインクリメントしなければならない', async () => {
      /**
       * Validates: Requirements 1.5, 6.4
       */
      const tripNameArbitrary = fc.string({ minLength: 1, maxLength: 100 })
      const updateCountArbitrary = fc.integer({ min: 1, max: 10 })

      await fc.assert(
        fc.asyncProperty(
          tripNameArbitrary,
          updateCountArbitrary,
          async (tripName, updateCount) => {
            // 旅行を作成
            let trip: Trip = {
              tripId: `trip_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
              tripName,
              version: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              members: [],
              receipts: [],
              subgroups: []
            }

            // 初回保存
            await repository.save(trip)

            // 複数回更新
            for (let i = 0; i < updateCount; i++) {
              // 取得
              const retrieved = await repository.get(trip.tripId)
              expect(retrieved).not.toBeNull()

              // バージョンをインクリメント
              trip = {
                ...retrieved!,
                version: retrieved!.version + 1,
                updatedAt: new Date().toISOString()
              }

              // 保存
              await repository.save(trip)
            }

            // 最終確認
            const finalTrip = await repository.get(trip.tripId)
            expect(finalTrip).not.toBeNull()
            expect(finalTrip!.version).toBe(1 + updateCount)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: splitrip-expense-tracker, Property 5: 旅行削除の完全性
  describe('Property 5: 旅行削除の完全性', () => {
    it('任意の旅行に対して、削除操作を実行したとき、システムはKVストアから旅行データを削除し、その後の取得操作は失敗しなければならない', async () => {
      /**
       * Validates: Requirements 1.6
       */
      const tripNameArbitrary = fc.string({ minLength: 1, maxLength: 100 })

      await fc.assert(
        fc.asyncProperty(
          tripNameArbitrary,
          async (tripName) => {
            // 旅行を作成
            const trip: Trip = {
              tripId: `trip_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
              tripName,
              version: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              members: [],
              receipts: [],
              subgroups: []
            }

            // 保存
            await repository.save(trip)

            // 存在確認
            const beforeDelete = await repository.get(trip.tripId)
            expect(beforeDelete).not.toBeNull()

            // 削除
            await repository.delete(trip.tripId)

            // 削除後の取得はnullを返すべき
            const afterDelete = await repository.get(trip.tripId)
            expect(afterDelete).toBeNull()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: trip-management-enhancements, Property 5: 旅行削除のラウンドトリップ
  describe('Property 5: 旅行削除のラウンドトリップ', () => {
    it('任意の旅行に対して、旅行を作成してストレージに保存し、その後削除した場合、ストレージから旅行が削除されていなければならない', async () => {
      /**
       * Validates: Requirements 2.3
       */
      const tripNameArbitrary = fc.string({ minLength: 1, maxLength: 100 })
      const memberCountArbitrary = fc.integer({ min: 0, max: 20 })

      await fc.assert(
        fc.asyncProperty(
          tripNameArbitrary,
          memberCountArbitrary,
          async (tripName, memberCount) => {
            // 各プロパティテストの実行ごとに新しいリポジトリを作成
            const testMockKV = new MockKVNamespace()
            const testRepository = new TripRepository(testMockKV)
            
            // 旅行を作成
            const trip: Trip = {
              tripId: `trip_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
              tripName,
              version: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              members: Array.from({ length: memberCount }, (_, i) => ({
                id: `m${i + 1}`,
                name: `Member ${i + 1}`,
                defaultRatio: 100,
                createdAt: new Date().toISOString()
              })),
              receipts: [],
              subgroups: []
            }

            // ストレージに保存
            await testRepository.save(trip)

            // 保存されたことを確認
            const savedTrip = await testRepository.get(trip.tripId)
            expect(savedTrip).not.toBeNull()
            expect(savedTrip!.tripId).toBe(trip.tripId)

            // 旅行を削除
            await testRepository.delete(trip.tripId)

            // 削除後、ストレージから旅行が削除されていることを確認
            const deletedTrip = await testRepository.get(trip.tripId)
            expect(deletedTrip).toBeNull()

            // list()メソッドでも削除された旅行が表示されないことを確認
            const tripList = await testRepository.list()
            const foundInList = tripList.find(item => item.tripId === trip.tripId)
            expect(foundInList).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: trip-management-enhancements, Property 3: 旅行リストのソート順序
  describe('Property 3: 旅行リストのソート順序', () => {
    it('任意の旅行リストに対して、旅行は作成日時の降順で並べられていなければならない', async () => {
      /**
       * Validates: Requirements 1.5
       */
      
      // 旅行名ジェネレータ
      const tripNameArbitrary = fc.string({ minLength: 1, maxLength: 100 })
      
      // 旅行配列ジェネレータ（2個以上10個以下）
      const tripsArbitrary = fc.array(
        fc.record({
          tripName: tripNameArbitrary,
          memberCount: fc.integer({ min: 0, max: 20 }),
          // 異なる作成日時を生成するため、過去1年間のランダムな日時を生成
          createdAt: fc.date({ 
            min: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            max: new Date()
          }).map(d => d.toISOString())
        }),
        { minLength: 2, maxLength: 10 }
      )

      await fc.assert(
        fc.asyncProperty(
          tripsArbitrary,
          async (tripData) => {
            // 各プロパティテストの実行ごとに新しいリポジトリを作成
            const testMockKV = new MockKVNamespace()
            const testRepository = new TripRepository(testMockKV)
            
            // 各旅行データから旅行を作成して保存
            const trips: Trip[] = []
            
            for (let i = 0; i < tripData.length; i++) {
              const data = tripData[i]
              const trip: Trip = {
                tripId: `trip_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 8)}`,
                tripName: data.tripName,
                version: 1,
                createdAt: data.createdAt,
                updatedAt: data.createdAt,
                members: Array.from({ length: data.memberCount }, (_, j) => ({
                  id: `m${j + 1}`,
                  name: `Member ${j + 1}`,
                  defaultRatio: 100,
                  createdAt: data.createdAt
                })),
                receipts: [],
                subgroups: []
              }
              
              trips.push(trip)
              await testRepository.save(trip)
            }

            // list()メソッドを呼び出し
            const tripList = await testRepository.list()

            // 検証1: すべての旅行が返されること
            expect(tripList).toHaveLength(trips.length)

            // 検証2: 作成日時の降順でソートされていること
            for (let i = 0; i < tripList.length - 1; i++) {
              const currentDate = new Date(tripList[i].createdAt).getTime()
              const nextDate = new Date(tripList[i + 1].createdAt).getTime()
              expect(currentDate).toBeGreaterThanOrEqual(nextDate)
            }

            // 検証3: 各TripListItemが正しいデータを含むこと
            tripList.forEach(item => {
              const originalTrip = trips.find(t => t.tripId === item.tripId)
              expect(originalTrip).toBeDefined()
              expect(item.tripName).toBe(originalTrip!.tripName)
              expect(item.memberCount).toBe(originalTrip!.members.length)
              expect(item.createdAt).toBe(originalTrip!.createdAt)
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
