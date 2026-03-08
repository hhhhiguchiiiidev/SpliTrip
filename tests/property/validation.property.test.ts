import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  validateTripName,
  validateMemberName,
  validateReceiptAmount,
  validatePayerId,
  validateSelectedMembers,
  validateFixedAmountSum,
  validateRatios
} from '@shared/utils/validation'

describe('Validation Property Tests', () => {
  // Feature: splitrip-expense-tracker, Property 28: 旅行名の非空検証
  describe('Property 28: 旅行名の非空検証', () => {
    it('旅行名が空の場合、システムは旅行作成を拒否しなければならない', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', '   ', '\t', '\n', '  \t\n  '), // 空文字列とホワイトスペースのみの文字列
          (tripName) => {
            const result = validateTripName(tripName)
            
            // バリデーションが失敗することを確認
            expect(result.valid).toBe(false)
            expect(result.error).toBe('旅行名を入力してください')
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('旅行名が非空の場合、システムは旅行作成を受け入れなければならない', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), // 非空文字列
          (tripName) => {
            const result = validateTripName(tripName)
            
            // バリデーションが成功することを確認
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: splitrip-expense-tracker, Property 29: メンバー名の非空検証
  describe('Property 29: メンバー名の非空検証', () => {
    it('メンバー名が空の場合、システムはメンバー追加を拒否しなければならない', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', '   ', '\t', '\n', '  \t\n  '), // 空文字列とホワイトスペースのみの文字列
          (memberName) => {
            const result = validateMemberName(memberName)
            
            // バリデーションが失敗することを確認
            expect(result.valid).toBe(false)
            expect(result.error).toBe('メンバー名を入力してください')
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('メンバー名が非空の場合、システムはメンバー追加を受け入れなければならない', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // 非空文字列
          (memberName) => {
            const result = validateMemberName(memberName)
            
            // バリデーションが成功することを確認
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: splitrip-expense-tracker, Property 30: 正の金額検証
  describe('Property 30: 正の金額検証', () => {
    it('合計金額が0以下の場合、システムはレシート作成を拒否しなければならない', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000000, max: 0 }), // 0以下の金額
          (amount) => {
            const result = validateReceiptAmount(amount)
            
            // バリデーションが失敗することを確認
            expect(result.valid).toBe(false)
            expect(result.error).toBe('合計金額は正の数を入力してください')
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('合計金額が正の場合、システムはレシート作成を受け入れなければならない', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }), // 正の金額
          (amount) => {
            const result = validateReceiptAmount(amount)
            
            // バリデーションが成功することを確認
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: splitrip-expense-tracker, Property 31: 有効な支払い者ID検証
  describe('Property 31: 有効な支払い者ID検証', () => {
    it('支払い者IDがメンバーリストに存在しない場合、システムはレシート作成を拒否しなければならない', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 50 }), // メンバーID配列
          fc.string({ minLength: 1, maxLength: 10 }), // 支払い者ID
          (memberIds, payerId) => {
            // 支払い者IDがメンバーリストに存在しない場合のみテスト
            fc.pre(!memberIds.includes(payerId))
            
            const result = validatePayerId(payerId, memberIds)
            
            // バリデーションが失敗することを確認
            expect(result.valid).toBe(false)
            expect(result.error).toBe('無効な支払い者IDです')
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('支払い者IDが空の場合、システムはレシート作成を拒否しなければならない', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 50 }), // メンバーID配列
          (memberIds) => {
            const result = validatePayerId('', memberIds)
            
            // バリデーションが失敗することを確認
            expect(result.valid).toBe(false)
            expect(result.error).toBe('支払い者を選択してください')
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('支払い者IDがメンバーリストに存在する場合、システムはレシート作成を受け入れなければならない', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 50 }).chain(memberIds => 
            fc.tuple(
              fc.constant(memberIds),
              fc.constantFrom(...memberIds) // メンバーリストから1つ選択
            )
          ),
          ([memberIds, payerId]) => {
            const result = validatePayerId(payerId, memberIds)
            
            // バリデーションが成功することを確認
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: splitrip-expense-tracker, Property 32: メンバー選択の非空検証
  describe('Property 32: メンバー選択の非空検証', () => {
    it('対象モードが「選択」で選択メンバーが空の場合、システムはレシート作成を拒否しなければならない', () => {
      const result = validateSelectedMembers([])
      
      // バリデーションが失敗することを確認
      expect(result.valid).toBe(false)
      expect(result.error).toBe('対象メンバーを選択してください')
    })
    
    it('選択メンバーが少なくとも1人存在する場合、システムはレシート作成を受け入れなければならない', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 50 }), // 非空のメンバーID配列
          (selectedMemberIds) => {
            const result = validateSelectedMembers(selectedMemberIds)
            
            // バリデーションが成功することを確認
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: splitrip-expense-tracker, Property 12 & 要件12.6: 金額指定配分の合計検証
  describe('Property 12: 金額指定配分の合計検証', () => {
    it('金額指定の合計が合計金額と等しくない場合、システムはレシート作成を拒否しなければならない', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }), // 合計金額
          fc.array(
            fc.record({
              memberId: fc.string({ minLength: 1, maxLength: 10 }),
              amount: fc.integer({ min: 0, max: 100000 })
            }),
            { minLength: 1, maxLength: 50 }
          ), // 金額指定配列
          (totalAmount, fixedAmounts) => {
            const sum = fixedAmounts.reduce((s, item) => s + item.amount, 0)
            
            // 合計が一致しない場合のみテスト
            fc.pre(sum !== totalAmount)
            
            const result = validateFixedAmountSum(fixedAmounts, totalAmount)
            
            // バリデーションが失敗することを確認
            expect(result.valid).toBe(false)
            expect(result.error).toBe('金額指定の合計が合計金額と一致しません')
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('金額指定の合計が合計金額と等しい場合、システムはレシート作成を受け入れなければならない', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }).chain(total =>
            fc.tuple(
              fc.constant(total),
              fc.array(
                fc.record({
                  memberId: fc.string({ minLength: 1, maxLength: 10 }),
                  amount: fc.integer({ min: 0, max: total })
                }),
                { minLength: 1, maxLength: 50 }
              ).map(inputs => {
                // 金額の合計を調整してtotalと一致させる
                if (inputs.length === 0) return inputs
                
                const sum = inputs.reduce((acc, input) => acc + input.amount, 0)
                if (sum === 0) {
                  inputs[0].amount = total
                } else {
                  let allocated = 0
                  for (let i = 0; i < inputs.length - 1; i++) {
                    inputs[i].amount = Math.floor(total * inputs[i].amount / sum)
                    allocated += inputs[i].amount
                  }
                  inputs[inputs.length - 1].amount = total - allocated
                }
                return inputs
              })
            )
          ),
          ([totalAmount, fixedAmounts]) => {
            const result = validateFixedAmountSum(fixedAmounts, totalAmount)
            
            // バリデーションが成功することを確認
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: splitrip-expense-tracker, Property 33: 正の比率検証
  describe('Property 33: 正の比率検証', () => {
    it('いずれかの比率が0以下の場合、システムはレシート作成を拒否しなければならない', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              memberId: fc.string({ minLength: 1, maxLength: 10 }),
              ratio: fc.integer({ min: -1000, max: 1000 })
            }),
            { minLength: 1, maxLength: 50 }
          ), // 比率配列
          (ratios) => {
            // 少なくとも1つの比率が0以下の場合のみテスト
            fc.pre(ratios.some(r => r.ratio <= 0))
            
            const result = validateRatios(ratios)
            
            // バリデーションが失敗することを確認
            expect(result.valid).toBe(false)
            expect(result.error).toBe('比率は正の数を入力してください')
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('すべての比率が正の場合、システムはレシート作成を受け入れなければならない', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              memberId: fc.string({ minLength: 1, maxLength: 10 }),
              ratio: fc.integer({ min: 1, max: 1000 })
            }),
            { minLength: 1, maxLength: 50 }
          ), // 正の比率配列
          (ratios) => {
            const result = validateRatios(ratios)
            
            // バリデーションが成功することを確認
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
