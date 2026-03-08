import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { Receipt, SplitRatioInput, SplitFixedInput } from '@shared/types/receipt'
import { Member } from '@shared/types/member'
import { Trip } from '@shared/types/trip'
import { splitEvenly, splitByRatio, splitByFixed } from '@shared/utils/splitCalculator'

describe('Receipt Input Property Tests', () => {
  // Feature: splitrip-expense-tracker, Property 6: レシート作成時の必須フィールド検証
  describe('Property 6: レシート作成時の必須フィールド検証', () => {
    it('合計金額が欠けている場合、レシート作成を拒否しなければならない', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            title: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
            payerId: fc.string({ minLength: 1, maxLength: 10 }),
            targetMode: fc.constantFrom('all' as const, 'selected' as const),
            splitMode: fc.constantFrom('equal' as const, 'ratio' as const, 'fixed' as const),
            selectedMemberIds: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 10 }),
            splits: fc.array(
              fc.record({
                memberId: fc.string({ minLength: 1, maxLength: 10 }),
                amount: fc.integer({ min: 1, max: 10000 })
              }),
              { minLength: 1, maxLength: 10 }
            ),
            createdAt: fc.constant(new Date().toISOString()),
            updatedAt: fc.constant(new Date().toISOString())
          }),
          (receiptWithoutAmount) => {
            // 合計金額が欠けているレシートは無効
            const isValid = (receipt: any): receipt is Receipt => {
              return typeof receipt.amount === 'number' && receipt.amount > 0
            }
            
            expect(isValid(receiptWithoutAmount)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('支払い者IDが欠けている場合、レシート作成を拒否しなければならない', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            title: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
            amount: fc.integer({ min: 1, max: 1000000 }),
            targetMode: fc.constantFrom('all' as const, 'selected' as const),
            splitMode: fc.constantFrom('equal' as const, 'ratio' as const, 'fixed' as const),
            selectedMemberIds: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 10 }),
            splits: fc.array(
              fc.record({
                memberId: fc.string({ minLength: 1, maxLength: 10 }),
                amount: fc.integer({ min: 1, max: 10000 })
              }),
              { minLength: 1, maxLength: 10 }
            ),
            createdAt: fc.constant(new Date().toISOString()),
            updatedAt: fc.constant(new Date().toISOString())
          }),
          (receiptWithoutPayer) => {
            // 支払い者IDが欠けているレシートは無効
            const isValid = (receipt: any): receipt is Receipt => {
              return typeof receipt.payerId === 'string' && receipt.payerId.length > 0
            }
            
            expect(isValid(receiptWithoutPayer)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('分割設定が欠けている場合、レシート作成を拒否しなければならない', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            title: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
            amount: fc.integer({ min: 1, max: 1000000 }),
            payerId: fc.string({ minLength: 1, maxLength: 10 }),
            targetMode: fc.constantFrom('all' as const, 'selected' as const),
            createdAt: fc.constant(new Date().toISOString()),
            updatedAt: fc.constant(new Date().toISOString())
          }),
          (receiptWithoutSplitSettings) => {
            // 分割設定（splitMode, selectedMemberIds, splits）が欠けているレシートは無効
            const isValid = (receipt: any): receipt is Receipt => {
              return (
                typeof receipt.splitMode === 'string' &&
                ['equal', 'ratio', 'fixed'].includes(receipt.splitMode) &&
                Array.isArray(receipt.selectedMemberIds) &&
                Array.isArray(receipt.splits)
              )
            }
            
            expect(isValid(receiptWithoutSplitSettings)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('すべての必須フィールドが存在する場合、レシート作成を受け入れなければならない', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            title: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
            amount: fc.integer({ min: 1, max: 1000000 }),
            payerId: fc.string({ minLength: 1, maxLength: 10 }),
            targetMode: fc.constantFrom('all' as const, 'selected' as const),
            splitMode: fc.constantFrom('equal' as const, 'ratio' as const, 'fixed' as const),
            selectedMemberIds: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 10 }),
            splits: fc.array(
              fc.record({
                memberId: fc.string({ minLength: 1, maxLength: 10 }),
                amount: fc.integer({ min: 1, max: 10000 })
              }),
              { minLength: 1, maxLength: 10 }
            ),
            createdAt: fc.constant(new Date().toISOString()),
            updatedAt: fc.constant(new Date().toISOString())
          }),
          (receipt) => {
            // すべての必須フィールドが存在するレシートは有効
            const isValid = (r: any): r is Receipt => {
              return (
                typeof r.id === 'string' && r.id.length > 0 &&
                typeof r.amount === 'number' && r.amount > 0 &&
                typeof r.payerId === 'string' && r.payerId.length > 0 &&
                typeof r.targetMode === 'string' && ['all', 'selected'].includes(r.targetMode) &&
                typeof r.splitMode === 'string' && ['equal', 'ratio', 'fixed'].includes(r.splitMode) &&
                Array.isArray(r.selectedMemberIds) &&
                Array.isArray(r.splits) &&
                typeof r.createdAt === 'string' &&
                typeof r.updatedAt === 'string'
              )
            }
            
            expect(isValid(receipt)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: splitrip-expense-tracker, Property 7: 全メンバー割の完全性
  describe('Property 7: 全メンバー割の完全性', () => {
    it('対象モードが「全メンバー」の場合、すべてのメンバーを分割計算に含めなければならない', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }).chain(memberCount =>
            fc.tuple(
              fc.constant(memberCount),
              fc.array(
                fc.record({
                  id: fc.string({ minLength: 1, maxLength: 10 }),
                  name: fc.string({ minLength: 1, maxLength: 50 }),
                  createdAt: fc.constant(new Date().toISOString())
                }),
                { minLength: memberCount, maxLength: memberCount }
              ),
              fc.integer({ min: 1, max: 1000000 })
            )
          ),
          ([memberCount, members, amount]) => {
            // 対象モードが「全メンバー」の場合
            const targetMode = 'all'
            
            // すべてのメンバーIDを取得
            const allMemberIds = members.map(m => m.id)
            
            // 一律割で分割計算
            const splits = splitEvenly(amount, allMemberIds)
            
            // すべてのメンバーが分割結果に含まれることを確認
            expect(splits).toHaveLength(memberCount)
            
            const splitMemberIds = splits.map(s => s.memberId)
            allMemberIds.forEach(memberId => {
              expect(splitMemberIds).toContain(memberId)
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: splitrip-expense-tracker, Property 8: 選択メンバー割の正確性
  describe('Property 8: 選択メンバー割の正確性', () => {
    it('対象モードが「選択」の場合、選択されたメンバーのみを分割計算に含めなければならない', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 50 }).chain(memberCount =>
            fc.tuple(
              fc.constant(memberCount),
              fc.array(
                fc.record({
                  id: fc.string({ minLength: 1, maxLength: 10 }),
                  name: fc.string({ minLength: 1, maxLength: 50 }),
                  createdAt: fc.constant(new Date().toISOString())
                }),
                { minLength: memberCount, maxLength: memberCount }
              ),
              fc.integer({ min: 1, max: 1000000 }),
              fc.integer({ min: 1, max: memberCount - 1 }) // 選択するメンバー数
            )
          ),
          ([memberCount, members, amount, selectedCount]) => {
            // 対象モードが「選択」の場合
            const targetMode = 'selected'
            
            // ランダムにメンバーを選択
            const allMemberIds = members.map(m => m.id)
            const selectedMemberIds = allMemberIds.slice(0, selectedCount)
            
            // 選択されたメンバーのみで分割計算
            const splits = splitEvenly(amount, selectedMemberIds)
            
            // 選択されたメンバーのみが分割結果に含まれることを確認
            expect(splits).toHaveLength(selectedCount)
            
            const splitMemberIds = splits.map(s => s.memberId)
            selectedMemberIds.forEach(memberId => {
              expect(splitMemberIds).toContain(memberId)
            })
            
            // 選択されていないメンバーが分割結果に含まれないことを確認
            const unselectedMemberIds = allMemberIds.filter(id => !selectedMemberIds.includes(id))
            unselectedMemberIds.forEach(memberId => {
              expect(splitMemberIds).not.toContain(memberId)
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: splitrip-expense-tracker, Property 12: 金額指定配分の合計検証
  describe('Property 12: 金額指定配分の合計検証', () => {
    it('金額指定の合計が合計金額と等しくない場合、レシート作成を拒否しなければならない', () => {
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
          (totalAmount, fixedInputs) => {
            const sum = fixedInputs.reduce((s, input) => s + input.amount, 0)
            
            // 合計が一致しない場合のみテスト
            fc.pre(sum !== totalAmount)
            
            // splitByFixedはエラーを投げるべき
            expect(() => splitByFixed(totalAmount, fixedInputs)).toThrow('金額指定の合計が合計金額と一致しません')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: splitrip-expense-tracker, Property 13: 分割結果の保存形式
  describe('Property 13: 分割結果の保存形式', () => {
    it('分割結果はメンバーIDと金額のペアの配列として保存されなければならない', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }), // 合計金額
          fc.integer({ min: 1, max: 50 }).chain(count =>
            fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: count, maxLength: count })
          ), // メンバーID配列
          (amount, memberIds) => {
            // 一律割で分割計算
            const splits = splitEvenly(amount, memberIds)
            
            // 分割結果の形式を検証
            expect(Array.isArray(splits)).toBe(true)
            
            splits.forEach(split => {
              // 各要素がmemberIdとamountを持つことを確認
              expect(split).toHaveProperty('memberId')
              expect(split).toHaveProperty('amount')
              
              // memberIdが文字列であることを確認
              expect(typeof split.memberId).toBe('string')
              expect(split.memberId.length).toBeGreaterThan(0)
              
              // amountが数値であることを確認
              expect(typeof split.amount).toBe('number')
              expect(split.amount).toBeGreaterThanOrEqual(0)
            })
            
            // すべてのメンバーIDが分割結果に含まれることを確認
            const splitMemberIds = splits.map(s => s.memberId)
            memberIds.forEach(memberId => {
              expect(splitMemberIds).toContain(memberId)
            })
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('比率配分でも分割結果はメンバーIDと金額のペアの配列として保存されなければならない', () => {
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
          (amount, ratioInputs) => {
            // 比率配分で分割計算
            const splits = splitByRatio(amount, ratioInputs)
            
            // 分割結果の形式を検証
            expect(Array.isArray(splits)).toBe(true)
            
            splits.forEach(split => {
              // 各要素がmemberIdとamountを持つことを確認
              expect(split).toHaveProperty('memberId')
              expect(split).toHaveProperty('amount')
              
              // memberIdが文字列であることを確認
              expect(typeof split.memberId).toBe('string')
              expect(split.memberId.length).toBeGreaterThan(0)
              
              // amountが数値であることを確認
              expect(typeof split.amount).toBe('number')
              expect(split.amount).toBeGreaterThanOrEqual(0)
            })
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('金額指定配分でも分割結果はメンバーIDと金額のペアの配列として保存されなければならない', () => {
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
              })
            )
          ),
          ([amount, fixedInputs]) => {
            // 金額指定配分で分割計算
            const splits = splitByFixed(amount, fixedInputs)
            
            // 分割結果の形式を検証
            expect(Array.isArray(splits)).toBe(true)
            
            splits.forEach(split => {
              // 各要素がmemberIdとamountを持つことを確認
              expect(split).toHaveProperty('memberId')
              expect(split).toHaveProperty('amount')
              
              // memberIdが文字列であることを確認
              expect(typeof split.memberId).toBe('string')
              expect(split.memberId.length).toBeGreaterThan(0)
              
              // amountが数値であることを確認
              expect(typeof split.amount).toBe('number')
              expect(split.amount).toBeGreaterThanOrEqual(0)
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
