export type Settlement = {
  memberId: string        // メンバーID
  memberName: string      // メンバー名
  paidTotal: number       // 立替合計
  owedTotal: number       // 負担合計
  balance: number         // 差額（paidTotal - owedTotal）
}
