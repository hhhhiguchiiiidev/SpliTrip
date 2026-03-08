import { Trip } from '../types/trip'
import { Settlement } from '../types/settlement'

/**
 * 精算計算
 * 各メンバーの立替合計、負担合計、差額を計算する
 * 
 * @param trip 旅行データ
 * @returns 精算結果配列
 */
export function calculateSettlements(trip: Trip): Settlement[] {
  const settlements = new Map<string, Settlement>()
  
  // 初期化
  for (const member of trip.members) {
    settlements.set(member.id, {
      memberId: member.id,
      memberName: member.name,
      paidTotal: 0,
      owedTotal: 0,
      balance: 0
    })
  }
  
  // 立替合計と負担合計を計算
  for (const receipt of trip.receipts) {
    // 立替合計
    const payer = settlements.get(receipt.payerId)
    if (payer) {
      payer.paidTotal += receipt.amount
    }
    
    // 負担合計
    for (const split of receipt.splits) {
      const member = settlements.get(split.memberId)
      if (member) {
        member.owedTotal += split.amount
      }
    }
  }
  
  // 差額を計算
  for (const settlement of settlements.values()) {
    settlement.balance = settlement.paidTotal - settlement.owedTotal
  }
  
  return Array.from(settlements.values())
}

/**
 * 精算検証
 * すべてのメンバーの差額の合計がゼロであることを検証する
 * 
 * @param settlements 精算結果配列
 * @returns 差額の合計がゼロの場合true
 */
export function validateSettlements(settlements: Settlement[]): boolean {
  const totalBalance = settlements.reduce((sum, s) => sum + s.balance, 0)
  return Math.abs(totalBalance) < 0.01 // 浮動小数点誤差を考慮
}
