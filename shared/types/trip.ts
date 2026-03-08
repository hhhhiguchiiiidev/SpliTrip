import { Member } from './member'
import { Receipt } from './receipt'
import { Subgroup } from './subgroup'

export type Trip = {
  tripId: string          // 一意の旅行ID（例: trip_20260308_abc123）
  tripName: string        // 旅行名
  version: number         // バージョン番号（更新のたびにインクリメント）
  createdAt: string       // 作成日時（ISO 8601形式）
  updatedAt: string       // 更新日時（ISO 8601形式）
  members: Member[]       // メンバー配列
  receipts: Receipt[]     // レシート配列
  subgroups: Subgroup[]   // サブグループ配列（デフォルト値: []）
}
