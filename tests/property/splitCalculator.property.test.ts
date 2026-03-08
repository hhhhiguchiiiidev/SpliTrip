import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { splitEvenly, splitByRatio, splitByFixed } from '@shared/utils/splitCalculator'
import { SplitRatioInput, SplitFixedInput } from '@shared/types/receipt'

describe('Split Calculator Property Tests', () => {
  // Feature: splitrip-expense-tracker, Property 9: 一律割の均等性
  describe('Property 9: 一律割の均等性', () => {
    it('各メンバーの分割金額の差は最大1円以内でなければならない', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }), // 合計金額
          fc.integer({ min: 1, max: 50 }).chain(count => 
            fc.tuple(
              fc.constant(count),
              fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: count, maxLength: count })
            )
          ), // メンバー数とメンバーID配列
          (total, [count, memberIds]) => {
            const results = splitEvenly(total, memberIds)
            
            // すべての分割結果が存在することを確認
            expect(results).toHaveLength(count)
            
            // 各メンバーの分割金額を取得
            const amounts = results.map(r => r.amount)
            
            // 最小値と最大値の差が1円以内であることを確認
            const minAmount = Math.min(...amounts)
            const maxAmount = Math.max(...amounts)
            expect(maxAmount - minAmount).toBeLessThanOrEqual(1)
            
            // 分割金額の合計が合計金額と一致することを確認
            const sum = amounts.reduce((acc, amount) => acc + amount, 0)
            expect(sum).toBe(total)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: splitrip-expense-tracker, Property 10: 比率配分の比例性
  describe('Property 10: 比率配分の比例性', () => {
    it('各メンバーの分割金額は比率に基づいて計算されなければならない（±1円以内）', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }), // 合計金額
          fc.integer({ min: 1, max: 50 }).chain(count =>
            fc.array(
              fc.record({
                memberId: fc.string({ minLength: 1, maxLength: 10 }),
                ratio: fc.integer({ min: 1, max: 1000 })
              }),
              { minLength: count, maxLength: count }
            )
          ), // 比率入力配列
          (total, ratioInputs) => {
            const results = splitByRatio(total, ratioInputs)
            
            // すべての分割結果が存在することを確認
            expect(results).toHaveLength(ratioInputs.length)
            
            // 比率の合計を計算
            const ratioSum = ratioInputs.reduce((sum, input) => sum + input.ratio, 0)
            
            // 各メンバーの分割金額が期待値の±1円以内であることを確認
            results.forEach((result, index) => {
              const expectedAmount = Math.floor(total * ratioInputs[index].ratio / ratioSum)
              const actualAmount = result.amount
              
              // 最後のメンバーは端数調整があるため、より緩い検証
              if (index === results.length - 1) {
                // 分割金額の合計が合計金額と一致することで検証
                const sum = results.reduce((acc, r) => acc + r.amount, 0)
                expect(sum).toBe(total)
              } else {
                // 期待値との差が±1円以内であることを確認
                expect(Math.abs(actualAmount - expectedAmount)).toBeLessThanOrEqual(1)
              }
            })
            
            // 分割金額の合計が合計金額と一致することを確認
            const sum = results.reduce((acc, r) => acc + r.amount, 0)
            expect(sum).toBe(total)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: splitrip-expense-tracker, Property 11: 金額指定配分の正確性
  describe('Property 11: 金額指定配分の正確性', () => {
    it('各メンバーの分割金額は指定された金額と正確に一致しなければならない', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }).chain(total =>
            fc.tuple(
              fc.constant(total),
              fc.integer({ min: 1, max: 50 }).chain(count => {
                // 合計がtotalになるように金額を生成
                return fc.array(
                  fc.record({
                    memberId: fc.string({ minLength: 1, maxLength: 10 }),
                    amount: fc.integer({ min: 0, max: total })
                  }),
                  { minLength: count, maxLength: count }
                ).map(inputs => {
                  // 金額の合計を調整してtotalと一致させる
                  const sum = inputs.reduce((acc, input) => acc + input.amount, 0)
                  if (sum === 0) {
                    // すべて0の場合は最初のメンバーにtotalを割り当て
                    inputs[0].amount = total
                  } else {
                    // 比例配分で調整
                    let allocated = 0
                    for (let i = 0; i < inputs.length - 1; i++) {
                      inputs[i].amount = Math.floor(total * inputs[i].amount / sum)
                      allocated += inputs[i].amount
                    }
                    inputs[inputs.length - 1].amount = total - allocated
                  }
                  return inputs
                })
              })
            )
          ),
          ([total, fixedInputs]) => {
            const results = splitByFixed(total, fixedInputs)
            
            // すべての分割結果が存在することを確認
            expect(results).toHaveLength(fixedInputs.length)
            
            // 各メンバーの分割金額が指定された金額と一致することを確認
            results.forEach((result, index) => {
              expect(result.amount).toBe(fixedInputs[index].amount)
              expect(result.memberId).toBe(fixedInputs[index].memberId)
            })
            
            // 分割金額の合計が合計金額と一致することを確認
            const sum = results.reduce((acc, r) => acc + r.amount, 0)
            expect(sum).toBe(total)
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('金額指定の合計が合計金額と一致しない場合はエラーを投げなければならない', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }), // 合計金額
          fc.integer({ min: 1, max: 50 }).chain(count =>
            fc.array(
              fc.record({
                memberId: fc.string({ minLength: 1, maxLength: 10 }),
                amount: fc.integer({ min: 0, max: 100000 })
              }),
              { minLength: count, maxLength: count }
            )
          ), // 金額指定入力配列
          (total, fixedInputs) => {
            const sum = fixedInputs.reduce((acc, input) => acc + input.amount, 0)
            
            // 合計が一致しない場合のみテスト
            if (sum !== total) {
              expect(() => splitByFixed(total, fixedInputs)).toThrow('金額指定の合計が合計金額と一致しません')
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: splitrip-expense-tracker, Property 24: 端数処理の一貫性
  describe('Property 24: 端数処理の一貫性', () => {
    it('分割金額の合計がレシート合計金額と正確に一致しなければならない', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }), // 合計金額
          fc.integer({ min: 1, max: 50 }).chain(count =>
            fc.tuple(
              fc.constant(count),
              fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: count, maxLength: count })
            )
          ), // メンバー数とメンバーID配列
          (total, [count, memberIds]) => {
            // 一律割のテスト
            const evenResults = splitEvenly(total, memberIds)
            const evenSum = evenResults.reduce((acc, r) => acc + r.amount, 0)
            expect(evenSum).toBe(total)
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('比率配分でも分割金額の合計がレシート合計金額と正確に一致しなければならない', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }), // 合計金額
          fc.integer({ min: 1, max: 50 }).chain(count =>
            fc.array(
              fc.record({
                memberId: fc.string({ minLength: 1, maxLength: 10 }),
                ratio: fc.integer({ min: 1, max: 1000 })
              }),
              { minLength: count, maxLength: count }
            )
          ), // 比率入力配列
          (total, ratioInputs) => {
            const results = splitByRatio(total, ratioInputs)
            const sum = results.reduce((acc, r) => acc + r.amount, 0)
            expect(sum).toBe(total)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
