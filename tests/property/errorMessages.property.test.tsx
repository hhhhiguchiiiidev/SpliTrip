import { describe, it, expect, vi } from 'vitest'
import * as fc from 'fast-check'
import { render, screen, cleanup } from '@testing-library/react'
import FormError from '../../src/components/FormError'
import {
  validateTripName,
  validateMemberName,
  validateReceiptAmount,
  validatePayerId,
  validateSelectedMembers,
  validateFixedAmountSum,
  validateRatios
} from '@shared/utils/validation'

// Mock useToast to prevent toast messages from interfering with tests
vi.mock('../../src/hooks/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
    showSuccess: vi.fn(),
    showError: vi.fn(),
    toasts: []
  })
}))

describe('Error Message Display Property Tests', () => {
  // Feature: trip-management-enhancements, Property 18: エラーメッセージの表示
  // **検証: 要件 10.5**
  
  describe('Property 18: エラーメッセージの表示', () => {
    it('無効な旅行名に対して、システムは明確なエラーメッセージを表示しなければならない', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', '   ', '\t', '\n', '  \t\n  '), // 無効な旅行名
          (invalidTripName) => {
            const result = validateTripName(invalidTripName)
            
            // バリデーションが失敗することを確認
            expect(result.valid).toBe(false)
            
            // エラーメッセージが存在し、明確であることを確認
            expect(result.error).toBeDefined()
            expect(result.error).toBeTruthy()
            expect(typeof result.error).toBe('string')
            expect(result.error!.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('無効なメンバー名に対して、システムは明確なエラーメッセージを表示しなければならない', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', '   ', '\t', '\n', '  \t\n  '), // 無効なメンバー名
          (invalidMemberName) => {
            const result = validateMemberName(invalidMemberName)
            
            // バリデーションが失敗することを確認
            expect(result.valid).toBe(false)
            
            // エラーメッセージが存在し、明確であることを確認
            expect(result.error).toBeDefined()
            expect(result.error).toBeTruthy()
            expect(typeof result.error).toBe('string')
            expect(result.error!.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('無効なレシート金額に対して、システムは明確なエラーメッセージを表示しなければならない', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000000, max: 0 }), // 無効な金額（0以下）
          (invalidAmount) => {
            const result = validateReceiptAmount(invalidAmount)
            
            // バリデーションが失敗することを確認
            expect(result.valid).toBe(false)
            
            // エラーメッセージが存在し、明確であることを確認
            expect(result.error).toBeDefined()
            expect(result.error).toBeTruthy()
            expect(typeof result.error).toBe('string')
            expect(result.error!.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('無効な支払い者IDに対して、システムは明確なエラーメッセージを表示しなければならない', () => {
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
            
            // エラーメッセージが存在し、明確であることを確認
            expect(result.error).toBeDefined()
            expect(result.error).toBeTruthy()
            expect(typeof result.error).toBe('string')
            expect(result.error!.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('空の支払い者IDに対して、システムは明確なエラーメッセージを表示しなければならない', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 50 }), // メンバーID配列
          (memberIds) => {
            const result = validatePayerId('', memberIds)
            
            // バリデーションが失敗することを確認
            expect(result.valid).toBe(false)
            
            // エラーメッセージが存在し、明確であることを確認
            expect(result.error).toBeDefined()
            expect(result.error).toBeTruthy()
            expect(typeof result.error).toBe('string')
            expect(result.error!.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('空の選択メンバーに対して、システムは明確なエラーメッセージを表示しなければならない', () => {
      const result = validateSelectedMembers([])
      
      // バリデーションが失敗することを確認
      expect(result.valid).toBe(false)
      
      // エラーメッセージが存在し、明確であることを確認
      expect(result.error).toBeDefined()
      expect(result.error).toBeTruthy()
      expect(typeof result.error).toBe('string')
      expect(result.error!.length).toBeGreaterThan(0)
    })

    it('不一致の金額指定合計に対して、システムは明確なエラーメッセージを表示しなければならない', () => {
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
            
            // エラーメッセージが存在し、明確であることを確認
            expect(result.error).toBeDefined()
            expect(result.error).toBeTruthy()
            expect(typeof result.error).toBe('string')
            expect(result.error!.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('無効な比率に対して、システムは明確なエラーメッセージを表示しなければならない', () => {
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
            
            // エラーメッセージが存在し、明確であることを確認
            expect(result.error).toBeDefined()
            expect(result.error).toBeTruthy()
            expect(typeof result.error).toBe('string')
            expect(result.error!.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('FormErrorコンポーネントは、エラーメッセージを視覚的に表示しなければならない', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0), // 空白のみを除外
          (errorMessage) => {
            const { container } = render(<FormError message={errorMessage} />)
            
            // role="alert"が設定されていることを確認（アクセシビリティ）
            const alertElement = container.querySelector('[role="alert"]')
            expect(alertElement).toBeInTheDocument()
            
            // エラーメッセージが表示されることを確認（テキストコンテンツで検証）
            expect(alertElement?.textContent).toContain(errorMessage)
            
            // エラーアイコンが表示されることを確認
            expect(alertElement?.textContent).toContain('⚠')
            
            // クリーンアップ
            cleanup()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('FormErrorコンポーネントは、エラーメッセージがない場合は何も表示しないこと', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(undefined, ''), // エラーメッセージなし
          (noMessage) => {
            const { container } = render(<FormError message={noMessage} />)
            
            // 何も表示されないことを確認
            const alertElement = container.querySelector('[role="alert"]')
            expect(alertElement).not.toBeInTheDocument()
            
            // クリーンアップ
            cleanup()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('すべてのバリデーション関数は、無効なデータに対して一貫したエラーメッセージ形式を返すこと', () => {
      // 無効なデータのサンプル
      const invalidInputs = [
        { fn: validateTripName, input: [''], name: 'validateTripName' },
        { fn: validateMemberName, input: [''], name: 'validateMemberName' },
        { fn: validateReceiptAmount, input: [0], name: 'validateReceiptAmount' },
        { fn: validatePayerId, input: ['', ['m1']], name: 'validatePayerId' },
        { fn: validateSelectedMembers, input: [[]], name: 'validateSelectedMembers' },
        { fn: validateFixedAmountSum, input: [[{ memberId: 'm1', amount: 100 }], 200], name: 'validateFixedAmountSum' },
        { fn: validateRatios, input: [[{ memberId: 'm1', ratio: 0 }]], name: 'validateRatios' }
      ]

      for (const { fn, input, name } of invalidInputs) {
        // @ts-expect-error - 動的な関数呼び出し
        const result = fn(...input)
        
        // バリデーションが失敗することを確認
        expect(result.valid).toBe(false)
        
        // エラーメッセージが一貫した形式であることを確認
        expect(result.error).toBeDefined()
        expect(typeof result.error).toBe('string')
        expect(result.error!.length).toBeGreaterThan(0)
        
        // エラーメッセージが日本語であることを確認（少なくとも1文字のひらがな、カタカナ、または漢字を含む）
        expect(result.error).toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/)
      }
    })
  })
})
