import { Trip } from '../types/trip'
import { TripListItem } from '../types/tripListItem'
import { serializeTrip, deserializeTrip } from '../utils/serialization'

/**
 * TripRepository - 旅行データの永続化を管理
 * KV操作とデータ変換を統合
 */
export class TripRepository {
  constructor(private kv: KVNamespace) {}
  
  /**
   * 旅行データを保存
   * @param trip 保存する旅行データ
   */
  async save(trip: Trip): Promise<void> {
    const key = `trip:${trip.tripId}`
    const json = serializeTrip(trip)
    await this.kv.put(key, json)
  }
  
  /**
   * 旅行データを取得
   * @param tripId 旅行ID
   * @returns 旅行データ、存在しない場合はnull
   */
  async get(tripId: string): Promise<Trip | null> {
    const key = `trip:${tripId}`
    const json = await this.kv.get(key)
    
    if (!json) {
      return null
    }
    
    try {
      return deserializeTrip(json)
    } catch (error) {
      console.error('Failed to deserialize trip:', error)
      throw new Error('Invalid trip data in storage')
    }
  }
  
  /**
   * 旅行データを削除
   * @param tripId 旅行ID
   */
  async delete(tripId: string): Promise<void> {
    const key = `trip:${tripId}`
    await this.kv.delete(key)
  }
  
  /**
   * すべての旅行のリストを取得
   * @returns 旅行リスト（作成日時降順）
   */
  async list(): Promise<TripListItem[]> {
    // KVから'trip:'プレフィックスを持つすべてのキーを取得
    const listResult = await this.kv.list({ prefix: 'trip:' })
    
    // 各キーから旅行データを取得してTripListItemに変換
    const tripListItems: TripListItem[] = []
    
    for (const key of listResult.keys) {
      const json = await this.kv.get(key.name)
      
      if (json) {
        try {
          const trip = deserializeTrip(json)
          tripListItems.push({
            tripId: trip.tripId,
            tripName: trip.tripName,
            memberCount: trip.members.length,
            createdAt: trip.createdAt
          })
        } catch (error) {
          console.error(`Failed to deserialize trip ${key.name}:`, error)
          // エラーが発生した旅行はスキップして続行
        }
      }
    }
    
    // 作成日時降順でソート
    tripListItems.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    
    return tripListItems
  }
}
