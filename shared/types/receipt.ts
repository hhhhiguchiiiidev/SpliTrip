export type SplitRatioInput = {
  memberId: string        // メンバーID
  ratio: number           // 比率（パーセンテージ、デフォルト100）
}

export type SplitFixedInput = {
  memberId: string        // メンバーID
  amount: number          // 金額
}

export type SplitResult = {
  memberId: string        // メンバーID
  amount: number          // 分割金額
}

export type Receipt = {
  id: string                          // 一意のレシートID（例: r1, r2, r3）
  title?: string                      // 用途（任意）
  amount: number                      // 合計金額
  payerId: string                     // 支払い者のメンバーID
  targetMode: "all" | "selected"      // 割り対象モード
  splitMode: "equal" | "ratio" | "fixed"  // 分割モード
  selectedMemberIds: string[]         // 選択されたメンバーID配列
  ratioInputs?: SplitRatioInput[]     // 比率入力（比率配分時のみ）
  fixedInputs?: SplitFixedInput[]     // 金額指定入力（金額指定配分時のみ）
  splits: SplitResult[]               // 分割結果
  createdAt: string                   // 作成日時（ISO 8601形式）
  updatedAt: string                   // 更新日時（ISO 8601形式）
}
