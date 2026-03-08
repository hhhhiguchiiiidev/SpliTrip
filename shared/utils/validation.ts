/**
 * バリデーション結果
 */
export type ValidationResult = {
  valid: boolean
  error?: string
}

/**
 * 旅行名のバリデーション
 * 要件 12.1: 空でない旅行名を要求
 * 
 * @param tripName 旅行名
 * @returns バリデーション結果
 */
export function validateTripName(tripName: string): ValidationResult {
  if (!tripName || tripName.trim() === '') {
    return {
      valid: false,
      error: '旅行名を入力してください'
    }
  }
  
  return { valid: true }
}

/**
 * メンバー名のバリデーション
 * 要件 12.2: 空でないメンバー名を要求
 * 
 * @param memberName メンバー名
 * @returns バリデーション結果
 */
export function validateMemberName(memberName: string): ValidationResult {
  if (!memberName || memberName.trim() === '') {
    return {
      valid: false,
      error: 'メンバー名を入力してください'
    }
  }
  
  return { valid: true }
}

/**
 * レシート金額のバリデーション
 * 要件 12.3: 正の合計金額を要求
 * 
 * @param amount 金額
 * @returns バリデーション結果
 */
export function validateReceiptAmount(amount: number): ValidationResult {
  if (amount <= 0) {
    return {
      valid: false,
      error: '合計金額は正の数を入力してください'
    }
  }
  
  return { valid: true }
}

/**
 * 支払い者IDのバリデーション
 * 要件 12.4: メンバーリストからの有効な支払い者IDを要求
 * 
 * @param payerId 支払い者ID
 * @param memberIds メンバーID配列
 * @returns バリデーション結果
 */
export function validatePayerId(payerId: string, memberIds: string[]): ValidationResult {
  if (!payerId) {
    return {
      valid: false,
      error: '支払い者を選択してください'
    }
  }
  
  if (!memberIds.includes(payerId)) {
    return {
      valid: false,
      error: '無効な支払い者IDです'
    }
  }
  
  return { valid: true }
}

/**
 * 選択メンバーのバリデーション
 * 要件 12.5: 少なくとも1人のメンバーが選択されることを要求
 * 
 * @param selectedMemberIds 選択されたメンバーID配列
 * @returns バリデーション結果
 */
export function validateSelectedMembers(selectedMemberIds: string[]): ValidationResult {
  if (!selectedMemberIds || selectedMemberIds.length === 0) {
    return {
      valid: false,
      error: '対象メンバーを選択してください'
    }
  }
  
  return { valid: true }
}

/**
 * 金額指定配分の合計のバリデーション
 * 要件 12.6: 金額指定の合計が合計金額と等しいことを要求
 * 
 * @param fixedAmounts 金額指定配列
 * @param totalAmount 合計金額
 * @returns バリデーション結果
 */
export function validateFixedAmountSum(
  fixedAmounts: { memberId: string; amount: number }[],
  totalAmount: number
): ValidationResult {
  const sum = fixedAmounts.reduce((s, item) => s + item.amount, 0)
  
  if (sum !== totalAmount) {
    return {
      valid: false,
      error: '金額指定の合計が合計金額と一致しません'
    }
  }
  
  return { valid: true }
}

/**
 * 比率のバリデーション
 * 要件 12.7: すべての比率が正の数であることを要求
 * 
 * @param ratios 比率配列
 * @returns バリデーション結果
 */
export function validateRatios(
  ratios: { memberId: string; ratio: number }[]
): ValidationResult {
  for (const item of ratios) {
    if (item.ratio <= 0) {
      return {
        valid: false,
        error: '比率は正の数を入力してください'
      }
    }
  }
  
  return { valid: true }
}
