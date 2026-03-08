import { describe, it, expect, beforeEach } from 'vitest'
import { TripRepository } from '../../shared/repository/tripRepository'
import { Trip } from '../../shared/types/trip'

// Mock KVNamespace for testing
class MockKVNamespace implements KVNamespace {
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

  // Unused methods for KVNamespace interface
  getWithMetadata(): Promise<any> { throw new Error('Not implemented') }
  list(): Promise<any> { throw new Error('Not implemented') }
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
        createdAt: '2026-03-08T10:00:00.000Z'
      }
    ],
    receipts: []
  }

  beforeEach(() => {
    mockKV = new MockKVNamespace()
    repository = new TripRepository(mockKV)
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
})
