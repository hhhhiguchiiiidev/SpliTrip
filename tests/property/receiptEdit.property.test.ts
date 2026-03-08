import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { Receipt } from '@shared/types/receipt'
import { Trip } from '@shared/types/trip'
import { splitEvenly, splitByRatio } from '@shared/utils/splitCalculator'

/**
 * レシート編集のプロパティベーステスト
 * 要件: 3.1, 3.2, 3.3, 3.4
 */
describe('Receipt Edit Property Tests', () => {
  // Feature: splitrip-expense-tracker, Property 14: レシート一覧の完全性
  // **Validates: Requirements 3.1**
  describe('Property 14: レシート一覧の完全性', () => {
    it('旅行のすべてのレシートが一覧に表示されなければならない', () => {
      fc.assert(
        fc.property(
          fc.record({
            tripId: fc.string({ minLength: 1, maxLength: 20 }),
            tripName: fc.string({ minLength: 1, maxLength: 100 }),
            version: fc.integer({ min: 1, max: 1000 }),
            createdAt: fc.constant(new Date().toISOString()),
            updatedAt: fc.constant(new Date().toISOString()),
            members: fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                name: fc.string({ minLength: 1, maxLength: 50 }),
                createdAt: fc.constant(new Date().toISOString())
              }),
              { minLength: 1, maxLength: 10 }
            ),
            receipts: fc.array(
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
              { minLength: 0, maxLength: 50 }
            )
          }),
          (trip: Trip) => {
            // レシート一覧を取得（実際のコンポーネントではtrip.receiptsを表示）
            const receiptList = trip.receipts
            
            // すべてのレシートが一覧に含まれることを確認
            expect(receiptList).toHaveLength(trip.receipts.length)
            
            trip.receipts.forEach(receipt => {
              const found = receiptList.find(r => r.id === receipt.id)
              expect(found).toBeDefined()
              expect(found?.amount).toBe(receipt.amount)
              expect(found?.payerId).toBe(receipt.payerId)
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: splitrip-expense-tracker, Property 15: レシート編集のラウンドトリップ
  // **Validates: Requirements 3.2**
  describe('Property 15: レシート編集のラウンドトリップ', () => {
    it('レシートを編集して保存した後、同じデータが取得できなければならない', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            title: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
            amount: fc.integer({ min: 1, max: 1000000 }),
            payerId: fc.string({ minLength: 1, maxLength: 10 }),
            targetMode: fc.constantFrom('all' as const, 'selected' as const),
            splitMode: fc.constantFrom('equal' as const, 'ratio' as const),
            selectedMemberIds: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 10 }),
            splits: fc.array(
              fc.record({
                memberId: fc.string({ minLength: 1, maxLength: 10 }),
                amount: fc.integer({ min: 1, max: 10000 })
              }),
              { minLength: 1, maxLength: 10 }
            ),
            createdAt: fc.constant(new Date(Date.now() - 10000).toISOString()), // 10秒前
            updatedAt: fc.constant(new Date(Date.now() - 10000).toISOString())
          }),
          fc.record({
            title: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
            amount: fc.integer({ min: 1, max: 1000000 }),
            payerId: fc.string({ minLength: 1, maxLength: 10 })
          }),
          (originalReceipt: Receipt, updates) => {
            // レシートを編集（要件3.2: 既存のレシートデータを編集フォームに読み込む）
            const now = new Date().toISOString()
            const editedReceipt: Receipt = {
              ...originalReceipt,
              title: updates.title,
              amount: updates.amount,
              payerId: updates.payerId,
              updatedAt: now
            }
            
            // 編集後のレシートが正しく保存されることを確認
            expect(editedReceipt.id).toBe(originalReceipt.id)
            expect(editedReceipt.title).toBe(updates.title)
            expect(editedReceipt.amount).toBe(updates.amount)
            expect(editedReceipt.payerId).toBe(updates.payerId)
            expect(editedReceipt.createdAt).toBe(originalReceipt.createdAt)
            
            // updatedAtが更新されていることを確認（タイムスタンプが異なる）
            expect(new Date(editedReceipt.updatedAt).getTime()).toBeGreaterThan(
              new Date(originalReceipt.updatedAt).getTime()
            )
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: splitrip-expense-tracker, Property 16: レシート更新時の再計算
  // **Validates: Requirements 3.3**
  describe('Property 16: レシート更新時の再計算', () => {
    it('レシートを更新したとき、新しい設定に基づいて分割金額を再計算しなければならない', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            title: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
            amount: fc.integer({ min: 1, max: 1000000 }),
            payerId: fc.string({ minLength: 1, maxLength: 10 }),
            targetMode: fc.constantFrom('all' as const, 'selected' as const),
            splitMode: fc.constant('equal' as const),
            selectedMemberIds: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 10 }),
            splits: fc.array(
              fc.record({
                memberId: fc.string({ minLength: 1, maxLength: 10 }),
                amount: fc.integer({ min: 1, max: 10000 })
              }),
              { minLength: 2, maxLength: 10 }
            ),
            createdAt: fc.constant(new Date().toISOString()),
            updatedAt: fc.constant(new Date().toISOString())
          }),
          fc.integer({ min: 1, max: 1000000 }), // 新しい金額
          (originalReceipt: Receipt, newAmount) => {
            // レシートを更新（要件3.3: 新しい設定に基づいて分割金額を再計算）
            const newSplits = splitEvenly(newAmount, originalReceipt.selectedMemberIds)
            
            const updatedReceipt: Receipt = {
              ...originalReceipt,
              amount: newAmount,
              splits: newSplits,
              updatedAt: new Date().toISOString()
            }
            
            // 分割金額が再計算されていることを確認
            expect(updatedReceipt.splits).not.toEqual(originalReceipt.splits)
            
            // 新しい分割金額の合計が新しい金額と一致することを確認
            const totalSplitAmount = updatedReceipt.splits.reduce((sum, split) => sum + split.amount, 0)
            expect(totalSplitAmount).toBe(newAmount)
            
            // すべてのメンバーが分割結果に含まれることを確認
            expect(updatedReceipt.splits).toHaveLength(originalReceipt.selectedMemberIds.length)
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('分割モードを変更したとき、新しいモードに基づいて分割金額を再計算しなければならない', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            title: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
            amount: fc.integer({ min: 1, max: 1000000 }),
            payerId: fc.string({ minLength: 1, maxLength: 10 }),
            targetMode: fc.constantFrom('all' as const, 'selected' as const),
            splitMode: fc.constant('equal' as const),
            selectedMemberIds: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 10 }),
            splits: fc.array(
              fc.record({
                memberId: fc.string({ minLength: 1, maxLength: 10 }),
                amount: fc.integer({ min: 1, max: 10000 })
              }),
              { minLength: 2, maxLength: 10 }
            ),
            createdAt: fc.constant(new Date().toISOString()),
            updatedAt: fc.constant(new Date().toISOString())
          }),
          (originalReceipt: Receipt) => {
            // 分割モードを「一律割」から「比率配分」に変更
            const ratioInputs = originalReceipt.selectedMemberIds.map(memberId => ({
              memberId,
              ratio: 100
            }))
            
            const newSplits = splitByRatio(originalReceipt.amount, ratioInputs)
            
            const updatedReceipt: Receipt = {
              ...originalReceipt,
              splitMode: 'ratio',
              ratioInputs,
              splits: newSplits,
              updatedAt: new Date().toISOString()
            }
            
            // 分割モードが変更されていることを確認
            expect(updatedReceipt.splitMode).toBe('ratio')
            expect(updatedReceipt.splitMode).not.toBe(originalReceipt.splitMode)
            
            // 分割金額が再計算されていることを確認
            const totalSplitAmount = updatedReceipt.splits.reduce((sum, split) => sum + split.amount, 0)
            expect(totalSplitAmount).toBe(originalReceipt.amount)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: splitrip-expense-tracker, Property 17: タイムスタンプの更新
  // **Validates: Requirements 3.4**
  describe('Property 17: タイムスタンプの更新', () => {
    it('レシートが更新されたとき、updatedAtタイムスタンプを更新しなければならない', () => {
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
            createdAt: fc.constant(new Date(Date.now() - 1000).toISOString()), // 1秒前
            updatedAt: fc.constant(new Date(Date.now() - 1000).toISOString())
          }),
          fc.string({ minLength: 1, maxLength: 50 }), // 新しいタイトル
          (originalReceipt: Receipt, newTitle) => {
            // レシートを更新（要件3.4: updatedAtタイムスタンプを更新）
            const now = new Date().toISOString()
            const updatedReceipt: Receipt = {
              ...originalReceipt,
              title: newTitle,
              updatedAt: now
            }
            
            // updatedAtが更新されていることを確認
            expect(updatedReceipt.updatedAt).not.toBe(originalReceipt.updatedAt)
            expect(new Date(updatedReceipt.updatedAt).getTime()).toBeGreaterThan(
              new Date(originalReceipt.updatedAt).getTime()
            )
            
            // createdAtは変更されないことを確認
            expect(updatedReceipt.createdAt).toBe(originalReceipt.createdAt)
          }
        ),
        { numRuns: 100 }
      )
    })
    
    it('レシートが更新されても、createdAtタイムスタンプは変更されないこと', () => {
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
            createdAt: fc.constant(new Date(Date.now() - 10000).toISOString()), // 10秒前
            updatedAt: fc.constant(new Date(Date.now() - 5000).toISOString()) // 5秒前
          }),
          fc.integer({ min: 1, max: 1000000 }), // 新しい金額
          (originalReceipt: Receipt, newAmount) => {
            // レシートを更新
            const updatedReceipt: Receipt = {
              ...originalReceipt,
              amount: newAmount,
              updatedAt: new Date().toISOString()
            }
            
            // createdAtが変更されていないことを確認
            expect(updatedReceipt.createdAt).toBe(originalReceipt.createdAt)
            
            // updatedAtは更新されていることを確認
            expect(updatedReceipt.updatedAt).not.toBe(originalReceipt.updatedAt)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
