import { Env } from '../../../shared/types/env'
import { TripRepository } from '../../../shared/repository/tripRepository'
import { generateTripId, generateMemberId } from '../../../shared/utils/idGenerator'
import { Trip } from '../../../shared/types/trip'
import { Member } from '../../../shared/types/member'
import { validateTripName, validateMemberName } from '../../../shared/utils/validation'

/**
 * POST /api/trips
 * 新規旅行作成エンドポイント
 * 要件: 1.1, 1.2, 9.1
 */
export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const body = await context.request.json() as any
    
    // 旅行名のバリデーション（要件 12.1）
    const tripNameValidation = validateTripName(body.tripName)
    if (!tripNameValidation.valid) {
      return new Response(
        JSON.stringify({ error: tripNameValidation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // メンバーのバリデーションと作成
    const members: Member[] = []
    if (body.members && Array.isArray(body.members)) {
      for (let i = 0; i < body.members.length; i++) {
        const memberData = body.members[i]
        
        // メンバー名のバリデーション（要件 12.2）
        const memberNameValidation = validateMemberName(memberData.name)
        if (!memberNameValidation.valid) {
          return new Response(
            JSON.stringify({ error: memberNameValidation.error }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        }
        
        // メンバー作成（要件 1.3）
        members.push({
          id: generateMemberId(i),
          name: memberData.name,
          createdAt: new Date().toISOString()
        })
      }
    }
    
    // 旅行作成（要件 1.1, 1.2）
    const trip: Trip = {
      tripId: generateTripId(),
      tripName: body.tripName,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members,
      receipts: []
    }
    
    // KVに保存（要件 6.1, 6.2）
    const repository = new TripRepository(context.env.TRIPS_KV)
    await repository.save(trip)
    
    return new Response(JSON.stringify(trip), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error creating trip:', error)
    
    // JSONパースエラーの場合
    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({ error: 'リクエストが不正です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // その他のエラー（要件 9.5）
    return new Response(
      JSON.stringify({ error: 'サーバーエラーが発生しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
