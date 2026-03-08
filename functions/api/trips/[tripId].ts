import { Env } from '../../../shared/types/env'
import { TripRepository } from '../../../shared/repository/tripRepository'

/**
 * GET /api/trips/:tripId
 * 旅行データ取得エンドポイント
 * 要件: 1.4, 9.2
 */
export async function onRequestGet(context: {
  request: Request
  env: Env
  params: { tripId: string }
}) {
  try {
    const repository = new TripRepository(context.env.TRIPS_KV)
    const trip = await repository.get(context.params.tripId)
    
    // 旅行が存在しない場合（要件 9.5）
    if (!trip) {
      return new Response(
        JSON.stringify({ error: '旅行が見つかりません' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    return new Response(JSON.stringify(trip), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error getting trip:', error)
    return new Response(
      JSON.stringify({ error: 'サーバーエラーが発生しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * PUT /api/trips/:tripId
 * 旅行データ更新エンドポイント
 * 要件: 1.5, 9.3, 9.4
 */
export async function onRequestPut(context: {
  request: Request
  env: Env
  params: { tripId: string }
}) {
  try {
    const body = await context.request.json() as any
    const repository = new TripRepository(context.env.TRIPS_KV)
    
    // 既存の旅行を取得（要件 1.5）
    const existingTrip = await repository.get(context.params.tripId)
    if (!existingTrip) {
      return new Response(
        JSON.stringify({ error: '旅行が見つかりません' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // バージョンをインクリメント（要件 1.5, 6.4）
    const updatedTrip = {
      ...body,
      tripId: context.params.tripId,
      version: existingTrip.version + 1,
      updatedAt: new Date().toISOString()
    }
    
    // KVに保存（要件 9.4）
    await repository.save(updatedTrip)
    
    return new Response(JSON.stringify(updatedTrip), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error updating trip:', error)
    
    // JSONパースエラーの場合
    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({ error: 'リクエストが不正です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    return new Response(
      JSON.stringify({ error: 'サーバーエラーが発生しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * DELETE /api/trips/:tripId
 * 旅行削除エンドポイント
 * 要件: 1.6, 9.3
 */
export async function onRequestDelete(context: {
  request: Request
  env: Env
  params: { tripId: string }
}) {
  try {
    const repository = new TripRepository(context.env.TRIPS_KV)
    
    // 旅行を削除（要件 1.6）
    await repository.delete(context.params.tripId)
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error deleting trip:', error)
    return new Response(
      JSON.stringify({ error: 'サーバーエラーが発生しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
