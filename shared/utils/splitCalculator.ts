import { SplitResult, SplitRatioInput, SplitFixedInput } from '../types/receipt'

/**
 * 一律割（Equal Split）
 * 合計金額を対象メンバー間で均等に分割する
 * 端数は最初のメンバーから順に1円ずつ配分する
 * 
 * @param total 合計金額
 * @param memberIds 対象メンバーID配列
 * @returns 分割結果
 */
export function splitEvenly(total: number, memberIds: string[]): SplitResult[] {
  const count = memberIds.length
  const baseAmount = Math.floor(total / count)
  const remainder = total - (baseAmount * count)
  
  return memberIds.map((memberId, index) => ({
    memberId,
    amount: baseAmount + (index < remainder ? 1 : 0)
  }))
}

/**
 * 比率配分（Ratio Split）
 * 提供されたパーセンテージ比率に基づいて合計金額を比例配分する
 * 端数は最後のメンバーに寄せる
 * 
 * @param total 合計金額
 * @param ratioInputs 比率入力配列
 * @returns 分割結果
 */
export function splitByRatio(
  total: number,
  ratioInputs: SplitRatioInput[]
): SplitResult[] {
  const ratioSum = ratioInputs.reduce((sum, input) => sum + input.ratio, 0)
  
  let allocated = 0
  const results: SplitResult[] = []
  
  for (let i = 0; i < ratioInputs.length; i++) {
    const input = ratioInputs[i]
    let amount: number
    
    if (i === ratioInputs.length - 1) {
      // 最後のメンバーに残りを割り当て（端数調整）
      amount = total - allocated
    } else {
      amount = Math.floor(total * input.ratio / ratioSum)
      allocated += amount
    }
    
    results.push({
      memberId: input.memberId,
      amount
    })
  }
  
  return results
}

/**
 * 金額指定配分（Fixed Amount Split）
 * 各メンバーに指定された正確な金額を割り当てる
 * 金額指定の合計が合計金額と一致することを検証する
 * 
 * @param total 合計金額
 * @param fixedInputs 金額指定入力配列
 * @returns 分割結果
 * @throws 金額指定の合計が合計金額と一致しない場合
 */
export function splitByFixed(
  total: number,
  fixedInputs: SplitFixedInput[]
): SplitResult[] {
  const sum = fixedInputs.reduce((s, input) => s + input.amount, 0)
  
  if (sum !== total) {
    throw new Error('金額指定の合計が合計金額と一致しません')
  }
  
  return fixedInputs.map(input => ({
    memberId: input.memberId,
    amount: input.amount
  }))
}
