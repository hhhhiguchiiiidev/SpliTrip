import { Trip } from '../../shared/types/trip'

/**
 * フロントエンドAPIクライアント
 * 要件: 9.1, 9.2, 9.3
 */

// APIベースURL（開発環境とプロダクション環境で自動切り替え）
const API_BASE_URL = '/api'

/**
 * 新規旅行作成リクエストの型
 */
export type CreateTripRequest = {
  tripName: string
  members: { name: string }[]
}

/**
 * APIエラーレスポンスの型
 */
export type ApiErrorResponse = {
  error: string
}

/**
 * 旅行削除レスポンスの型
 */
export type DeleteTripResponse = {
  success: boolean
}

/**
 * POST /api/trips
 * 新規旅行を作成
 * 要件: 9.1
 * 
 * @param request - 旅行作成リクエスト
 * @returns 作成された旅行データ
 * @throws APIエラーが発生した場合
 */
export async function createTrip(request: CreateTripRequest): Promise<Trip> {
  const response = await fetch(`${API_BASE_URL}/trips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json()
    throw new Error(errorData.error || 'サーバーエラーが発生しました')
  }

  return await response.json()
}

/**
 * GET /api/trips/:tripId
 * 旅行データを取得
 * 要件: 9.2
 * 
 * @param tripId - 旅行ID
 * @returns 旅行データ
 * @throws 旅行が見つからない場合、またはAPIエラーが発生した場合
 */
export async function getTrip(tripId: string): Promise<Trip> {
  const response = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json()
    throw new Error(errorData.error || 'サーバーエラーが発生しました')
  }

  return await response.json()
}

/**
 * PUT /api/trips/:tripId
 * 旅行データを更新
 * 要件: 9.3
 * 
 * @param trip - 更新する旅行データ（全体を送信）
 * @returns 更新された旅行データ
 * @throws 旅行が見つからない場合、またはAPIエラーが発生した場合
 */
export async function updateTrip(trip: Trip): Promise<Trip> {
  const response = await fetch(`${API_BASE_URL}/trips/${trip.tripId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(trip)
  })

  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json()
    throw new Error(errorData.error || 'サーバーエラーが発生しました')
  }

  return await response.json()
}

/**
 * DELETE /api/trips/:tripId
 * 旅行を削除
 * 要件: 9.3
 * 
 * @param tripId - 旅行ID
 * @returns 削除成功レスポンス
 * @throws APIエラーが発生した場合
 */
export async function deleteTrip(tripId: string): Promise<DeleteTripResponse> {
  const response = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json()
    throw new Error(errorData.error || 'サーバーエラーが発生しました')
  }

  return await response.json()
}
