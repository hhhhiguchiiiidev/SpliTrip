import { describe, it, expect, beforeEach } from 'vitest'
import { TripRepository } from '../../shared/repository/tripRepository'
import { Trip } from '../../shared/types/trip'
import type { KVNamespace } from '@cloudflare/workers-types'

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
    
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        keys.push({ name: key })
      }
    }
    
    return { keys }
  }
}

describe('TripRepository', () => {
  let mockKV: MockKVNamespace
  let repository: TripRepository

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
      }
    ],
    receipts: [],
    subgroups: []
  }

  beforeEach(() => {
    mockKV = new MockKVNamespace()
    repository = new TripRepository(mockKV as any)
  })

  describe('save', () => {
    it('should save trip to KV store', async () => {
      await repository.save(sampleTrip)
      
      const key = `trip:${sampleTrip.tripId}`
      const stored = await mockKV.get(key)
      
      expect(stored).not.toBeNull()
      expect(JSON.parse(stored!)).toEqual(sampleTrip)
    })
  })

  describe('get', () => {
    it('should retrieve trip from KV store', async () => {
      await repository.save(sampleTrip)
      
      const retrieved = await repository.get(sampleTrip.tripId)
      
      expect(retrieved).toEqual(sampleTrip)
    })

    it('should return null when trip does not exist', async () => {
      const retrieved = await repository.get('nonexistent_trip')
      
      expect(retrieved).toBeNull()
    })

    it('should throw error when stored data is invalid', async () => {
      const key = `trip:${sampleTrip.tripId}`
      await mockKV.put(key, 'invalid json')
      
      await expect(repository.get(sampleTrip.tripId)).rejects.toThrow()
    })
  })

  describe('delete', () => {
    it('should delete trip from KV store', async () => {
      await repository.save(sampleTrip)
      
      await repository.delete(sampleTrip.tripId)
      
      const retrieved = await repository.get(sampleTrip.tripId)
      expect(retrieved).toBeNull()
    })
  })

  describe('round-trip', () => {
    it('should preserve trip data through save and get', async () => {
      await repository.save(sampleTrip)
      const retrieved = await repository.get(sampleTrip.tripId)
      
      expect(retrieved).toEqual(sampleTrip)
    })
  })

  describe('list', () => {
    it('should return empty array when no trips exist', async () => {
      const trips = await repository.list()
      
      expect(trips).toEqual([])
    })

    it('should return single trip as TripListItem', async () => {
      await repository.save(sampleTrip)
      
      const trips = await repository.list()
      
      expect(trips).toHaveLength(1)
      expect(trips[0]).toEqual({
        tripId: sampleTrip.tripId,
        tripName: sampleTrip.tripName,
        memberCount: 1,
        createdAt: sampleTrip.createdAt
      })
    })

    it('should return multiple trips sorted by createdAt descending', async () => {
      const trip1: Trip = {
        ...sampleTrip,
        tripId: 'trip_20260308_001',
        tripName: '旅行1',
        createdAt: '2026-03-08T10:00:00.000Z',
        members: [sampleTrip.members[0], sampleTrip.members[0]]
      }
      
      const trip2: Trip = {
        ...sampleTrip,
        tripId: 'trip_20260309_002',
        tripName: '旅行2',
        createdAt: '2026-03-09T10:00:00.000Z',
        members: [sampleTrip.members[0]]
      }
      
      const trip3: Trip = {
        ...sampleTrip,
        tripId: 'trip_20260307_003',
        tripName: '旅行3',
        createdAt: '2026-03-07T10:00:00.000Z',
        members: [sampleTrip.members[0], sampleTrip.members[0], sampleTrip.members[0]]
      }
      
      await repository.save(trip1)
      await repository.save(trip2)
      await repository.save(trip3)
      
      const trips = await repository.list()
      
      expect(trips).toHaveLength(3)
      // 作成日時降順: trip2 (3/9) -> trip1 (3/8) -> trip3 (3/7)
      expect(trips[0].tripId).toBe('trip_20260309_002')
      expect(trips[0].memberCount).toBe(1)
      expect(trips[1].tripId).toBe('trip_20260308_001')
      expect(trips[1].memberCount).toBe(2)
      expect(trips[2].tripId).toBe('trip_20260307_003')
      expect(trips[2].memberCount).toBe(3)
    })

    it('should skip invalid trip data and continue', async () => {
      await repository.save(sampleTrip)
      
      // 無効なデータを直接KVに保存
      await mockKV.put('trip:invalid', 'invalid json')
      
      const trips = await repository.list()
      
      // 有効な旅行のみが返される
      expect(trips).toHaveLength(1)
      expect(trips[0].tripId).toBe(sampleTrip.tripId)
    })
  })
})
