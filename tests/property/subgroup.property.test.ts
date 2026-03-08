import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { TripRepository } from '../../shared/repository/tripRepository'
import { Trip } from '../../shared/types/trip'
import { Subgroup, SubgroupMemberRatio } from '../../shared/types/subgroup'
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

describe('Subgroup Property Tests', () => {
  // Feature: trip-management-enhancements, Property 9: サブグループデータのラウンドトリップ
  describe('Property 9: サブグループデータのラウンドトリップ', () => {
    it('任意のサブグループに対して、サブグループを作成してストレージに保存し、その後取得した場合、取得したデータは元のデータと一致しなければならない', async () => {
      /**
       * Validates: Requirements 4.6, 9.2
       */
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 10 }),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              defaultRatio: fc.integer({ min: 1, max: 1000 })
            }),
            { minLength: 2, maxLength: 10 }
          ),
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 10 }), // selectedCount
          fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 10 }), // ratios
          async (tripName, members, subgroupId, subgroupName, selectedCountRaw, ratios) => {
            const testMockKV = new MockKVNamespace()
            const testRepository = new TripRepository(testMockKV)
            const now = new Date().toISOString()

            // サブグループのメンバー比率を生成（fast-checkの値のみ使用）
            const selectedCount = Math.min(selectedCountRaw, members.length)
            const memberRatios: SubgroupMemberRatio[] = members.slice(0, selectedCount).map((m, i) => ({
              memberId: m.id,
              ratio: ratios[i % ratios.length]
            }))

            const subgroup: Subgroup = {
              id: subgroupId,
              name: subgroupName,
              memberRatios,
              createdAt: now,
              updatedAt: now
            }

            const trip: Trip = {
              tripId: `trip_test_${Date.now()}_${subgroupId}`,
              tripName,
              version: 1,
              createdAt: now,
              updatedAt: now,
              members: members.map(m => ({ ...m, createdAt: now } as Member)),
              receipts: [],
              subgroups: [subgroup]
            }

            await testRepository.save(trip)
            const retrieved = await testRepository.get(trip.tripId)

            expect(retrieved).not.toBeNull()
            expect(retrieved!.subgroups).toHaveLength(1)
            
            const retrievedSubgroup = retrieved!.subgroups[0]
            expect(retrievedSubgroup.id).toBe(subgroup.id)
            expect(retrievedSubgroup.name).toBe(subgroup.name)
            expect(retrievedSubgroup.memberRatios).toHaveLength(subgroup.memberRatios.length)
            expect(retrievedSubgroup.createdAt).toBe(subgroup.createdAt)
            expect(retrievedSubgroup.updatedAt).toBe(subgroup.updatedAt)

            // 順序に依存しない検証
            expect(retrievedSubgroup.memberRatios.length).toBe(subgroup.memberRatios.length)
            subgroup.memberRatios.forEach(originalMr => {
              const retrievedMr = retrievedSubgroup.memberRatios.find(r => r.memberId === originalMr.memberId)
              expect(retrievedMr).toBeDefined()
              expect(retrievedMr!.ratio).toBe(originalMr.ratio)
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: trip-management-enhancements, Property 10: サブグループリスト表示の完全性
  describe('Property 10: サブグループリスト表示の完全性', () => {
    it('任意のサブグループリストに対して、旅行に登録されたすべてのサブグループが表示されなければならない', async () => {
      /**
       * Validates: Requirements 4.7
       */
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 10 }),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              defaultRatio: fc.integer({ min: 1, max: 1000 })
            }),
            { minLength: 2, maxLength: 10 }
          ),
          fc.integer({ min: 1, max: 5 }),
          fc.array(
            fc.record({
              selectedCount: fc.integer({ min: 1, max: 10 }),
              ratios: fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 10 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (tripName, members, subgroupCount, subgroupConfigs) => {
            const testMockKV = new MockKVNamespace()
            const testRepository = new TripRepository(testMockKV)
            const now = new Date().toISOString()

            const subgroups: Subgroup[] = []
            for (let i = 0; i < subgroupCount; i++) {
              const config = subgroupConfigs[i % subgroupConfigs.length]
              const selectedCount = Math.min(config.selectedCount, members.length)
              const memberRatios: SubgroupMemberRatio[] = members.slice(0, selectedCount).map((m, j) => ({
                memberId: m.id,
                ratio: config.ratios[j % config.ratios.length]
              }))

              subgroups.push({
                id: `sg${i + 1}`,
                name: `Subgroup ${i + 1}`,
                memberRatios,
                createdAt: now,
                updatedAt: now
              })
            }

            const trip: Trip = {
              tripId: `trip_test_${Date.now()}_${subgroupCount}`,
              tripName,
              version: 1,
              createdAt: now,
              updatedAt: now,
              members: members.map(m => ({ ...m, createdAt: now } as Member)),
              receipts: [],
              subgroups
            }

            await testRepository.save(trip)
            const retrieved = await testRepository.get(trip.tripId)

            expect(retrieved).not.toBeNull()
            expect(retrieved!.subgroups).toHaveLength(subgroups.length)

            subgroups.forEach(originalSubgroup => {
              const foundSubgroup = retrieved!.subgroups.find(sg => sg.id === originalSubgroup.id)
              expect(foundSubgroup).toBeDefined()
              expect(foundSubgroup!.name).toBe(originalSubgroup.name)
              expect(foundSubgroup!.memberRatios).toHaveLength(originalSubgroup.memberRatios.length)
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: trip-management-enhancements, Property 11: サブグループ編集の永続化
  describe('Property 11: サブグループ編集の永続化', () => {
    it('任意のサブグループに対して、サブグループを編集して保存した場合、取得したデータは編集後のデータと一致しなければならない', async () => {
      /**
       * Validates: Requirements 5.2
       */
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 10 }),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              defaultRatio: fc.integer({ min: 1, max: 1000 })
            }),
            { minLength: 2, maxLength: 10 }
          ),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 10 }),
          fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 10 }),
          async (tripName, members, originalName, editedName, selectedCount1Raw, selectedCount2Raw, ratios1, ratios2) => {
            const testMockKV = new MockKVNamespace()
            const testRepository = new TripRepository(testMockKV)
            const now = new Date().toISOString()

            const selectedCount1 = Math.min(selectedCount1Raw, members.length)
            const originalMemberRatios: SubgroupMemberRatio[] = members.slice(0, selectedCount1).map((m, i) => ({
              memberId: m.id,
              ratio: ratios1[i % ratios1.length]
            }))

            const originalSubgroup: Subgroup = {
              id: 'sg1',
              name: originalName,
              memberRatios: originalMemberRatios,
              createdAt: now,
              updatedAt: now
            }

            let trip: Trip = {
              tripId: `trip_test_${Date.now()}_edit`,
              tripName,
              version: 1,
              createdAt: now,
              updatedAt: now,
              members: members.map(m => ({ ...m, createdAt: now } as Member)),
              receipts: [],
              subgroups: [originalSubgroup]
            }

            await testRepository.save(trip)

            const selectedCount2 = Math.min(selectedCount2Raw, members.length)
            const editedMemberRatios: SubgroupMemberRatio[] = members.slice(0, selectedCount2).map((m, i) => ({
              memberId: m.id,
              ratio: ratios2[i % ratios2.length]
            }))

            const updatedSubgroup: Subgroup = {
              id: originalSubgroup.id,
              name: editedName,
              memberRatios: editedMemberRatios,
              createdAt: originalSubgroup.createdAt,
              updatedAt: new Date().toISOString()
            }

            trip = {
              ...trip,
              subgroups: [updatedSubgroup],
              version: trip.version + 1,
              updatedAt: new Date().toISOString()
            }

            await testRepository.save(trip)
            const retrieved = await testRepository.get(trip.tripId)

            expect(retrieved).not.toBeNull()
            expect(retrieved!.subgroups).toHaveLength(1)
            
            const retrievedSubgroup = retrieved!.subgroups[0]
            expect(retrievedSubgroup.id).toBe(updatedSubgroup.id)
            expect(retrievedSubgroup.name).toBe(updatedSubgroup.name)
            expect(retrievedSubgroup.memberRatios).toHaveLength(updatedSubgroup.memberRatios.length)

            // 順序に依存しない検証
            expect(retrievedSubgroup.memberRatios.length).toBe(updatedSubgroup.memberRatios.length)
            updatedSubgroup.memberRatios.forEach(originalMr => {
              const retrievedMr = retrievedSubgroup.memberRatios.find(r => r.memberId === originalMr.memberId)
              expect(retrievedMr).toBeDefined()
              expect(retrievedMr!.ratio).toBe(originalMr.ratio)
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: trip-management-enhancements, Property 12: サブグループ削除の完了
  describe('Property 12: サブグループ削除の完了', () => {
    it('任意のサブグループに対して、サブグループを削除した場合、旅行データからそのサブグループが削除されていなければならない', async () => {
      /**
       * Validates: Requirements 5.5
       */
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 10 }),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              defaultRatio: fc.integer({ min: 1, max: 1000 })
            }),
            { minLength: 2, maxLength: 10 }
          ),
          fc.integer({ min: 2, max: 5 }),
          fc.array(
            fc.record({
              selectedCount: fc.integer({ min: 1, max: 10 }),
              ratios: fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 10 })
            }),
            { minLength: 2, maxLength: 5 }
          ),
          fc.integer({ min: 0, max: 100 }), // deleteIndex seed
          async (tripName, members, subgroupCount, subgroupConfigs, deleteIndexSeed) => {
            const testMockKV = new MockKVNamespace()
            const testRepository = new TripRepository(testMockKV)
            const now = new Date().toISOString()

            const subgroups: Subgroup[] = []
            for (let i = 0; i < subgroupCount; i++) {
              const config = subgroupConfigs[i % subgroupConfigs.length]
              const selectedCount = Math.min(config.selectedCount, members.length)
              const memberRatios: SubgroupMemberRatio[] = members.slice(0, selectedCount).map((m, j) => ({
                memberId: m.id,
                ratio: config.ratios[j % config.ratios.length]
              }))

              subgroups.push({
                id: `sg${i + 1}`,
                name: `Subgroup ${i + 1}`,
                memberRatios,
                createdAt: now,
                updatedAt: now
              })
            }

            let trip: Trip = {
              tripId: `trip_test_${Date.now()}_delete`,
              tripName,
              version: 1,
              createdAt: now,
              updatedAt: now,
              members: members.map(m => ({ ...m, createdAt: now } as Member)),
              receipts: [],
              subgroups
            }

            await testRepository.save(trip)

            const deleteIndex = deleteIndexSeed % subgroups.length
            const subgroupToDelete = subgroups[deleteIndex]
            
            trip = {
              ...trip,
              subgroups: trip.subgroups.filter(sg => sg.id !== subgroupToDelete.id),
              version: trip.version + 1,
              updatedAt: new Date().toISOString()
            }

            await testRepository.save(trip)
            const retrieved = await testRepository.get(trip.tripId)

            expect(retrieved).not.toBeNull()
            expect(retrieved!.subgroups).toHaveLength(subgroups.length - 1)
            
            const deletedSubgroup = retrieved!.subgroups.find(sg => sg.id === subgroupToDelete.id)
            expect(deletedSubgroup).toBeUndefined()

            const remainingSubgroups = subgroups.filter(sg => sg.id !== subgroupToDelete.id)
            remainingSubgroups.forEach(originalSubgroup => {
              const foundSubgroup = retrieved!.subgroups.find(sg => sg.id === originalSubgroup.id)
              expect(foundSubgroup).toBeDefined()
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
