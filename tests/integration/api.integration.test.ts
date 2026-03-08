import { describe, it, expect, beforeEach } from 'vitest'
import { onRequestPost } from '../../functions/api/trips/index'
import { onRequestGet, onRequestPut, onRequestDelete } from '../../functions/api/trips/[tripId]'
import { Env } from '../../shared/types/env'
import { Trip } from '../../shared/types/trip'
import type { KVNamespace } from '@cloudflare/workers-types'

/**
 * API統合テスト
 * 要件: 9.1, 9.2, 9.3, 9.4, 9.5
 * 
 * このテストは、APIエンドポイントの統合動作を検証します：
 * - 旅行作成から取得までのフロー
 * - 旅行更新のフロー
 * - 旅行削除のフロー
 * - エラーレスポンスの確認
 */

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

  // Unused methods for KVNamespace interface
  getWithMetadata(): Promise<any> { throw new Error('Not implemented') }
  list(): Promise<any> { throw new Error('Not implemented') }
}

describe('API Integration Tests', () => {
  let mockKV: MockKVNamespace
  let env: Env

  beforeEach(() => {
    mockKV = new MockKVNamespace()
    env = {
      TRIPS_KV: mockKV as unknown as KVNamespace,
      ENVIRONMENT: 'test'
    }
  })

  describe('旅行作成から取得までのフロー (要件 9.1, 9.2)', () => {
    it('should create a trip and retrieve it successfully', async () => {
      // Step 1: 旅行を作成
      const createRequest = new Request('http://localhost/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripName: '伊豆旅行',
          members: [
            { name: '山田' },
            { name: '鈴木' },
            { name: '田中' }
          ]
        })
      })

      const createResponse = await onRequestPost({ request: createRequest, env })
      expect(createResponse.status).toBe(201)

      const createdTrip: Trip = await createResponse.json()
      expect(createdTrip.tripId).toBeDefined()
      expect(createdTrip.tripName).toBe('伊豆旅行')
      expect(createdTrip.version).toBe(1)
      expect(createdTrip.members).toHaveLength(3)
      expect(createdTrip.members[0].name).toBe('山田')
      expect(createdTrip.members[1].name).toBe('鈴木')
      expect(createdTrip.members[2].name).toBe('田中')
      expect(createdTrip.receipts).toHaveLength(0)
      expect(createdTrip.createdAt).toBeDefined()
      expect(createdTrip.updatedAt).toBeDefined()

      // Step 2: 作成した旅行を取得
      const getRequest = new Request(`http://localhost/api/trips/${createdTrip.tripId}`, {
        method: 'GET'
      })

      const getResponse = await onRequestGet({
        request: getRequest,
        env,
        params: { tripId: createdTrip.tripId }
      })
      expect(getResponse.status).toBe(200)

      const retrievedTrip: Trip = await getResponse.json()
      expect(retrievedTrip).toEqual(createdTrip)
    })

    it('should create a trip without members', async () => {
      const createRequest = new Request('http://localhost/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripName: '日帰り旅行'
        })
      })

      const createResponse = await onRequestPost({ request: createRequest, env })
      expect(createResponse.status).toBe(201)

      const createdTrip: Trip = await createResponse.json()
      expect(createdTrip.tripName).toBe('日帰り旅行')
      expect(createdTrip.members).toHaveLength(0)
      expect(createdTrip.receipts).toHaveLength(0)
    })
  })

  describe('旅行更新のフロー (要件 9.3, 9.4)', () => {
    it('should update a trip and increment version', async () => {
      // Step 1: 旅行を作成
      const createRequest = new Request('http://localhost/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripName: '京都旅行',
          members: [{ name: '佐藤' }]
        })
      })

      const createResponse = await onRequestPost({ request: createRequest, env })
      const createdTrip: Trip = await createResponse.json()

      // Step 2: 旅行を更新（メンバーを追加）
      const updatedTripData = {
        ...createdTrip,
        members: [
          ...createdTrip.members,
          { id: 'm2', name: '高橋', createdAt: new Date().toISOString() }
        ]
      }

      const updateRequest = new Request(`http://localhost/api/trips/${createdTrip.tripId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTripData)
      })

      const updateResponse = await onRequestPut({
        request: updateRequest,
        env,
        params: { tripId: createdTrip.tripId }
      })
      expect(updateResponse.status).toBe(200)

      const updatedTrip: Trip = await updateResponse.json()
      expect(updatedTrip.version).toBe(2) // バージョンがインクリメントされる
      expect(updatedTrip.members).toHaveLength(2)
      expect(updatedTrip.updatedAt).toBeDefined() // updatedAtが設定されている

      // Step 3: 更新された旅行を取得して確認
      const getRequest = new Request(`http://localhost/api/trips/${createdTrip.tripId}`, {
        method: 'GET'
      })

      const getResponse = await onRequestGet({
        request: getRequest,
        env,
        params: { tripId: createdTrip.tripId }
      })

      const retrievedTrip: Trip = await getResponse.json()
      expect(retrievedTrip.version).toBe(2)
      expect(retrievedTrip.members).toHaveLength(2)
    })
  })

  describe('旅行削除のフロー (要件 9.3)', () => {
    it('should delete a trip successfully', async () => {
      // Step 1: 旅行を作成
      const createRequest = new Request('http://localhost/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripName: '沖縄旅行',
          members: [{ name: '中村' }]
        })
      })

      const createResponse = await onRequestPost({ request: createRequest, env })
      const createdTrip: Trip = await createResponse.json()

      // Step 2: 旅行を削除
      const deleteRequest = new Request(`http://localhost/api/trips/${createdTrip.tripId}`, {
        method: 'DELETE'
      })

      const deleteResponse = await onRequestDelete({
        request: deleteRequest,
        env,
        params: { tripId: createdTrip.tripId }
      })
      expect(deleteResponse.status).toBe(200)

      const deleteResult = await deleteResponse.json()
      expect(deleteResult.success).toBe(true)

      // Step 3: 削除された旅行を取得しようとすると404が返る
      const getRequest = new Request(`http://localhost/api/trips/${createdTrip.tripId}`, {
        method: 'GET'
      })

      const getResponse = await onRequestGet({
        request: getRequest,
        env,
        params: { tripId: createdTrip.tripId }
      })
      expect(getResponse.status).toBe(404)

      const errorResult = await getResponse.json()
      expect(errorResult.error).toBe('旅行が見つかりません')
    })
  })

  describe('エラーレスポンスのテスト (要件 9.5)', () => {
    describe('POST /api/trips エラー', () => {
      it('should return 400 when trip name is empty', async () => {
        const request = new Request('http://localhost/api/trips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tripName: ''
          })
        })

        const response = await onRequestPost({ request, env })
        expect(response.status).toBe(400)

        const result = await response.json()
        expect(result.error).toBe('旅行名を入力してください')
      })

      it('should return 400 when trip name is missing', async () => {
        const request = new Request('http://localhost/api/trips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })

        const response = await onRequestPost({ request, env })
        expect(response.status).toBe(400)

        const result = await response.json()
        expect(result.error).toBe('旅行名を入力してください')
      })

      it('should return 400 when member name is empty', async () => {
        const request = new Request('http://localhost/api/trips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tripName: '北海道旅行',
            members: [{ name: '' }]
          })
        })

        const response = await onRequestPost({ request, env })
        expect(response.status).toBe(400)

        const result = await response.json()
        expect(result.error).toBe('メンバー名を入力してください')
      })

      it('should return 400 when request body is invalid JSON', async () => {
        const request = new Request('http://localhost/api/trips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'invalid json'
        })

        const response = await onRequestPost({ request, env })
        expect(response.status).toBe(400)

        const result = await response.json()
        expect(result.error).toBe('リクエストが不正です')
      })
    })

    describe('GET /api/trips/:tripId エラー', () => {
      it('should return 404 when trip does not exist', async () => {
        const request = new Request('http://localhost/api/trips/nonexistent_trip', {
          method: 'GET'
        })

        const response = await onRequestGet({
          request,
          env,
          params: { tripId: 'nonexistent_trip' }
        })
        expect(response.status).toBe(404)

        const result = await response.json()
        expect(result.error).toBe('旅行が見つかりません')
      })
    })

    describe('PUT /api/trips/:tripId エラー', () => {
      it('should return 404 when updating non-existent trip', async () => {
        const request = new Request('http://localhost/api/trips/nonexistent_trip', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tripName: '更新された旅行',
            members: [],
            receipts: []
          })
        })

        const response = await onRequestPut({
          request,
          env,
          params: { tripId: 'nonexistent_trip' }
        })
        expect(response.status).toBe(404)

        const result = await response.json()
        expect(result.error).toBe('旅行が見つかりません')
      })

      it('should return 400 when request body is invalid JSON', async () => {
        // まず旅行を作成
        const createRequest = new Request('http://localhost/api/trips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tripName: '福岡旅行'
          })
        })

        const createResponse = await onRequestPost({ request: createRequest, env })
        const createdTrip: Trip = await createResponse.json()

        // 不正なJSONで更新を試みる
        const updateRequest = new Request(`http://localhost/api/trips/${createdTrip.tripId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: 'invalid json'
        })

        const updateResponse = await onRequestPut({
          request: updateRequest,
          env,
          params: { tripId: createdTrip.tripId }
        })
        expect(updateResponse.status).toBe(400)

        const result = await updateResponse.json()
        expect(result.error).toBe('リクエストが不正です')
      })
    })
  })

  describe('完全なフロー統合テスト', () => {
    it('should handle complete trip lifecycle: create -> update -> get -> delete', async () => {
      // 1. 旅行作成
      const createRequest = new Request('http://localhost/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripName: '箱根旅行',
          members: [
            { name: '山本' },
            { name: '小林' }
          ]
        })
      })

      const createResponse = await onRequestPost({ request: createRequest, env })
      expect(createResponse.status).toBe(201)
      const createdTrip: Trip = await createResponse.json()
      expect(createdTrip.version).toBe(1)

      // 2. 旅行更新（メンバー追加）
      const updatedData = {
        ...createdTrip,
        members: [
          ...createdTrip.members,
          { id: 'm3', name: '加藤', createdAt: new Date().toISOString() }
        ]
      }

      const updateRequest = new Request(`http://localhost/api/trips/${createdTrip.tripId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      })

      const updateResponse = await onRequestPut({
        request: updateRequest,
        env,
        params: { tripId: createdTrip.tripId }
      })
      expect(updateResponse.status).toBe(200)
      const updatedTrip: Trip = await updateResponse.json()
      expect(updatedTrip.version).toBe(2)
      expect(updatedTrip.members).toHaveLength(3)

      // 3. 旅行取得
      const getRequest = new Request(`http://localhost/api/trips/${createdTrip.tripId}`, {
        method: 'GET'
      })

      const getResponse = await onRequestGet({
        request: getRequest,
        env,
        params: { tripId: createdTrip.tripId }
      })
      expect(getResponse.status).toBe(200)
      const retrievedTrip: Trip = await getResponse.json()
      expect(retrievedTrip.version).toBe(2)
      expect(retrievedTrip.members).toHaveLength(3)

      // 4. 旅行削除
      const deleteRequest = new Request(`http://localhost/api/trips/${createdTrip.tripId}`, {
        method: 'DELETE'
      })

      const deleteResponse = await onRequestDelete({
        request: deleteRequest,
        env,
        params: { tripId: createdTrip.tripId }
      })
      expect(deleteResponse.status).toBe(200)

      // 5. 削除後の取得で404を確認
      const getAfterDeleteRequest = new Request(`http://localhost/api/trips/${createdTrip.tripId}`, {
        method: 'GET'
      })

      const getAfterDeleteResponse = await onRequestGet({
        request: getAfterDeleteRequest,
        env,
        params: { tripId: createdTrip.tripId }
      })
      expect(getAfterDeleteResponse.status).toBe(404)
    })
  })
})
