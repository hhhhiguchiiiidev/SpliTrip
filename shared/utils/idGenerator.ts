/**
 * 旅行IDを生成する
 * 形式: trip_YYYYMMDD_ランダム文字列
 * 例: trip_20260308_abc123
 */
export function generateTripId(): string {
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 8)
  return `trip_${timestamp}_${random}`
}

/**
 * メンバーIDを生成する
 * 形式: m{連番}
 * 例: m1, m2, m3
 */
export function generateMemberId(existingMemberCount: number): string {
  return `m${existingMemberCount + 1}`
}

/**
 * レシートIDを生成する
 * 形式: r{連番}
 * 例: r1, r2, r3
 */
export function generateReceiptId(existingReceiptCount: number): string {
  return `r${existingReceiptCount + 1}`
}
